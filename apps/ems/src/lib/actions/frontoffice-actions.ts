"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CallDirection, ComplaintStatus, EnquiryStatus, PostalDirection } from "@prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/rbac";

export type OfficeFormState = { error?: string; values?: Record<string, string> };

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

export async function createEnquiry(
  _prev: OfficeFormState,
  formData: FormData,
): Promise<OfficeFormState> {
  const actor = await requirePermission("frontoffice", "create");
  const vals = () => formValues(formData);

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim() || null;
  const subject = String(formData.get("subject") ?? "").trim() || null;
  const message = String(formData.get("message") ?? "").trim();

  if (!name) return { error: "Who is enquiring? Enter a name.", values: vals() };
  if (!message) return { error: "Note what they asked about.", values: vals() };

  await db.enquiry.create({ data: { name, phone, email, subject, message, handledBy: actor.username } });
  await audit(actor, "frontoffice", "enquiry_logged", `${name}${subject ? ` · ${subject}` : ""}`);
  revalidatePath("/frontoffice");
  redirect("/frontoffice?logged=enquiry");
}

export async function updateEnquiry(formData: FormData) {
  const actor = await requirePermission("frontoffice", "edit");
  const id = String(formData.get("id") ?? "");
  const statusRaw = String(formData.get("status") ?? "");
  const note = String(formData.get("note") ?? "").trim() || null;
  const followUpAt = parseDay(String(formData.get("followUpAt") ?? ""));

  if (!(Object.values(EnquiryStatus) as string[]).includes(statusRaw)) return;
  const enquiry = await db.enquiry.findUnique({ where: { id } });
  if (!enquiry) return;

  await db.enquiry.update({
    where: { id },
    data: {
      status: statusRaw as EnquiryStatus,
      ...(note ? { note } : {}),
      ...(followUpAt ? { followUpAt } : {}),
      handledBy: actor.username,
    },
  });
  await audit(actor, "frontoffice", "enquiry_updated", `${enquiry.name} → ${statusRaw.toLowerCase()}${note ? ` — ${note}` : ""}`);
  revalidatePath("/frontoffice");
}

export async function createComplaint(
  _prev: OfficeFormState,
  formData: FormData,
): Promise<OfficeFormState> {
  const actor = await requirePermission("frontoffice", "create");
  const vals = () => formValues(formData);

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const subject = String(formData.get("subject") ?? "").trim() || null;
  const message = String(formData.get("message") ?? "").trim();

  if (!name) return { error: "Who is complaining? Enter a name.", values: vals() };
  if (!message) return { error: "Describe the complaint.", values: vals() };

  await db.complaint.create({ data: { name, phone, subject, message } });
  await audit(actor, "frontoffice", "complaint_logged", `${name}${subject ? ` · ${subject}` : ""}`);
  revalidatePath("/frontoffice");
  redirect("/frontoffice?logged=complaint");
}

export async function resolveComplaint(formData: FormData) {
  const actor = await requirePermission("frontoffice", "edit");
  const id = String(formData.get("id") ?? "");
  const resolutionNote = String(formData.get("resolutionNote") ?? "").trim();

  const complaint = await db.complaint.findUnique({ where: { id } });
  if (!complaint || complaint.status === ComplaintStatus.RESOLVED) return;

  await db.complaint.update({
    where: { id },
    data: {
      status: "RESOLVED",
      resolutionNote: resolutionNote || "Handled by the office",
      resolvedBy: actor.username,
      resolvedAt: new Date(),
    },
  });
  await audit(actor, "frontoffice", "complaint_resolved", `${complaint.name}${resolutionNote ? ` — ${resolutionNote}` : ""}`);
  revalidatePath("/frontoffice");
}

export async function addVisitor(formData: FormData) {
  const actor = await requirePermission("frontoffice", "create");
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const purpose = String(formData.get("purpose") ?? "").trim();
  const whomToSee = String(formData.get("whomToSee") ?? "").trim() || null;
  if (!name || !purpose) return;

  await db.visitorLog.create({ data: { name, phone, purpose, whomToSee, loggedBy: actor.username } });
  await audit(actor, "frontoffice", "visitor_in", `${name} · ${purpose}`);
  revalidatePath("/frontoffice/logs");
}

export async function signOutVisitor(formData: FormData) {
  const actor = await requirePermission("frontoffice", "edit");
  const id = String(formData.get("id") ?? "");
  const visitor = await db.visitorLog.findUnique({ where: { id } });
  if (!visitor || visitor.outAt) return;

  await db.visitorLog.update({ where: { id }, data: { outAt: new Date() } });
  await audit(actor, "frontoffice", "visitor_out", visitor.name);
  revalidatePath("/frontoffice/logs");
}

export async function addCall(formData: FormData) {
  const actor = await requirePermission("frontoffice", "create");
  const directionRaw = String(formData.get("direction") ?? "");
  const name = String(formData.get("name") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  if (!(Object.values(CallDirection) as string[]).includes(directionRaw) || !phone || !note) return;

  await db.callLog.create({
    data: { direction: directionRaw as CallDirection, name, phone, note, loggedBy: actor.username },
  });
  await audit(actor, "frontoffice", "call_logged", `${directionRaw.toLowerCase()} · ${phone}`);
  revalidatePath("/frontoffice/logs");
}

export async function addPostal(formData: FormData) {
  const actor = await requirePermission("frontoffice", "create");
  const directionRaw = String(formData.get("direction") ?? "");
  const refNo = String(formData.get("refNo") ?? "").trim() || null;
  const party = String(formData.get("party") ?? "").trim();
  const item = String(formData.get("item") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim() || null;
  const date = parseDay(String(formData.get("date") ?? ""));
  if (!(Object.values(PostalDirection) as string[]).includes(directionRaw) || !party || !item || !date)
    return;

  await db.postalLog.create({
    data: { direction: directionRaw as PostalDirection, refNo, party, item, note, date, loggedBy: actor.username },
  });
  await audit(actor, "frontoffice", "postal_logged", `${directionRaw.toLowerCase()} · ${item}`);
  revalidatePath("/frontoffice/logs");
}
