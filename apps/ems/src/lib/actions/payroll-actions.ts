"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/rbac";
import { formatMoney, parseMoney } from "@/lib/money";

/** parseMoney that also accepts blank / zero (deductions may be 0). */
function moneyOrZero(input: string): number | null {
  const t = input.trim();
  if (t === "" || /^0+(\.0{1,2})?$/.test(t.replace(/[^\d.]/g, "") || "x")) return 0;
  return parseMoney(t);
}

/** Saves one staff member's salary structure (one compact form per row). */
export async function saveSalary(formData: FormData) {
  const actor = await requirePermission("payroll", "edit");
  const staffId = String(formData.get("staffId") ?? "");

  const staff = await db.staffProfile.findUnique({ where: { id: staffId } });
  if (!staff) return;

  const fields = ["basic", "allowances", "nssf", "shif", "paye", "other"] as const;
  const cents: Record<string, number> = {};
  for (const f of fields) {
    const parsed = moneyOrZero(String(formData.get(f) ?? ""));
    if (parsed === null) return; // one bad number → save nothing
    cents[f] = parsed;
  }
  if (cents.basic === 0) return; // a structure needs a basic salary

  await db.salaryStructure.upsert({
    where: { staffId },
    update: {
      basicCents: cents.basic,
      allowancesCents: cents.allowances,
      nssfCents: cents.nssf,
      shifCents: cents.shif,
      payeCents: cents.paye,
      otherDeductCents: cents.other,
    },
    create: {
      staffId,
      basicCents: cents.basic,
      allowancesCents: cents.allowances,
      nssfCents: cents.nssf,
      shifCents: cents.shif,
      payeCents: cents.paye,
      otherDeductCents: cents.other,
    },
  });

  await audit(
    actor,
    "payroll",
    "salary_updated",
    `${staff.employeeNo} · basic ${formatMoney(cents.basic)} + allowances ${formatMoney(cents.allowances)}`,
  );
  revalidatePath("/payroll");
}

/** Generates a month's payroll run as a snapshot of current structures. */
export async function generatePayroll(formData: FormData) {
  const actor = await requirePermission("payroll", "create");
  const month = String(formData.get("month") ?? "");
  if (!/^\d{4}-\d{2}$/.test(month)) return;

  const exists = await db.payrollRun.findUnique({ where: { month } });
  if (exists) {
    redirect(`/payroll?error=exists&month=${month}`);
  }

  const structures = await db.salaryStructure.findMany({
    where: { staff: { archived: false }, basicCents: { gt: 0 } },
    include: { staff: true },
  });
  if (structures.length === 0) redirect("/payroll?error=nosalaries");

  const run = await db.payrollRun.create({
    data: {
      month,
      generatedBy: actor.username,
      items: {
        create: structures.map((s) => {
          const grossCents = s.basicCents + s.allowancesCents;
          const netCents =
            grossCents - s.nssfCents - s.shifCents - s.payeCents - s.otherDeductCents;
          return {
            staffId: s.staffId,
            basicCents: s.basicCents,
            allowancesCents: s.allowancesCents,
            nssfCents: s.nssfCents,
            shifCents: s.shifCents,
            payeCents: s.payeCents,
            otherDeductCents: s.otherDeductCents,
            grossCents,
            netCents,
          };
        }),
      },
    },
    include: { items: true },
  });

  const gross = run.items.reduce((sum, i) => sum + i.grossCents, 0);
  await audit(
    actor,
    "payroll",
    "payroll_generated",
    `${month} · ${run.items.length} staff · gross ${formatMoney(gross)}`,
  );
  revalidatePath("/payroll");
  redirect(`/payroll/${run.id}`);
}

/** Deletes a DRAFT run so it can be regenerated after salary changes. */
export async function deleteDraftRun(formData: FormData) {
  const actor = await requirePermission("payroll", "archive");
  const id = String(formData.get("id") ?? "");

  const run = await db.payrollRun.findUnique({ where: { id } });
  if (!run || run.status !== "DRAFT") return;

  await db.payrollRun.delete({ where: { id } });
  await audit(actor, "payroll", "payroll_draft_deleted", run.month);
  revalidatePath("/payroll");
  redirect("/payroll");
}

/** Marks a run paid and posts the gross total to the expenses ledger. */
export async function markPayrollPaid(formData: FormData) {
  const actor = await requirePermission("payroll", "edit");
  const id = String(formData.get("id") ?? "");

  const run = await db.payrollRun.findUnique({ where: { id }, include: { items: true } });
  if (!run || run.status !== "DRAFT") return;

  const grossCents = run.items.reduce((sum, i) => sum + i.grossCents, 0);

  const head = await db.financeHead.upsert({
    where: { name_kind: { name: "Salaries & Wages", kind: "EXPENSE" } },
    update: {},
    create: { name: "Salaries & Wages", kind: "EXPENSE" },
  });

  await db.$transaction([
    db.payrollRun.update({
      where: { id },
      data: { status: "PAID", paidBy: actor.username, paidAt: new Date() },
    }),
    db.financeEntry.create({
      data: {
        headId: head.id,
        description: `Payroll ${run.month} (${run.items.length} staff, gross)`,
        amountCents: grossCents,
        date: new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z"),
        reference: `PAYROLL-${run.month}`,
        recordedBy: actor.username,
      },
    }),
  ]);

  await audit(
    actor,
    "payroll",
    "payroll_paid",
    `${run.month} · ${run.items.length} staff · gross ${formatMoney(grossCents)} posted to expenses`,
  );
  revalidatePath("/payroll");
  revalidatePath(`/payroll/${id}`);
  revalidatePath("/finance");
}
