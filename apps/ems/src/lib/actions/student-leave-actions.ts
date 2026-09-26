"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { can, requirePermission } from "@/lib/rbac";
import { requireUser } from "@/lib/auth";
import { getActiveSession } from "@/lib/school";

export type StudentLeaveState = { error?: string; values?: Record<string, string> };

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

/** A parent (linked), the pupil themself, or attendance staff files a request. */
export async function applyStudentLeave(
  _prev: StudentLeaveState,
  formData: FormData,
): Promise<StudentLeaveState> {
  const actor = await requireUser();
  const vals = () => formValues(formData);

  const studentId = String(formData.get("studentId") ?? "");
  const startDate = parseDay(String(formData.get("startDate") ?? ""));
  const endDate = parseDay(String(formData.get("endDate") ?? ""));
  const reason = String(formData.get("reason") ?? "").trim();

  const student = await db.student.findUnique({ where: { id: studentId } });
  if (!student || student.archived) return { error: "Pupil not found.", values: vals() };

  // Authorisation: linked parent, the pupil's own account, or office staff.
  const isStaff = await can(actor.role, "attendance", "create");
  if (!isStaff) {
    let linked = false;
    if (actor.role === "PARENT") {
      linked = !!(await db.parentLink.findUnique({
        where: { userId_studentId: { userId: actor.id, studentId } },
      }));
    } else if (actor.role === "STUDENT") {
      linked = student.userId === actor.id;
    }
    if (!linked) return { error: "You can only request leave for your own child." };
  }

  if (!startDate || !endDate) return { error: "Pick the first and last day away.", values: vals() };
  if (endDate < startDate) return { error: "The last day cannot be before the first day.", values: vals() };
  const days = Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1;
  if (days > 30) return { error: "A single request cannot exceed 30 days.", values: vals() };
  if (!reason) return { error: "Give a short reason for the absence.", values: vals() };

  const session = await getActiveSession();
  if (!session) return { error: "No active session.", values: vals() };
  const enrollment = await db.enrollment.findUnique({
    where: { studentId_sessionId: { studentId, sessionId: session.id } },
  });
  if (!enrollment) return { error: "The pupil is not enrolled this session.", values: vals() };

  await db.studentLeave.create({
    data: { enrollmentId: enrollment.id, startDate, endDate, reason, appliedBy: actor.username },
  });
  await audit(actor, "attendance", "student_leave_applied", `${student.admissionNo} · ${reason}`);
  revalidatePath("/absence");
  revalidatePath("/attendance/leave");
  redirect(isStaff ? "/attendance/leave?applied=1" : "/absence?applied=1");
}

/** Approve or reject; approval fills the register with excused absences. */
export async function decideStudentLeave(formData: FormData) {
  const actor = await requirePermission("attendance", "edit");
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const note = String(formData.get("note") ?? "").trim() || null;
  if (decision !== "approve" && decision !== "reject") return;

  const leave = await db.studentLeave.findUnique({
    where: { id },
    include: { enrollment: { include: { student: true } } },
  });
  if (!leave || leave.status !== "PENDING") return;

  await db.studentLeave.update({
    where: { id },
    data: {
      status: decision === "approve" ? "APPROVED" : "REJECTED",
      decidedBy: actor.username,
      decisionNote: note,
    },
  });

  if (decision === "approve") {
    const d = new Date(leave.startDate);
    while (d <= leave.endDate) {
      const day = d.getUTCDay();
      if (day !== 0 && day !== 6) {
        const date = new Date(d);
        await db.attendanceRecord.upsert({
          where: { enrollmentId_date: { enrollmentId: leave.enrollmentId, date } },
          update: { status: "ABSENT", note: "Approved leave", markedBy: actor.username },
          create: {
            enrollmentId: leave.enrollmentId,
            date,
            status: "ABSENT",
            note: "Approved leave",
            markedBy: actor.username,
          },
        });
      }
      d.setUTCDate(d.getUTCDate() + 1);
    }
  }

  await audit(
    actor,
    "attendance",
    decision === "approve" ? "student_leave_approved" : "student_leave_rejected",
    `${leave.enrollment.student.admissionNo} · ${leave.reason}${note ? ` — ${note}` : ""}`,
  );
  revalidatePath("/attendance/leave");
  revalidatePath("/attendance");
  revalidatePath("/absence");
}
