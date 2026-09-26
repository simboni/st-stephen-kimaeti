"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/rbac";
import { requireUser } from "@/lib/auth";
import { getActiveSession } from "@/lib/school";

export type HomeworkFormState = { error?: string; values?: Record<string, string> };

function formValues(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string" && !k.startsWith("$")) out[k] = v;
  }
  return out;
}

function parseDay(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function createHomework(
  _prev: HomeworkFormState,
  formData: FormData,
): Promise<HomeworkFormState> {
  const actor = await requirePermission("homework", "create");
  const vals = () => formValues(formData);

  const streamId = String(formData.get("streamId") ?? "");
  const subjectId = String(formData.get("subjectId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const instructions = String(formData.get("instructions") ?? "").trim();
  const dueDate = parseDay(String(formData.get("dueDate") ?? ""));

  if (!streamId) return { error: "Choose the stream.", values: vals() };
  if (!subjectId) return { error: "Choose the subject.", values: vals() };
  if (!title) return { error: "Give the homework a title.", values: vals() };
  if (!instructions) return { error: "Write the instructions.", values: vals() };
  if (!dueDate) return { error: "Pick the due date.", values: vals() };

  const session = await getActiveSession();
  if (!session) return { error: "No active session — set one in Settings first.", values: vals() };

  const [stream, subject] = await Promise.all([
    db.stream.findUnique({ where: { id: streamId }, include: { class: true } }),
    db.subject.findUnique({ where: { id: subjectId } }),
  ]);
  if (!stream || !subject) return { error: "Stream or subject not found.", values: vals() };

  const takes = await db.classSubject.findUnique({
    where: { classId_subjectId: { classId: stream.classId, subjectId } },
  });
  if (!takes)
    return { error: `${stream.class.name} does not take ${subject.name}.`, values: vals() };

  const homework = await db.homework.create({
    data: { streamId, subjectId, sessionId: session.id, title, instructions, dueDate, createdBy: actor.username },
  });

  await audit(
    actor,
    "homework",
    "homework_posted",
    `${stream.class.name} ${stream.name} · ${subject.name} · ${title} · due ${dueDate.toISOString().slice(0, 10)}`,
  );
  revalidatePath("/homework");
  redirect(`/homework/${homework.id}`);
}

export async function setHomeworkArchived(formData: FormData) {
  const actor = await requirePermission("homework", "archive");
  const id = String(formData.get("id") ?? "");
  const archived = String(formData.get("archived") ?? "") === "true";

  const homework = await db.homework.findUnique({
    where: { id },
    include: { stream: { include: { class: true } }, subject: true },
  });
  if (!homework) return;

  await db.homework.update({ where: { id }, data: { archived } });
  await audit(
    actor,
    "homework",
    archived ? "homework_archived" : "homework_restored",
    `${homework.stream.class.name} ${homework.stream.name} · ${homework.title}`,
  );
  revalidatePath("/homework");
  revalidatePath(`/homework/${id}`);
}

/** A pupil marks their own homework as done (from their dashboard). */
export async function markHomeworkDone(formData: FormData) {
  const actor = await requireUser();
  if (actor.role !== "STUDENT") return;

  const homeworkId = String(formData.get("homeworkId") ?? "");
  const note = String(formData.get("note") ?? "").trim() || null;

  const [homework, student] = await Promise.all([
    db.homework.findUnique({ where: { id: homeworkId } }),
    db.student.findFirst({ where: { userId: actor.id } }),
  ]);
  if (!homework || homework.archived || !student) return;

  const enrollment = await db.enrollment.findUnique({
    where: { studentId_sessionId: { studentId: student.id, sessionId: homework.sessionId } },
  });
  if (!enrollment || enrollment.streamId !== homework.streamId) return;

  await db.homeworkSubmission.upsert({
    where: { homeworkId_enrollmentId: { homeworkId, enrollmentId: enrollment.id } },
    update: { note },
    create: { homeworkId, enrollmentId: enrollment.id, note },
  });
  await audit(actor, "homework", "homework_marked_done", `${student.admissionNo} · ${homework.title}`);
  revalidatePath("/");
}

/** The teacher evaluates one pupil's submission with a remark. */
export async function evaluateSubmission(formData: FormData) {
  const actor = await requirePermission("homework", "edit");
  const homeworkId = String(formData.get("homeworkId") ?? "");
  const enrollmentId = String(formData.get("enrollmentId") ?? "");
  const remark = String(formData.get("remark") ?? "").trim() || null;

  const submission = await db.homeworkSubmission.findUnique({
    where: { homeworkId_enrollmentId: { homeworkId, enrollmentId } },
    include: {
      homework: true,
      enrollment: { include: { student: true } },
    },
  });
  if (!submission) return;

  await db.homeworkSubmission.update({
    where: { id: submission.id },
    data: { evaluated: true, remark, evaluatedBy: actor.username },
  });
  await audit(
    actor,
    "homework",
    "homework_evaluated",
    `${submission.enrollment.student.admissionNo} · ${submission.homework.title}${remark ? ` — ${remark}` : ""}`,
  );
  revalidatePath(`/homework/${homeworkId}`);
  revalidatePath("/");
}
