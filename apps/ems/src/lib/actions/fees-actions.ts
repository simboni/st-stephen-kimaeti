"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { BoardingType, PaymentMethod } from "@prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/rbac";
import { getActiveSession } from "@/lib/school";
import { parseMoney, formatMoney } from "@/lib/money";
import { nextReceiptNo } from "@/lib/fees";

export type FeeFormState = { error?: string; values?: Record<string, string> };

function formValues(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string" && !k.startsWith("$")) out[k] = v;
  }
  return out;
}

export async function createFeeType(formData: FormData) {
  const actor = await requirePermission("fees", "create");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const exists = await db.feeType.findUnique({ where: { name } });
  if (exists) return;
  await db.feeType.create({ data: { name } });
  await audit(actor, "fees", "fee_type_created", name);
  revalidatePath("/fees/setup");
}

export async function createFeeItem(
  _prev: FeeFormState,
  formData: FormData,
): Promise<FeeFormState> {
  const actor = await requirePermission("fees", "create");
  const vals = () => formValues(formData);

  const feeTypeId = String(formData.get("feeTypeId") ?? "");
  const termId = String(formData.get("termId") ?? "") || null;
  const classId = String(formData.get("classId") ?? "") || null;
  const boardingRaw = String(formData.get("boarding") ?? "");
  const boarding = (Object.values(BoardingType) as string[]).includes(boardingRaw)
    ? (boardingRaw as BoardingType)
    : null;
  const amountCents = parseMoney(String(formData.get("amount") ?? ""));

  if (!feeTypeId) return { error: "Choose a fee type.", values: vals() };
  if (!amountCents) return { error: "Enter a valid amount, e.g. 12000 or 12,500.50.", values: vals() };

  const session = await getActiveSession();
  if (!session) return { error: "No active session — set one in Settings first.", values: vals() };

  const [feeType, term, cls] = await Promise.all([
    db.feeType.findUnique({ where: { id: feeTypeId } }),
    termId ? db.term.findUnique({ where: { id: termId } }) : null,
    classId ? db.schoolClass.findUnique({ where: { id: classId } }) : null,
  ]);
  if (!feeType) return { error: "Fee type not found.", values: vals() };

  await db.feeItem.create({
    data: { feeTypeId, sessionId: session.id, termId, classId, boarding, amountCents },
  });

  await audit(
    actor,
    "fees",
    "fee_item_created",
    `${feeType.name} ${formatMoney(amountCents)} · ${term?.name ?? "whole session"} · ${cls?.name ?? "all classes"} · ${boarding ?? "day+boarder"}`,
  );
  revalidatePath("/fees/setup");
  redirect("/fees/setup");
}

export async function setFeeItemArchived(formData: FormData) {
  const actor = await requirePermission("fees", "archive");
  const id = String(formData.get("id") ?? "");
  const archived = String(formData.get("archived") ?? "") === "true";

  const item = await db.feeItem.findUnique({ where: { id }, include: { feeType: true } });
  if (!item) return;

  await db.feeItem.update({ where: { id }, data: { archived } });
  await audit(
    actor,
    "fees",
    archived ? "fee_item_archived" : "fee_item_restored",
    `${item.feeType.name} ${formatMoney(item.amountCents)}`,
  );
  revalidatePath("/fees/setup");
}

