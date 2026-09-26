"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/rbac";

/** `values` echoes the submission back on error — React 19 resets form
    fields after an action, so forms re-seed their defaults from it. */
export type UserFormState = { error?: string; values?: Record<string, string> };

function formValues(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string" && !k.startsWith("$") && k !== "password") out[k] = v;
  }
  return out;
}

const ROLES = Object.values(Role);

function parseRole(value: string): Role | null {
  return (ROLES as string[]).includes(value) ? (value as Role) : null;
}

/** Non-super-admins can never grant a role equal/above their own station. */
function assignableBy(actorRole: Role): Role[] {
  if (actorRole === "SUPER_ADMIN") return ROLES;
  return ROLES.filter((r) => r !== "SUPER_ADMIN" && r !== "ADMIN");
}

export async function createUser(_prev: UserFormState, formData: FormData): Promise<UserFormState> {
  const actor = await requirePermission("users", "create");

  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const password = String(formData.get("password") ?? "");
  const role = parseRole(String(formData.get("role") ?? ""));

  if (!/^[a-z0-9._-]{3,30}$/.test(username))
    return { error: "Username must be 3–30 characters (letters, numbers, dots, dashes).", values: formValues(formData) };
  if (!name) return { error: "Enter the person's full name.", values: formValues(formData) };
  if (!role) return { error: "Choose a role.", values: formValues(formData) };
  if (!assignableBy(actor.role).includes(role))
    return { error: "You are not allowed to create users with that role.", values: formValues(formData) };
  if (password.length < 8) return { error: "Password must be at least 8 characters.", values: formValues(formData) };

  const exists = await db.user.findUnique({ where: { username } });
  if (exists) return { error: `Username "${username}" is already taken.`, values: formValues(formData) };

  const user = await db.user.create({
    data: {
      username,
      name,
      email,
      phone,
      role,
      passwordHash: await bcrypt.hash(password, 10),
      mustChangePassword: true,
    },
  });
  await audit(actor, "users", "user_created", `${user.username} (${user.role})`);
  revalidatePath("/users");
  redirect("/users");
}

export async function updateUser(_prev: UserFormState, formData: FormData): Promise<UserFormState> {
  const actor = await requirePermission("users", "edit");
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const role = parseRole(String(formData.get("role") ?? ""));

  const target = await db.user.findUnique({ where: { id } });
  if (!target) return { error: "User not found." };
  if (!name) return { error: "Enter the person's full name.", values: formValues(formData) };
  if (!role) return { error: "Choose a role.", values: formValues(formData) };

  const changingRole = role !== target.role;
  if (changingRole) {
    if (target.role === "SUPER_ADMIN" && actor.role !== "SUPER_ADMIN")
      return { error: "Only the Super Admin can change a Super Admin account." };
    if (!assignableBy(actor.role).includes(role))
      return { error: "You are not allowed to assign that role.", values: formValues(formData) };
  }

  await db.user.update({ where: { id }, data: { name, email, phone, role } });
  await audit(actor, "users", "user_updated", `${target.username}${changingRole ? ` role → ${role}` : ""}`);
  revalidatePath("/users");
  redirect("/users");
}

export async function setUserActive(formData: FormData) {
  const actor = await requirePermission("users", "archive");
  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  const reason = String(formData.get("reason") ?? "").trim();

  const target = await db.user.findUnique({ where: { id } });
  if (!target) return;
  if (target.id === actor.id) return; // never lock yourself out
  if (target.role === "SUPER_ADMIN" && actor.role !== "SUPER_ADMIN") return;

  await db.user.update({
    where: { id },
    data: { active, archiveReason: active ? null : reason || "No reason given" },
  });
  await audit(
    actor,
    "users",
    active ? "user_enabled" : "user_disabled",
    `${target.username}${!active && reason ? ` — ${reason}` : ""}`,
  );
  revalidatePath("/users");
}

export async function resetPassword(_prev: UserFormState, formData: FormData): Promise<UserFormState> {
  const actor = await requirePermission("users", "edit");
  const id = String(formData.get("id") ?? "");
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { error: "Password must be at least 8 characters.", values: formValues(formData) };

  const target = await db.user.findUnique({ where: { id } });
  if (!target) return { error: "User not found." };
  if (target.role === "SUPER_ADMIN" && actor.role !== "SUPER_ADMIN")
    return { error: "Only the Super Admin can reset a Super Admin password." };

  await db.user.update({
    where: { id },
    data: { passwordHash: await bcrypt.hash(password, 10), mustChangePassword: true },
  });
  await audit(actor, "users", "password_reset", target.username);
  revalidatePath("/users");
  redirect("/users");
}
