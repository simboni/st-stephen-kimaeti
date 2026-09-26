"use server";

import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { MODULES, type Action, type Module } from "@/lib/rbac";

const ACTIONS: Action[] = ["view", "create", "edit", "archive"];

export async function togglePermission(formData: FormData) {
  // Only the Super Admin edits the permission matrix.
  const actor = await requireUser();
  if (actor.role !== "SUPER_ADMIN") return;

  const role = String(formData.get("role") ?? "") as Role;
  const mod = String(formData.get("module") ?? "") as Module;
  const action = String(formData.get("action") ?? "") as Action;
  const value = String(formData.get("value") ?? "") === "true";

  if (!Object.values(Role).includes(role) || role === "SUPER_ADMIN") return;
  if (!MODULES.includes(mod) || !ACTIONS.includes(action)) return;

  const column = { view: "canView", create: "canCreate", edit: "canEdit", archive: "canArchive" }[action];

  await db.rolePermission.upsert({
    where: { role_module: { role, module: mod } },
    update: { [column]: value },
    create: {
      role,
      module: mod,
      canView: action === "view" ? value : false,
      canCreate: action === "create" ? value : false,
      canEdit: action === "edit" ? value : false,
      canArchive: action === "archive" ? value : false,
    },
  });

  await audit(actor, "settings", "permission_changed", `${role} · ${mod} · ${action} → ${value ? "on" : "off"}`);
  revalidatePath("/settings/permissions");
}
