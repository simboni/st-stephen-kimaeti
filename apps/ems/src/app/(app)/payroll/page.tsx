import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { can, requirePermission } from "@/lib/rbac";
import { formatMoney } from "@/lib/money";
import { generatePayroll, saveSalary } from "@/lib/actions/payroll-actions";

export const metadata: Metadata = { title: "Payroll" };

function currentMonth() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
  })
    .format(new Date())
    .slice(0, 7);
}

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; month?: string }>;
}) {
  const user = await requirePermission("payroll", "view");
  const { error = "", month: errMonth = "" } = await searchParams;

  const [staff, runs, mayEdit, mayCreate] = await Promise.all([
    db.staffProfile.findMany({
      where: { archived: false },
      include: { salary: true },
      orderBy: { employeeNo: "asc" },
    }),
    db.payrollRun.findMany({
      include: { items: true },
      orderBy: { month: "desc" },
      take: 12,
    }),
    can(user.role, "payroll", "edit"),
    can(user.role, "payroll", "create"),
  ]);

  const monthlyGross = staff.reduce(
    (sum, s) => sum + (s.salary ? s.salary.basicCents + s.salary.allowancesCents : 0),
    0,
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink-900">Payroll</h1>
        <p className="mt-1 text-sm">
          Salary structures for {staff.length} active staff — monthly gross{" "}
          {formatMoney(monthlyGross)}. Statutory deductions (NSSF, SHIF, PAYE) are entered,
          not computed.
        </p>
      </div>

      {error === "exists" && (
        <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800">
          A run for {errMonth} already exists — delete the draft below to regenerate it.
        </p>
      )}
      {error === "nosalaries" && (
        <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800">
          No salary structures yet — set at least one basic salary below first.
        </p>
      )}

      {/* Runs */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-ink-400">
            Payroll runs
          </h2>
          {mayCreate && (
            <form action={generatePayroll} className="flex items-end gap-2">
              <div>
                <label htmlFor="month" className="mb-1 block text-xs font-bold text-ink-400">
                  Month
                </label>
                <input id="month" name="month" type="month" defaultValue={currentMonth()} className="field !py-1.5 text-sm" />
              </div>
              <button type="submit" className="btn btn-primary !py-1.5 text-xs">
                Generate run
              </button>
            </form>
          )}
        </div>
        <div className="card overflow-x-auto">
          <table className="table-admin">
            <thead>
              <tr>
                <th>Month</th>
                <th>Staff</th>
                <th className="text-right">Gross</th>
                <th className="text-right">Net</th>
                <th>Status</th>
                <th className="text-right">Open</th>
              </tr>
            </thead>
            <tbody>
              {runs.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-ink-400">
                    No runs yet — generate the first one above.
                  </td>
                </tr>
              )}
              {runs.map((run) => {
                const gross = run.items.reduce((s, i) => s + i.grossCents, 0);
                const net = run.items.reduce((s, i) => s + i.netCents, 0);
                return (
                  <tr key={run.id}>
                    <td className="font-mono text-sm font-bold text-ink-900">{run.month}</td>
                    <td>{run.items.length}</td>
                    <td className="text-right font-bold text-ink-900">{formatMoney(gross)}</td>
                    <td className="text-right">{formatMoney(net)}</td>
                    <td>
                      {run.status === "PAID" ? (
                        <span className="chip bg-leaf-500/10 text-leaf-600">Paid</span>
                      ) : (
                        <span className="chip bg-sun-400/15 text-sun-500">Draft</span>
                      )}
                    </td>
                    <td className="text-right">
                      <Link href={`/payroll/${run.id}`} className="text-xs font-bold text-brand-600 hover:text-brand-700">
                        Open →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Salary structures */}
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-ink-400">
          Salary structures (KES / month)
        </h2>
        <div className="card overflow-x-auto">
          <table className="table-admin">
            <thead>
              <tr>
                <th>Staff</th>
                <th>Basic</th>
                <th>Allowances</th>
                <th>NSSF</th>
                <th>SHIF</th>
                <th>PAYE</th>
                <th>Other ded.</th>
                <th className="text-right">Net</th>
                {mayEdit && <th className="text-right">Save</th>}
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => {
                const sal = s.salary;
                const net = sal
                  ? sal.basicCents + sal.allowancesCents - sal.nssfCents - sal.shifCents - sal.payeCents - sal.otherDeductCents
                  : 0;
                const cell = (name: string, value: number | undefined) =>
                  mayEdit ? (
                    <td>
                      <input
                        name={name}
                        form={`sal-${s.id}`}
                        defaultValue={value ? value / 100 : ""}
                        placeholder="0"
                        inputMode="decimal"
                        className="field !w-24 !py-1.5 text-right text-sm"
                        aria-label={`${name} for ${s.firstName} ${s.lastName}`}
                      />
                    </td>
                  ) : (
                    <td className="text-right">{value ? formatMoney(value) : "—"}</td>
                  );
                return (
                  <tr key={s.id}>
                    <td className="font-semibold text-ink-900">
                      {s.lastName}, {s.firstName}
                      <span className="ml-2 font-mono text-xs font-normal text-ink-400">{s.employeeNo}</span>
                    </td>
                    {cell("basic", sal?.basicCents)}
                    {cell("allowances", sal?.allowancesCents)}
                    {cell("nssf", sal?.nssfCents)}
                    {cell("shif", sal?.shifCents)}
                    {cell("paye", sal?.payeCents)}
                    {cell("other", sal?.otherDeductCents)}
                    <td className={`text-right font-bold ${net > 0 ? "text-leaf-600" : "text-ink-400"}`}>
                      {sal ? formatMoney(net) : "not set"}
                    </td>
                    {mayEdit && (
                      <td className="text-right">
                        <form id={`sal-${s.id}`} action={saveSalary}>
                          <input type="hidden" name="staffId" value={s.id} />
                          <button type="submit" className="btn btn-secondary !px-3 !py-1.5 text-xs">
                            Save
                          </button>
                        </form>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {mayEdit && (
          <p className="mt-2 text-xs text-ink-400">
            Amounts are in shillings. Edits affect future runs only — a generated month is
            a fixed snapshot.
          </p>
        )}
      </section>
    </div>
  );
}
