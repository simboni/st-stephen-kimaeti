import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { getSchoolSettings, logoSrc } from "@/lib/school";
import { formatMoney } from "@/lib/money";
import { PrintButton } from "@/components/fees-forms";

export const metadata: Metadata = { title: "Payslip" };

export default async function PayslipPage({
  params,
}: {
  params: Promise<{ runId: string; itemId: string }>;
}) {
  await requirePermission("payroll", "view");
  const { runId, itemId } = await params;

  const [item, school] = await Promise.all([
    db.payrollItem.findUnique({
      where: { id: itemId },
      include: { staff: true, run: true },
    }),
    getSchoolSettings(),
  ]);
  if (!item || item.runId !== runId) notFound();

  const deductions: [string, number][] = [
    ["NSSF", item.nssfCents],
    ["SHIF", item.shifCents],
    ["PAYE", item.payeCents],
    ["Other deductions", item.otherDeductCents],
  ];
  const totalDeductions = deductions.reduce((s, [, c]) => s + c, 0);

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <Link href={`/payroll/${runId}`} className="btn btn-secondary">
          ← Back to register
        </Link>
        <PrintButton label="Print payslip" />
      </div>

      <div className="card p-8 print:border-0 print:shadow-none">
        <div className="flex items-center gap-4 border-b border-paper-300 pb-5">
          <Image
            src={logoSrc(school)}
            alt=""
            width={64}
            height={64}
            unoptimized
            className="h-16 w-16 rounded-full bg-white object-contain"
          />
          <div>
            <h1 className="font-display text-lg font-extrabold text-ink-900">{school.name}</h1>
            <p className="text-xs text-ink-500">
              {school.address} · {school.phone} · {school.email}
            </p>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-brand-600">
              Payslip — {item.run.month}
              {item.run.status === "PAID" ? "" : " (draft)"}
            </p>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-3">
          {[
            ["Employee", `${item.staff.firstName} ${item.staff.lastName}`],
            ["Employee No.", item.staff.employeeNo],
            ["Designation", item.staff.designation],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{label}</dt>
              <dd className="font-semibold text-ink-900">{value}</dd>
            </div>
          ))}
        </dl>

        <table className="table-admin mt-5">
          <thead>
            <tr>
              <th>Earnings / Deductions</th>
              <th className="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="font-semibold text-ink-900">Basic salary</td>
              <td className="text-right">{formatMoney(item.basicCents)}</td>
            </tr>
            <tr>
              <td className="font-semibold text-ink-900">Allowances</td>
              <td className="text-right">{formatMoney(item.allowancesCents)}</td>
            </tr>
            <tr className="font-bold">
              <td>Gross pay</td>
              <td className="text-right">{formatMoney(item.grossCents)}</td>
            </tr>
            {deductions.map(([label, cents]) => (
              <tr key={label}>
                <td className="text-ink-500">{label}</td>
                <td className="text-right text-danger-500">−{formatMoney(cents)}</td>
              </tr>
            ))}
            <tr className="font-bold">
              <td>Total deductions</td>
              <td className="text-right text-danger-500">−{formatMoney(totalDeductions)}</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-6 rounded-xl bg-paper-100 p-5 text-center print:border print:border-paper-300">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-400">Net pay</p>
          <p className="font-display text-3xl font-extrabold text-ink-900">
            {formatMoney(item.netCents)}
          </p>
        </div>

        <p className="mt-8 border-t border-paper-300 pt-4 text-center text-xs text-ink-400">
          {school.motto} · This payslip is system-generated and valid without a signature.
        </p>
      </div>
    </div>
  );
}
