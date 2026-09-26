"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { BoardingType, Gender } from "@prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/rbac";
import { getActiveSession } from "@/lib/school";
import { studentBalance } from "@/lib/fees";
import { formatMoney } from "@/lib/money";

export type StudentFormState = { error?: string; values?: Record<string, string> };

function formValues(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string" && !k.startsWith("$")) out[k] = v;
  }
  return out;
}

/** Next admission number: HC-<year><serial>, e.g. HC-260041. Manual override allowed. */
async function nextAdmissionNo(): Promise<string> {
  const year = new Date().getFullYear().toString().slice(-2);
  const count = await db.student.count();
  return `HC-${year}${String(count + 1).padStart(4, "0")}`;
}

function parseDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function guardiansFrom(formData: FormData) {
  const guardians: { relation: string; name: string; phone: string | null; email: string | null; occupation: string | null }[] = [];
  for (const i of [1, 2]) {
    const name = String(formData.get(`g${i}Name`) ?? "").trim();
    if (!name) continue;
    guardians.push({
      relation: String(formData.get(`g${i}Relation`) ?? "Guardian").trim() || "Guardian",
      name,
      phone: String(formData.get(`g${i}Phone`) ?? "").trim() || null,
      email: String(formData.get(`g${i}Email`) ?? "").trim() || null,
      occupation: String(formData.get(`g${i}Occupation`) ?? "").trim() || null,
    });
  }
  return guardians;
}

export async function admitStudent(
  _prev: StudentFormState,
  formData: FormData,
): Promise<StudentFormState> {
  const actor = await requirePermission("students", "create");
  const vals = () => formValues(formData);

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const gender = String(formData.get("gender") ?? "") as Gender;
  const boarding = String(formData.get("boarding") ?? "DAY") as BoardingType;
  const streamId = String(formData.get("streamId") ?? "");
  const admissionNoInput = String(formData.get("admissionNo") ?? "").trim().toUpperCase();
  const upiNumber = String(formData.get("upiNumber") ?? "").trim() || null;
  const dobInput = String(formData.get("dateOfBirth") ?? "").trim();
  const religion = String(formData.get("religion") ?? "").trim() || null;
  const address = String(formData.get("address") ?? "").trim() || null;
  const medicalNotes = String(formData.get("medicalNotes") ?? "").trim() || null;

  if (!firstName || !lastName) return { error: "Enter the pupil's full name.", values: vals() };
  if (!Object.values(Gender).includes(gender)) return { error: "Choose the pupil's gender.", values: vals() };
  if (!Object.values(BoardingType).includes(boarding))
    return { error: "Choose day scholar or boarder.", values: vals() };
  if (!streamId) return { error: "Choose the class/stream to enrol into.", values: vals() };

  const dateOfBirth = dobInput ? parseDate(dobInput) : null;
  if (dobInput && !dateOfBirth) return { error: "Date of birth is not a valid date.", values: vals() };

  const guardians = guardiansFrom(formData);
  if (guardians.length === 0)
    return { error: "Add at least one parent/guardian contact.", values: vals() };

  const session = await getActiveSession();
  if (!session) return { error: "No active session — set one in Settings first.", values: vals() };

  const stream = await db.stream.findUnique({ where: { id: streamId }, include: { class: true } });
  if (!stream || stream.archived) return { error: "That stream is unavailable.", values: vals() };

  const admissionNo = admissionNoInput || (await nextAdmissionNo());
  const admClash = await db.student.findUnique({ where: { admissionNo } });
  if (admClash) return { error: `Admission number ${admissionNo} is already taken.`, values: vals() };
  if (upiNumber) {
    const upiClash = await db.student.findUnique({ where: { upiNumber } });
    if (upiClash) return { error: `UPI number ${upiNumber} is already registered.`, values: vals() };
  }

  const student = await db.student.create({
    data: {
      admissionNo,
      upiNumber,
      firstName,
      lastName,
      gender,
      boarding,
      dateOfBirth,
      religion,
      address,
      medicalNotes,
      guardians: { create: guardians },
      enrollments: { create: { streamId, sessionId: session.id } },
    },
  });

  await audit(
    actor,
    "students",
    "student_admitted",
    `${admissionNo} ${firstName} ${lastName} → ${stream.class.name} ${stream.name} (${session.name})`,
  );
  revalidatePath("/students");
  redirect(`/students/${student.id}`);
}

