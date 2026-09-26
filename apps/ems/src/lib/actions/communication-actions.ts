"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { NoticeAudience } from "@prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/rbac";

export type CommFormState = { error?: string; values?: Record<string, string> };

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

function parseAudience(raw: string): NoticeAudience | null {
  return (Object.values(NoticeAudience) as string[]).includes(raw)
    ? (raw as NoticeAudience)
    : null;
}

export async function createNotice(
  _prev: CommFormState,
  formData: FormData,
): Promise<CommFormState> {
  const actor = await requirePermission("communication", "create");
  const vals = () => formValues(formData);

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const audience = parseAudience(String(formData.get("audience") ?? ""));
  const expiresRaw = String(formData.get("expiresAt") ?? "");
  const expiresAt = expiresRaw ? parseDay(expiresRaw) : null;

  if (!title) return { error: "Give the notice a title.", values: vals() };
  if (!body) return { error: "Write the notice text.", values: vals() };
  if (!audience) return { error: "Choose who should see it.", values: vals() };
  if (expiresRaw && !expiresAt) return { error: "Pick a valid expiry date.", values: vals() };

  await db.notice.create({ data: { title, body, audience, expiresAt, createdBy: actor.username } });
  await audit(actor, "communication", "notice_posted", `${title} → ${audience}`);
  revalidatePath("/communication");
  revalidatePath("/");
  redirect("/communication?posted=1");
}

export async function setNoticeArchived(formData: FormData) {
  const actor = await requirePermission("communication", "archive");
  const id = String(formData.get("id") ?? "");
  const archived = String(formData.get("archived") ?? "") === "true";

  const notice = await db.notice.findUnique({ where: { id } });
  if (!notice) return;

  await db.notice.update({ where: { id }, data: { archived } });
  await audit(actor, "communication", archived ? "notice_archived" : "notice_restored", notice.title);
  revalidatePath("/communication");
  revalidatePath("/");
}

export async function createEvent(
  _prev: CommFormState,
  formData: FormData,
): Promise<CommFormState> {
  const actor = await requirePermission("communication", "create");
  const vals = () => formValues(formData);

  const title = String(formData.get("title") ?? "").trim();
  const date = parseDay(String(formData.get("date") ?? ""));
  const endRaw = String(formData.get("endDate") ?? "");
  const endDate = endRaw ? parseDay(endRaw) : null;
  const audience = parseAudience(String(formData.get("audience") ?? ""));
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!title) return { error: "Name the event.", values: vals() };
  if (!date) return { error: "Pick the event date.", values: vals() };
  if (endRaw && !endDate) return { error: "Pick a valid end date.", values: vals() };
  if (endDate && endDate < date) return { error: "The end date cannot be before the start.", values: vals() };
  if (!audience) return { error: "Choose who should see it.", values: vals() };

  await db.calendarEvent.create({
    data: { title, date, endDate, audience, note, createdBy: actor.username },
  });
  await audit(actor, "communication", "event_added", `${title} · ${date.toISOString().slice(0, 10)} → ${audience}`);
  revalidatePath("/communication");
  revalidatePath("/");
  redirect("/communication?added=1");
}

export async function setEventArchived(formData: FormData) {
  const actor = await requirePermission("communication", "archive");
  const id = String(formData.get("id") ?? "");
  const archived = String(formData.get("archived") ?? "") === "true";

  const event = await db.calendarEvent.findUnique({ where: { id } });
  if (!event) return;

  await db.calendarEvent.update({ where: { id }, data: { archived } });
  await audit(actor, "communication", archived ? "event_archived" : "event_restored", event.title);
  revalidatePath("/communication");
  revalidatePath("/");
}
