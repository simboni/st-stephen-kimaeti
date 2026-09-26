"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/rbac";
import { getActiveSession } from "@/lib/school";

export type ExamFormState = { error?: string; values?: Record<string, string> };

function formValues(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string" && !k.startsWith("$")) out[k] = v;
  }
  return out;
}

export async function createExam(
  _prev: ExamFormState,
  formData: FormData,
): Promise<ExamFormState> {
  const actor = await requirePermission("exams", "create");
  const vals = () => formValues(formData);

  const name = String(formData.get("name") ?? "").trim();
  const termId = String(formData.get("termId") ?? "");
  const maxMarks = Number.parseInt(String(formData.get("maxMarks") ?? "100"), 10);

  if (!name) return { error: "Name the exam, e.g. End-Term 1 Exam.", values: vals() };
  if (!termId) return { error: "Choose the term the exam belongs to.", values: vals() };
  if (!Number.isInteger(maxMarks) || maxMarks < 1 || maxMarks > 1000)
    return { error: "Max marks must be a whole number between 1 and 1000.", values: vals() };

  const session = await getActiveSession();
  if (!session) return { error: "No active session — set one in Settings first.", values: vals() };
  const term = session.terms.find((t) => t.id === termId);
  if (!term) return { error: "That term is not part of the active session.", values: vals() };

  const exists = await db.exam.findUnique({ where: { termId_name: { termId, name } } });
  if (exists) return { error: `"${name}" already exists in ${term.name}.`, values: vals() };

  await db.exam.create({ data: { name, termId, sessionId: session.id, maxMarks } });
  await audit(actor, "exams", "exam_created", `${name} · ${term.name} · out of ${maxMarks}`);
  revalidatePath("/exams");
  redirect("/exams");
}

export async function setExamPublished(formData: FormData) {
  const actor = await requirePermission("exams", "edit");
  const id = String(formData.get("id") ?? "");
  const published = String(formData.get("published") ?? "") === "true";

  const exam = await db.exam.findUnique({ where: { id }, include: { term: true } });
  if (!exam) return;

  await db.exam.update({ where: { id }, data: { published } });
  await audit(
    actor,
    "exams",
    published ? "exam_published" : "exam_unpublished",
    `${exam.name} · ${exam.term.name}`,
  );
  revalidatePath("/exams");
  revalidatePath("/");
}

export async function setExamArchived(formData: FormData) {
  const actor = await requirePermission("exams", "archive");
  const id = String(formData.get("id") ?? "");
  const archived = String(formData.get("archived") ?? "") === "true";

  const exam = await db.exam.findUnique({ where: { id }, include: { term: true } });
  if (!exam) return;

  await db.exam.update({ where: { id }, data: { archived } });
  await audit(
    actor,
    "exams",
    archived ? "exam_archived" : "exam_restored",
    `${exam.name} · ${exam.term.name}`,
  );
  revalidatePath("/exams");
}

/** Saves the hand-written report-card remarks for one pupil in one exam. */
export async function saveReportRemarks(formData: FormData) {
  const actor = await requirePermission("exams", "create");
  const examId = String(formData.get("examId") ?? "");
  const enrollmentId = String(formData.get("enrollmentId") ?? "");
  const teacherRemark = String(formData.get("teacherRemark") ?? "").trim() || null;
  const headRemark = String(formData.get("headRemark") ?? "").trim() || null;

  const [exam, enrollment] = await Promise.all([
    db.exam.findUnique({ where: { id: examId } }),
    db.enrollment.findUnique({ where: { id: enrollmentId }, include: { student: true } }),
  ]);
  if (!exam || exam.archived || !enrollment) return;

  await db.reportRemark.upsert({
    where: { examId_enrollmentId: { examId, enrollmentId } },
    update: { teacherRemark, headRemark, updatedBy: actor.username },
    create: { examId, enrollmentId, teacherRemark, headRemark, updatedBy: actor.username },
  });
  await audit(
    actor,
    "exams",
    "report_remarks_saved",
    `${enrollment.student.admissionNo} · ${exam.name}`,
  );
  revalidatePath(`/exams/${examId}/report/${enrollment.studentId}`);
  redirect(`/exams/${examId}/report/${enrollment.studentId}?saved=1`);
}

/** Saves a whole stream's marks for one subject in a single submit. */
export async function saveMarks(formData: FormData) {
  const actor = await requirePermission("exams", "create");

  const examId = String(formData.get("examId") ?? "");
  const streamId = String(formData.get("streamId") ?? "");
  const subjectId = String(formData.get("subjectId") ?? "");

  const [exam, stream, subject] = await Promise.all([
    db.exam.findUnique({ where: { id: examId } }),
    db.stream.findUnique({ where: { id: streamId }, include: { class: true } }),
    db.subject.findUnique({ where: { id: subjectId } }),
  ]);
  if (!exam || exam.archived || !stream || !subject) return;

  const enrollments = await db.enrollment.findMany({
    where: { streamId, sessionId: exam.sessionId, student: { archived: false } },
    select: { id: true },
  });

  let saved = 0;
  let absent = 0;
  for (const e of enrollments) {
    const isAbsent = String(formData.get(`ab_${e.id}`) ?? "") === "on";
    const raw = String(formData.get(`sc_${e.id}`) ?? "").trim();

    let score: number | null;
    if (isAbsent) {
      score = null;
      absent += 1;
    } else {
      if (raw === "") continue; // untouched — keep whatever exists
      const parsed = Number.parseInt(raw, 10);
      if (!Number.isInteger(parsed) || parsed < 0 || parsed > exam.maxMarks) continue;
      score = parsed;
      saved += 1;
    }

    await db.mark.upsert({
      where: {
        examId_enrollmentId_subjectId: { examId, enrollmentId: e.id, subjectId },
      },
      update: { score, enteredBy: actor.username },
      create: { examId, enrollmentId: e.id, subjectId, score, enteredBy: actor.username },
    });
  }

  await audit(
    actor,
    "exams",
    "marks_saved",
    `${exam.name} · ${stream.class.name} ${stream.name} · ${subject.name} · ${saved} scored, ${absent} absent`,
  );
  revalidatePath(`/exams/${examId}`);
  redirect(`/exams/${examId}?stream=${streamId}&subject=${subjectId}&saved=1`);
}
