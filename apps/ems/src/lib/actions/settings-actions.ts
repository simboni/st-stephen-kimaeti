"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/rbac";

/** `values` echoes the submission back on error — React 19 resets form
    fields after an action, so forms re-seed their defaults from it. */
export type SettingsFormState = {
  error?: string;
  saved?: boolean;
  values?: Record<string, string>;
};

function formValues(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string" && !k.startsWith("$")) out[k] = v;
  }
  return out;
}

export async function updateSchoolSettings(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const actor = await requirePermission("settings", "edit");

  const name = String(formData.get("name") ?? "").trim();
  const shortName = String(formData.get("shortName") ?? "").trim();
  const motto = String(formData.get("motto") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const address = String(formData.get("address") ?? "").trim() || null;
  const currency = String(formData.get("currency") ?? "KES").trim().toUpperCase();

  if (!name) return { error: "The school name is required.", values: formValues(formData) };
  if (!shortName) return { error: "The short name is required.", values: formValues(formData) };
  if (!/^[A-Z]{3}$/.test(currency)) return { error: "Currency must be a 3-letter code, e.g. KES.", values: formValues(formData) };

  await db.schoolSetting.upsert({
    where: { id: "school" },
    update: { name, shortName, motto, email, phone, address, currency },
    create: { id: "school", name, shortName, motto, email, phone, address, currency },
  });

  await audit(actor, "settings", "school_settings_updated", name);
  revalidatePath("/settings");
  return { saved: true };
}

/* -------------------------------------------------------------------- logo */

const MAX_LOGO_BYTES = 1024 * 1024; // 1 MB
const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"];

export async function updateSchoolLogo(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const actor = await requirePermission("settings", "edit");

  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0)
    return { error: "Choose an image file first." };
  if (!LOGO_TYPES.includes(file.type))
    return { error: "The logo must be a PNG, JPG or WebP image." };
  if (file.size > MAX_LOGO_BYTES)
    return { error: "The logo must be 1 MB or smaller — please resize it." };

  const bytes = Buffer.from(await file.arrayBuffer());
  await db.schoolSetting.update({
    where: { id: "school" },
    data: { logo: bytes, logoType: file.type },
  });

  await audit(actor, "settings", "logo_updated", `${file.type}, ${Math.round(file.size / 1024)} KB`);
  revalidatePath("/", "layout");
  return { saved: true };
}

export async function removeSchoolLogo() {
  const actor = await requirePermission("settings", "edit");
  await db.schoolSetting.update({
    where: { id: "school" },
    data: { logo: null, logoType: null },
  });
  await audit(actor, "settings", "logo_removed");
  revalidatePath("/", "layout");
}

/* ---------------------------------------------------------------- sessions */

function parseDate(value: FormDataEntryValue | null): Date | null {
  const s = String(value ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export type SessionFormState = { error?: string; values?: Record<string, string> };

/** Creates a session together with its three terms in one step. */
export async function createSession(
  _prev: SessionFormState,
  formData: FormData,
): Promise<SessionFormState> {
  const actor = await requirePermission("settings", "create");

  const name = String(formData.get("name") ?? "").trim();
  if (!/^\d{4}[-/]\d{4}$/.test(name) && !/^\d{4}$/.test(name))
    return { error: 'Session name should look like "2026-2027" or "2027".', values: formValues(formData) };

  const exists = await db.academicSession.findUnique({ where: { name } });
  if (exists) return { error: `Session "${name}" already exists.`, values: formValues(formData) };

  const terms: { number: number; name: string; startDate: Date; endDate: Date }[] = [];
  for (const n of [1, 2, 3]) {
    const start = parseDate(formData.get(`term${n}Start`));
    const end = parseDate(formData.get(`term${n}End`));
    if (!start || !end) return { error: `Term ${n} needs both a start and end date.`, values: formValues(formData) };
    if (end <= start) return { error: `Term ${n} must end after it starts.`, values: formValues(formData) };
    const prev = terms[terms.length - 1];
    if (prev && start <= prev.endDate)
      return { error: `Term ${n} must start after Term ${n - 1} ends.`, values: formValues(formData) };
    terms.push({ number: n, name: `Term ${n}`, startDate: start, endDate: end });
  }

  await db.academicSession.create({
    data: {
      name,
      startDate: terms[0].startDate,
      endDate: terms[2].endDate,
      terms: { create: terms },
    },
  });

  await audit(actor, "settings", "session_created", name);
  revalidatePath("/settings/sessions");
  redirect("/settings/sessions");
}

export async function updateTermDates(
  _prev: SessionFormState,
  formData: FormData,
): Promise<SessionFormState> {
  const actor = await requirePermission("settings", "edit");
  const sessionId = String(formData.get("sessionId") ?? "");

  const session = await db.academicSession.findUnique({
    where: { id: sessionId },
    include: { terms: { orderBy: { number: "asc" } } },
  });
  if (!session) return { error: "Session not found.", values: formValues(formData) };

  const updates: { id: string; startDate: Date; endDate: Date }[] = [];
  for (const term of session.terms) {
    const start = parseDate(formData.get(`term${term.number}Start`));
    const end = parseDate(formData.get(`term${term.number}End`));
    if (!start || !end) return { error: `Term ${term.number} needs both dates.`, values: formValues(formData) };
    if (end <= start) return { error: `Term ${term.number} must end after it starts.`, values: formValues(formData) };
    const prev = updates[updates.length - 1];
    if (prev && start <= prev.endDate)
      return { error: `Term ${term.number} must start after the previous term ends.`, values: formValues(formData) };
    updates.push({ id: term.id, startDate: start, endDate: end });
  }

  await db.$transaction([
    ...updates.map((u) =>
      db.term.update({ where: { id: u.id }, data: { startDate: u.startDate, endDate: u.endDate } }),
    ),
    db.academicSession.update({
      where: { id: sessionId },
      data: { startDate: updates[0].startDate, endDate: updates[updates.length - 1].endDate },
    }),
  ]);

  await audit(actor, "settings", "term_dates_updated", session.name);
  revalidatePath("/settings/sessions");
  redirect("/settings/sessions");
}

export async function setActiveSession(formData: FormData) {
  const actor = await requirePermission("settings", "edit");
  const id = String(formData.get("id") ?? "");
  const target = await db.academicSession.findUnique({ where: { id } });
  if (!target) return;

  await db.$transaction([
    db.academicSession.updateMany({ where: { active: true }, data: { active: false } }),
    db.academicSession.update({ where: { id }, data: { active: true } }),
  ]);

  await audit(actor, "settings", "session_activated", target.name);
  revalidatePath("/", "layout");
}
