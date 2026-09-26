"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Gender, StaffAttendanceStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { can, requirePermission } from "@/lib/rbac";
import { requireUser } from "@/lib/auth";
import { leaveBalances, nextEmployeeNo, weekdaysBetween } from "@/lib/staff";

export type StaffFormState = { error?: string; values?: Record<string, string> };

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

function readProfileFields(formData: FormData) {
  const genderRaw = String(formData.get("gender") ?? "");
  return {
    firstName: String(formData.get("firstName") ?? "").trim(),
    lastName: String(formData.get("lastName") ?? "").trim(),
    gender: (Object.values(Gender) as string[]).includes(genderRaw) ? (genderRaw as Gender) : null,
    designation: String(formData.get("designation") ?? "").trim(),
    department: String(formData.get("department") ?? "").trim() || null,
    qualification: String(formData.get("qualification") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    joinedAt: parseDay(String(formData.get("joinedAt") ?? "")),
  };
}

export async function createStaff(
  _prev: StaffFormState,
  formData: FormData,
): Promise<StaffFormState> {
  const actor = await requirePermission("staff", "create");
  const vals = () => formValues(formData);

  const f = readProfileFields(formData);
  if (!f.firstName || !f.lastName) return { error: "Enter the staff member's full name.", values: vals() };
  if (!f.gender) return { error: "Choose a gender.", values: vals() };
  if (!f.designation) return { error: "Enter a designation, e.g. Teacher.", values: vals() };

  const employeeNo = await nextEmployeeNo();
  const staff = await db.staffProfile.create({
    data: { ...f, gender: f.gender, employeeNo },
  });

  await audit(actor, "staff", "staff_created", `${employeeNo} · ${f.firstName} ${f.lastName} · ${f.designation}`);
  revalidatePath("/staff");
  redirect(`/staff/${staff.id}`);
}

export async function updateStaff(
  _prev: StaffFormState,
  formData: FormData,
): Promise<StaffFormState> {
  const actor = await requirePermission("staff", "edit");
  const vals = () => formValues(formData);

  const id = String(formData.get("id") ?? "");
  const staff = await db.staffProfile.findUnique({ where: { id } });
  if (!staff) return { error: "Staff member not found." };

  const f = readProfileFields(formData);
  if (!f.firstName || !f.lastName) return { error: "Enter the staff member's full name.", values: vals() };
  if (!f.gender) return { error: "Choose a gender.", values: vals() };
  if (!f.designation) return { error: "Enter a designation.", values: vals() };

  await db.staffProfile.update({ where: { id }, data: { ...f, gender: f.gender } });
  await audit(actor, "staff", "staff_updated", `${staff.employeeNo} · ${f.firstName} ${f.lastName}`);
  revalidatePath(`/staff/${id}`);
  redirect(`/staff/${id}?saved=1`);
}

export async function setStaffArchived(formData: FormData) {
  const actor = await requirePermission("staff", "archive");
  const id = String(formData.get("id") ?? "");
  const archived = String(formData.get("archived") ?? "") === "true";
  const reason = String(formData.get("reason") ?? "").trim();

  const staff = await db.staffProfile.findUnique({ where: { id } });
  if (!staff) return;

  await db.staffProfile.update({
    where: { id },
    data: { archived, archiveReason: archived ? reason || "No reason given" : null },
  });
  await audit(
    actor,
    "staff",
    archived ? "staff_archived" : "staff_restored",
    `${staff.employeeNo} · ${staff.firstName} ${staff.lastName}${archived && reason ? ` — ${reason}` : ""}`,
  );
  revalidatePath("/staff");
  revalidatePath(`/staff/${id}`);
}

export async function linkStaffAccount(formData: FormData) {
  const actor = await requirePermission("staff", "edit");
  const id = String(formData.get("id") ?? "");
  const username = String(formData.get("username") ?? "").trim().toLowerCase();

  const [staff, user] = await Promise.all([
    db.staffProfile.findUnique({ where: { id } }),
    db.user.findUnique({ where: { username }, include: { staffProfile: true } }),
  ]);
  if (!staff || staff.userId || !user) return;
  if (user.staffProfile || user.role === "PARENT" || user.role === "STUDENT") return;

  await db.staffProfile.update({ where: { id }, data: { userId: user.id } });
  await audit(actor, "staff", "staff_account_linked", `${staff.employeeNo} ↔ ${username}`);
  revalidatePath(`/staff/${id}`);
}

export async function unlinkStaffAccount(formData: FormData) {
  const actor = await requirePermission("staff", "edit");
  const id = String(formData.get("id") ?? "");

  const staff = await db.staffProfile.findUnique({ where: { id }, include: { user: true } });
  if (!staff || !staff.userId) return;

  await db.staffProfile.update({ where: { id }, data: { userId: null } });
  await audit(actor, "staff", "staff_account_unlinked", `${staff.employeeNo} ↮ ${staff.user?.username ?? ""}`);
  revalidatePath(`/staff/${id}`);
}

/** Saves the whole staff register for one day in a single submit. */
export async function saveStaffRegister(formData: FormData) {
  const actor = await requirePermission("staff", "create");

  const dateStr = String(formData.get("date") ?? "");
  const date = parseDay(dateStr);
  if (!date) return;

  const staffList = await db.staffProfile.findMany({
    where: { archived: false },
    select: { id: true },
  });

  const counts: Record<string, number> = {};
  const statuses = Object.values(StaffAttendanceStatus) as string[];

  for (const s of staffList) {
    const raw = String(formData.get(`st_${s.id}`) ?? "");
    if (!statuses.includes(raw)) continue;
    const status = raw as StaffAttendanceStatus;
    counts[status] = (counts[status] ?? 0) + 1;
    await db.staffAttendanceRecord.upsert({
      where: { staffId_date: { staffId: s.id, date } },
      update: { status, markedBy: actor.username },
      create: { staffId: s.id, date, status, markedBy: actor.username },
    });
  }

  await audit(
    actor,
    "staff",
    "staff_register_saved",
    `${dateStr} · ${Object.entries(counts)
      .map(([k, v]) => `${v} ${k.toLowerCase()}`)
      .join(", ")}`,
  );
  revalidatePath("/staff/attendance");
  redirect(`/staff/attendance?date=${dateStr}&saved=1`);
}

export async function createLeaveType(formData: FormData) {
  const actor = await requirePermission("staff", "create");
  const name = String(formData.get("name") ?? "").trim();
  const daysPerYear = Number.parseInt(String(formData.get("daysPerYear") ?? ""), 10);
  if (!name || !Number.isInteger(daysPerYear) || daysPerYear < 1 || daysPerYear > 366) return;

  const exists = await db.leaveType.findUnique({ where: { name } });
  if (exists) return;
  await db.leaveType.create({ data: { name, daysPerYear } });
  await audit(actor, "staff", "leave_type_created", `${name} · ${daysPerYear} days/year`);
  revalidatePath("/staff/leave");
}

/** Files a leave request — by HR for anyone, or by a linked user for themselves. */
export async function applyLeave(
  _prev: StaffFormState,
  formData: FormData,
): Promise<StaffFormState> {
  const actor = await requireUser();
  const vals = () => formValues(formData);

  const staffId = String(formData.get("staffId") ?? "");
  const leaveTypeId = String(formData.get("leaveTypeId") ?? "");
  const startDate = parseDay(String(formData.get("startDate") ?? ""));
  const endDate = parseDay(String(formData.get("endDate") ?? ""));
  const reason = String(formData.get("reason") ?? "").trim();

  const staff = await db.staffProfile.findUnique({ where: { id: staffId } });
  if (!staff || staff.archived) return { error: "Staff member not found.", values: vals() };

  // HR (staff:create) may file for anyone; otherwise only for your own profile.
  const isHr = await can(actor.role, "staff", "create");
  if (!isHr && staff.userId !== actor.id) return { error: "You can only apply for your own leave." };

  if (!leaveTypeId) return { error: "Choose the leave type.", values: vals() };
  if (!startDate || !endDate) return { error: "Pick the first and last day of leave.", values: vals() };
  if (endDate < startDate) return { error: "The last day cannot be before the first day.", values: vals() };
  if (!reason) return { error: "Give a short reason for the leave.", values: vals() };

  const days = weekdaysBetween(startDate, endDate);
  if (days === 0) return { error: "That range has no working days (Mon–Fri).", values: vals() };
  if (days > 180) return { error: "A single request cannot exceed 180 working days.", values: vals() };

  const balances = await leaveBalances(staffId, startDate.getUTCFullYear());
  const balance = balances.find((b) => b.leaveTypeId === leaveTypeId);
  if (!balance) return { error: "That leave type is not available.", values: vals() };
  if (days > balance.remaining - balance.pending)
    return {
      error: `Only ${Math.max(0, balance.remaining - balance.pending)} ${balance.name} day(s) left this year (${days} requested).`,
      values: vals(),
    };

  await db.leaveApplication.create({
    data: { staffId, leaveTypeId, startDate, endDate, days, reason },
  });
  await audit(
    actor,
    "staff",
    "leave_applied",
    `${staff.employeeNo} · ${balance.name} · ${days} day(s)`,
  );
  revalidatePath("/staff/leave");
  revalidatePath("/my-leave");
  redirect(isHr ? "/staff/leave?applied=1" : "/my-leave?applied=1");
}

/** Approve or reject a pending request. Approval fills the register with ON_LEAVE. */
export async function decideLeave(formData: FormData) {
  const actor = await requirePermission("staff", "edit");
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const note = String(formData.get("note") ?? "").trim() || null;
  if (decision !== "approve" && decision !== "reject") return;

  const application = await db.leaveApplication.findUnique({
    where: { id },
    include: { staff: true, leaveType: true },
  });
  if (!application || application.status !== "PENDING") return;

  await db.leaveApplication.update({
    where: { id },
    data: {
      status: decision === "approve" ? "APPROVED" : "REJECTED",
      decidedBy: actor.username,
      decisionNote: note,
    },
  });

  if (decision === "approve") {
    const d = new Date(application.startDate);
    while (d <= application.endDate) {
      const day = d.getUTCDay();
      if (day !== 0 && day !== 6) {
        const date = new Date(d);
        await db.staffAttendanceRecord.upsert({
          where: { staffId_date: { staffId: application.staffId, date } },
          update: { status: "ON_LEAVE", markedBy: actor.username },
          create: { staffId: application.staffId, date, status: "ON_LEAVE", markedBy: actor.username },
        });
      }
      d.setUTCDate(d.getUTCDate() + 1);
    }
  }

  await audit(
    actor,
    "staff",
    decision === "approve" ? "leave_approved" : "leave_rejected",
    `${application.staff.employeeNo} · ${application.leaveType.name} · ${application.days} day(s)${note ? ` — ${note}` : ""}`,
  );
  revalidatePath("/staff/leave");
  revalidatePath("/staff/attendance");
  revalidatePath("/my-leave");
}
