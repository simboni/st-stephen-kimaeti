"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { FinanceKind } from "@prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/rbac";
import { parseMoney, formatMoney } from "@/lib/money";

export type FinanceFormState = { error?: string; values?: Record<string, string> };

function formValues(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string" && !k.startsWith("$")) out[k] = v;
  }
  return out;
}

export async function createFinanceHead(formData: FormData) {
  const actor = await requirePermission("finance", "create");
  const name = String(formData.get("name") ?? "").trim();
  const kindRaw = String(formData.get("kind") ?? "");
  if (!name || !(Object.values(FinanceKind) as string[]).includes(kindRaw)) return;
  const kind = kindRaw as FinanceKind;

  const exists = await db.financeHead.findUnique({ where: { name_kind: { name, kind } } });
  if (exists) return;
  await db.financeHead.create({ data: { name, kind } });
  await audit(actor, "finance", "finance_head_created", `${name} (${kind})`);
  revalidatePath("/finance");
}

export async function setFinanceHeadArchived(formData: FormData) {
  const actor = await requirePermission("finance", "archive");
  const id = String(formData.get("id") ?? "");
  const archived = String(formData.get("archived") ?? "") === "true";

  const head = await db.financeHead.findUnique({ where: { id } });
  if (!head) return;

  await db.financeHead.update({ where: { id }, data: { archived } });
  await audit(
    actor,
    "finance",
    archived ? "finance_head_archived" : "finance_head_restored",
    `${head.name} (${head.kind})`,
  );
  revalidatePath("/finance");
}

export async function addFinanceEntry(
  _prev: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const actor = await requirePermission("finance", "create");
  const vals = () => formValues(formData);

  const headId = String(formData.get("headId") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const amountCents = parseMoney(String(formData.get("amount") ?? ""));
  const dateRaw = String(formData.get("date") ?? "");
  const reference = String(formData.get("reference") ?? "").trim() || null;

  if (!headId) return { error: "Choose an income or expense head.", values: vals() };
  if (!description) return { error: "Describe the transaction (e.g. September salaries).", values: vals() };
  if (!amountCents) return { error: "Enter a valid amount, e.g. 12000 or 12,500.50.", values: vals() };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateRaw)) return { error: "Pick the transaction date.", values: vals() };
  const date = new Date(`${dateRaw}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return { error: "Pick a valid transaction date.", values: vals() };

  const head = await db.financeHead.findUnique({ where: { id: headId } });
  if (!head || head.archived) return { error: "That head is not available.", values: vals() };

  await db.financeEntry.create({
    data: { headId, description, amountCents, date, reference, recordedBy: actor.username },
  });

  await audit(
    actor,
    "finance",
    head.kind === "INCOME" ? "income_recorded" : "expense_recorded",
    `${head.name} · ${description} · ${formatMoney(amountCents)} · ${dateRaw}`,
  );
  revalidatePath("/finance");
  redirect(`/finance?month=${dateRaw.slice(0, 7)}`);
}

export async function voidFinanceEntry(formData: FormData) {
  const actor = await requirePermission("finance", "archive");
  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  const entry = await db.financeEntry.findUnique({ where: { id }, include: { head: true } });
  if (!entry || entry.voided) return;

  await db.financeEntry.update({
    where: { id },
    data: { voided: true, voidReason: reason || "No reason given" },
  });
  await audit(
    actor,
    "finance",
    "finance_entry_voided",
    `${entry.head.name} · ${entry.description} · ${formatMoney(entry.amountCents)}${reason ? ` — ${reason}` : ""}`,
  );
  revalidatePath("/finance");
}
