"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { SubjectType } from "@prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/rbac";
import { getActiveSession } from "@/lib/school";

export type SubjectFormState = { error?: string; values?: Record<string, string> };

function formValues(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string" && !k.startsWith("$")) out[k] = v;
  }
  return out;
}

export async function createSubject(
  _prev: SubjectFormState,
  formData: FormData,
): Promise<SubjectFormState> {
  const actor = await requirePermission("academics", "create");

  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim().toUpperCase() || null;
  const type = String(formData.get("type") ?? "CORE") as SubjectType;

  if (!name) return { error: "Give the subject a name.", values: formValues(formData) };
  if (!Object.values(SubjectType).includes(type))
    return { error: "Choose core or optional.", values: formValues(formData) };

  const clash = await db.subject.findFirst({
    where: { OR: [{ name }, ...(code ? [{ code }] : [])] },
  });
  if (clash)
    return {
      error:
        clash.name === name
          ? `A subject called "${name}" already exists.`
          : `Code ${code} is already used by ${clash.name}.`,
      values: formValues(formData),
    };

  await db.subject.create({ data: { name, code, type } });
  await audit(actor, "academics", "subject_created", `${name}${code ? ` (${code})` : ""}`);
  revalidatePath("/academics/subjects");
  redirect("/academics/subjects");
}

export async function setSubjectArchived(formData: FormData) {
  const actor = await requirePermission("academics", "archive");
  const id = String(formData.get("id") ?? "");
  const archived = String(formData.get("archived") ?? "") === "true";

  const subject = await db.subject.findUnique({ where: { id } });
  if (!subject) return;

  await db.subject.update({ where: { id }, data: { archived } });
  await audit(actor, "academics", archived ? "subject_archived" : "subject_restored", subject.name);
  revalidatePath("/academics/subjects");
}

/** Toggles whether a class takes a subject. */
export async function toggleClassSubject(formData: FormData) {
  const actor = await requirePermission("academics", "edit");
  const classId = String(formData.get("classId") ?? "");
  const subjectId = String(formData.get("subjectId") ?? "");
  const on = String(formData.get("value") ?? "") === "true";

  const [cls, subject] = await Promise.all([
    db.schoolClass.findUnique({ where: { id: classId } }),
    db.subject.findUnique({ where: { id: subjectId } }),
  ]);
  if (!cls || !subject) return;

  if (on) {
    await db.classSubject.upsert({
      where: { classId_subjectId: { classId, subjectId } },
      update: {},
      create: { classId, subjectId },
    });
  } else {
    await db.classSubject.deleteMany({ where: { classId, subjectId } });
  }

  await audit(
    actor,
    "academics",
    on ? "class_subject_added" : "class_subject_removed",
    `${subject.name} ${on ? "→" : "×"} ${cls.name}`,
  );
  revalidatePath("/academics/subjects");
}

/** Assigns (or clears) the subject teacher for a stream, active session. */
export async function assignSubjectTeacher(formData: FormData) {
  const actor = await requirePermission("academics", "edit");
  const streamId = String(formData.get("streamId") ?? "");
  const subjectId = String(formData.get("subjectId") ?? "");
  const teacherId = String(formData.get("teacherId") ?? "");

  const [stream, subject, session] = await Promise.all([
    db.stream.findUnique({ where: { id: streamId }, include: { class: true } }),
    db.subject.findUnique({ where: { id: subjectId } }),
    getActiveSession(),
  ]);
  if (!stream || !subject || !session) return;

  if (!teacherId) {
    await db.subjectTeacher.deleteMany({
      where: { streamId, subjectId, sessionId: session.id },
    });
    await audit(
      actor,
      "academics",
      "subject_teacher_cleared",
      `${subject.name} · ${stream.class.name} ${stream.name}`,
    );
    revalidatePath("/academics/subjects");
    return;
  }

  const teacher = await db.user.findUnique({ where: { id: teacherId } });
  if (!teacher || teacher.role !== "TEACHER" || !teacher.active) return;

  await db.subjectTeacher.upsert({
    where: { streamId_subjectId_sessionId: { streamId, subjectId, sessionId: session.id } },
    update: { teacherId },
    create: { streamId, subjectId, sessionId: session.id, teacherId },
  });

  await audit(
    actor,
    "academics",
    "subject_teacher_assigned",
    `${teacher.name} → ${subject.name} · ${stream.class.name} ${stream.name} (${session.name})`,
  );
  revalidatePath("/academics/subjects");
}