export async function updateStudent(
  _prev: StudentFormState,
  formData: FormData,
): Promise<StudentFormState> {
  const actor = await requirePermission("students", "edit");
  const vals = () => formValues(formData);
  const id = String(formData.get("id") ?? "");

  const student = await db.student.findUnique({ where: { id } });
  if (!student) return { error: "Student not found." };

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const gender = String(formData.get("gender") ?? "") as Gender;
  const boarding = String(formData.get("boarding") ?? "DAY") as BoardingType;
  const upiNumber = String(formData.get("upiNumber") ?? "").trim() || null;
  const dobInput = String(formData.get("dateOfBirth") ?? "").trim();
  const religion = String(formData.get("religion") ?? "").trim() || null;
  const address = String(formData.get("address") ?? "").trim() || null;
  const medicalNotes = String(formData.get("medicalNotes") ?? "").trim() || null;
  const streamId = String(formData.get("streamId") ?? "");

  if (!firstName || !lastName) return { error: "Enter the pupil's full name.", values: vals() };
  if (!Object.values(Gender).includes(gender)) return { error: "Choose the pupil's gender.", values: vals() };

  const dateOfBirth = dobInput ? parseDate(dobInput) : null;
  if (dobInput && !dateOfBirth) return { error: "Date of birth is not a valid date.", values: vals() };

  if (upiNumber && upiNumber !== student.upiNumber) {
    const upiClash = await db.student.findUnique({ where: { upiNumber } });
    if (upiClash) return { error: `UPI number ${upiNumber} is already registered.`, values: vals() };
  }

  await db.student.update({
    where: { id },
    data: { firstName, lastName, gender, boarding, upiNumber, dateOfBirth, religion, address, medicalNotes },
  });

  // optional stream change within the active session
  if (streamId) {
    const session = await getActiveSession();
    if (session) {
      const stream = await db.stream.findUnique({ where: { id: streamId }, include: { class: true } });
      if (stream && !stream.archived) {
        await db.enrollment.upsert({
          where: { studentId_sessionId: { studentId: id, sessionId: session.id } },
          update: { streamId },
          create: { studentId: id, streamId, sessionId: session.id },
        });
      }
    }
  }

  await audit(actor, "students", "student_updated", `${student.admissionNo} ${firstName} ${lastName}`);
  revalidatePath("/students");
  redirect(`/students/${id}`);
}

/** Structured exit for pupils leaving mid-journey: transfer or withdrawal
 *  (graduation happens through Promotions). Records the fee balance at the
 *  moment of exit so any debt stays on the record after they leave the roll. */
export async function exitStudent(formData: FormData) {
  const actor = await requirePermission("students", "archive");
  const id = String(formData.get("id") ?? "");
  const typeRaw = String(formData.get("exitType") ?? "");
  const destination = String(formData.get("destination") ?? "").trim() || null;
  const reason = String(formData.get("reason") ?? "").trim();
  const dateRaw = String(formData.get("exitDate") ?? "");

  if (typeRaw !== "TRANSFERRED" && typeRaw !== "WITHDRAWN") return;
  const student = await db.student.findUnique({ where: { id } });
  if (!student || student.archived) return;

  const exitAt = /^\d{4}-\d{2}-\d{2}$/.test(dateRaw)
    ? new Date(`${dateRaw}T00:00:00Z`)
    : new Date();
  const session = await getActiveSession();
  const balance = session ? await studentBalance(id, session.id) : null;

  await db.student.update({
    where: { id },
    data: {
      archived: true,
      archiveReason:
        reason ||
        (typeRaw === "TRANSFERRED"
          ? `Transferred${destination ? ` to ${destination}` : ""}`
          : "Withdrawn"),
      exitType: typeRaw,
      exitAt,
      exitDestination: destination,
      exitBalanceCents: balance?.balanceCents ?? null,
    },
  });

  await audit(
    actor,
    "students",
    "student_exited",
    `${student.admissionNo} ${student.firstName} ${student.lastName} · ${typeRaw.toLowerCase()}${destination ? ` → ${destination}` : ""}${balance && balance.balanceCents !== 0 ? ` · balance at exit ${formatMoney(balance.balanceCents)}` : ""}`,
  );
  revalidatePath("/students");
  revalidatePath(`/students/${id}`);
}

export async function setStudentArchived(formData: FormData) {
  const actor = await requirePermission("students", "archive");
  const id = String(formData.get("id") ?? "");
  const archived = String(formData.get("archived") ?? "") === "true";
  const reason = String(formData.get("reason") ?? "").trim();

  const student = await db.student.findUnique({ where: { id } });
  if (!student) return;

  await db.student.update({
    where: { id },
    data: {
      archived,
      archiveReason: archived ? reason || "No reason given" : null,
      // Restoring re-admits the pupil — clear the exit record.
      ...(archived ? {} : { exitType: null, exitAt: null, exitDestination: null, exitBalanceCents: null }),
    },
  });
  await audit(
    actor,
    "students",
    archived ? "student_archived" : "student_restored",
    `${student.admissionNo} ${student.firstName} ${student.lastName}${archived && reason ? ` — ${reason}` : ""}`,
  );
  revalidatePath("/students");
  redirect("/students");
}

export async function addGuardian(formData: FormData) {
  const actor = await requirePermission("students", "edit");
  const studentId = String(formData.get("studentId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const student = await db.student.findUnique({ where: { id: studentId } });
  if (!student) return;

  await db.guardian.create({
    data: {
      studentId,
      name,
      relation: String(formData.get("relation") ?? "Guardian").trim() || "Guardian",
      phone: String(formData.get("phone") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      occupation: String(formData.get("occupation") ?? "").trim() || null,
    },
  });
  await audit(actor, "students", "guardian_added", `${name} → ${student.admissionNo}`);
  revalidatePath(`/students/${studentId}`);
}

export async function removeGuardian(formData: FormData) {
  const actor = await requirePermission("students", "edit");
  const id = String(formData.get("id") ?? "");
  const guardian = await db.guardian.findUnique({ where: { id }, include: { student: true } });
  if (!guardian) return;

  const remaining = await db.guardian.count({ where: { studentId: guardian.studentId } });
  if (remaining <= 1) return; // every pupil keeps at least one contact

  await db.guardian.delete({ where: { id } });
  await audit(actor, "students", "guardian_removed", `${guardian.name} × ${guardian.student.admissionNo}`);
  revalidatePath(`/students/${guardian.studentId}`);
}
