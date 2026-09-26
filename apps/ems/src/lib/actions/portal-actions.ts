"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/rbac";

/** One-time credentials echoed back to the admin who created them. */
export type PortalCredsState = {
  error?: string;
  username?: string;
  password?: string;
  note?: string;
};

function tempPassword(): string {
  // readable, 10 chars, no confusing 0/O/1/l
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(8);
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return `hc${out.slice(0, 8)}`;
}

/** Creates the pupil's own portal login (username = admission number). */
export async function createStudentLogin(
  _prev: PortalCredsState,
  formData: FormData,
): Promise<PortalCredsState> {
  const actor = await requirePermission("students", "edit");
  const studentId = String(formData.get("studentId") ?? "");

  const student = await db.student.findUnique({ where: { id: studentId } });
  if (!student) return { error: "Student not found." };
  if (student.userId) return { error: "This pupil already has a login." };

  const username = student.admissionNo.toLowerCase();
  const clash = await db.user.findUnique({ where: { username } });
  if (clash) return { error: `Username ${username} is already taken.` };

  const password = tempPassword();
  const user = await db.user.create({
    data: {
      username,
      name: `${student.firstName} ${student.lastName}`,
      role: "STUDENT",
      passwordHash: await bcrypt.hash(password, 10),
      mustChangePassword: true,
    },
  });
  await db.student.update({ where: { id: studentId }, data: { userId: user.id } });

  await audit(actor, "students", "student_login_created", `${username} for ${student.admissionNo}`);
  revalidatePath(`/students/${studentId}`);
  return { username, password, note: "Pupil login created — share these once." };
}

/** Creates a PARENT login from a guardian contact and links it to the pupil. */
export async function createParentLogin(
  _prev: PortalCredsState,
  formData: FormData,
): Promise<PortalCredsState> {
  const actor = await requirePermission("students", "edit");
  const guardianId = String(formData.get("guardianId") ?? "");

  const guardian = await db.guardian.findUnique({
    where: { id: guardianId },
    include: { student: true },
  });
  if (!guardian) return { error: "Guardian not found." };

  // If a parent account with this phone already exists, just link it.
  if (guardian.phone) {
    const existing = await db.user.findFirst({
      where: { role: "PARENT", phone: guardian.phone },
    });
    if (existing) {
      await db.parentLink.upsert({
        where: { userId_studentId: { userId: existing.id, studentId: guardian.studentId } },
        update: {},
        create: { userId: existing.id, studentId: guardian.studentId },
      });
      await audit(
        actor,
        "students",
        "parent_linked",
        `${existing.username} ↔ ${guardian.student.admissionNo}`,
      );
      revalidatePath(`/students/${guardian.studentId}`);
      return {
        username: existing.username,
        note: `${guardian.name} already had an account (matched by phone) — linked to this pupil. Their password is unchanged.`,
      };
    }
  }

  // build a username from the guardian's name
  const base = guardian.name.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "").slice(0, 24);
  let username = base || `parent.${guardian.student.admissionNo.toLowerCase()}`;
  for (let i = 2; await db.user.findUnique({ where: { username } }); i++) {
    username = `${base}${i}`;
  }

  const password = tempPassword();
  const user = await db.user.create({
    data: {
      username,
      name: guardian.name,
      role: "PARENT",
      phone: guardian.phone,
      email: guardian.email,
      passwordHash: await bcrypt.hash(password, 10),
      mustChangePassword: true,
      parentLinks: { create: { studentId: guardian.studentId } },
    },
  });

  await audit(
    actor,
    "students",
    "parent_login_created",
    `${user.username} (${guardian.name}) for ${guardian.student.admissionNo}`,
  );
  revalidatePath(`/students/${guardian.studentId}`);
  return { username, password, note: `Parent login for ${guardian.name} — share these once.` };
}

/** Links an existing PARENT account (by username) to a pupil. */
export async function linkParentByUsername(
  _prev: PortalCredsState,
  formData: FormData,
): Promise<PortalCredsState> {
  const actor = await requirePermission("students", "edit");
  const studentId = String(formData.get("studentId") ?? "");
  const username = String(formData.get("username") ?? "").trim().toLowerCase();

  const [student, user] = await Promise.all([
    db.student.findUnique({ where: { id: studentId } }),
    db.user.findUnique({ where: { username } }),
  ]);
  if (!student) return { error: "Student not found." };
  if (!user || user.role !== "PARENT")
    return { error: `No parent account with username "${username}".` };

  await db.parentLink.upsert({
    where: { userId_studentId: { userId: user.id, studentId } },
    update: {},
    create: { userId: user.id, studentId },
  });

  await audit(actor, "students", "parent_linked", `${username} ↔ ${student.admissionNo}`);
  revalidatePath(`/students/${studentId}`);
  return { username, note: `${user.name} linked to this pupil.` };
}