/** Records a payment split across vote heads — full or partial per head. */
export async function recordPayment(
  _prev: FeeFormState,
  formData: FormData,
): Promise<FeeFormState> {
  const actor = await requirePermission("fees", "create");
  const vals = () => formValues(formData);

  const studentId = String(formData.get("studentId") ?? "");
  const methodRaw = String(formData.get("method") ?? "");
  const reference = String(formData.get("reference") ?? "").trim() || null;
  const note = String(formData.get("note") ?? "").trim() || null;

  // Allocation inputs are named alloc_<feeTypeId>; blank means nothing
  // toward that head. At least one head must receive money.
  const allocations: { feeTypeId: string; amountCents: number }[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("alloc_") || typeof value !== "string") continue;
    const raw = value.trim();
    if (raw === "" || /^0+(\.0{1,2})?$/.test(raw)) continue;
    const cents = parseMoney(raw);
    if (!cents)
      return { error: `Enter a valid amount for each vote head (got “${raw}”).`, values: vals() };
    allocations.push({ feeTypeId: key.slice(6), amountCents: cents });
  }
  if (allocations.length === 0)
    return { error: "Enter an amount against at least one vote head.", values: vals() };
  const amountCents = allocations.reduce((s, a) => s + a.amountCents, 0);

  if (!(Object.values(PaymentMethod) as string[]).includes(methodRaw))
    return { error: "Choose how the money was received.", values: vals() };
  const method = methodRaw as PaymentMethod;
  if (method !== "CASH" && !reference)
    return { error: "A reference (slip / cheque / M-PESA code) is required for non-cash payments.", values: vals() };

  const [student, session, heads] = await Promise.all([
    db.student.findUnique({ where: { id: studentId } }),
    getActiveSession(),
    db.feeType.findMany({ where: { id: { in: allocations.map((a) => a.feeTypeId) } } }),
  ]);
  if (!student) return { error: "Student not found." };
  if (!session) return { error: "No active session — set one in Settings first." };
  if (heads.length !== allocations.length)
    return { error: "One of the vote heads no longer exists — reload and try again.", values: vals() };

  const headName = new Map(heads.map((h) => [h.id, h.name]));
  const receiptNo = await nextReceiptNo();
  const payment = await db.feePayment.create({
    data: {
      receiptNo,
      studentId,
      sessionId: session.id,
      amountCents,
      method,
      reference,
      note,
      receivedBy: actor.username,
      allocations: { create: allocations },
    },
  });

  await audit(
    actor,
    "fees",
    "payment_received",
    `${receiptNo} · ${student.admissionNo} · ${formatMoney(amountCents)} · ${method}${reference ? ` (${reference})` : ""} · ${allocations
      .map((a) => `${headName.get(a.feeTypeId)} ${formatMoney(a.amountCents)}`)
      .join(" + ")}`,
  );
  revalidatePath(`/fees/${studentId}`);
  redirect(`/fees/receipt/${payment.id}`);
}

export async function voidPayment(formData: FormData) {
  const actor = await requirePermission("fees", "archive");
  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  const payment = await db.feePayment.findUnique({ where: { id }, include: { student: true } });
  if (!payment || payment.voided) return;

  await db.feePayment.update({
    where: { id },
    data: { voided: true, voidReason: reason || "No reason given" },
  });
  await audit(
    actor,
    "fees",
    "payment_voided",
    `${payment.receiptNo} · ${payment.student.admissionNo} · ${formatMoney(payment.amountCents)}${reason ? ` — ${reason}` : ""}`,
  );
  revalidatePath(`/fees/${payment.studentId}`);
}

export async function addAdjustment(
  _prev: FeeFormState,
  formData: FormData,
): Promise<FeeFormState> {
  const actor = await requirePermission("fees", "edit");
  const vals = () => formValues(formData);

  const studentId = String(formData.get("studentId") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const kind = String(formData.get("kind") ?? "discount");
  const feeTypeId = String(formData.get("feeTypeId") ?? "") || null;
  const amountCents = parseMoney(String(formData.get("amount") ?? ""));

  if (!label) return { error: "Describe the adjustment (e.g. Sibling discount).", values: vals() };
  if (!amountCents) return { error: "Enter a valid amount.", values: vals() };

  const [student, session, feeType] = await Promise.all([
    db.student.findUnique({ where: { id: studentId } }),
    getActiveSession(),
    feeTypeId ? db.feeType.findUnique({ where: { id: feeTypeId } }) : null,
  ]);
  if (!student) return { error: "Student not found." };
  if (!session) return { error: "No active session." };
  if (feeTypeId && !feeType) return { error: "That vote head no longer exists.", values: vals() };

  const signed = kind === "charge" ? amountCents : -amountCents;
  await db.feeAdjustment.create({
    data: { studentId, sessionId: session.id, feeTypeId, label, amountCents: signed, createdBy: actor.username },
  });

  await audit(
    actor,
    "fees",
    kind === "charge" ? "extra_charge_added" : "discount_added",
    `${student.admissionNo} · ${label} · ${formatMoney(signed)}${feeType ? ` · ${feeType.name}` : ""}`,
  );
  revalidatePath(`/fees/${studentId}`);
  redirect(`/fees/${studentId}`);
}
