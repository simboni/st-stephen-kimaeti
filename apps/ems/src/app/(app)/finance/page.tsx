import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { can, requirePermission } from "@/lib/rbac";
import { formatMoney } from "@/lib/money";
import {
  createFinanceHead,
  setFinanceHeadArchived,
  voidFinanceEntry,
} from "@/lib/actions/finance-actions";
import { FinanceEntryForm } from "@/components/finance-forms";
import { BanIcon, CheckIcon, PlusIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Income & Expenses" };

/** Today's date parts in the school's timezone. */
function nairobiToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const total = y * 12 + (m - 1) + delta;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

function monthLabel(month: string): string {
  return new Date(`${month}-01T12:00:00Z`).toLocaleDateString("en-KE", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const user = await requirePermission("finance", "view");
  const { month: monthParam } = await searchParams;
  const month = /^\d{4}-\d{2}$/.test(monthParam ?? "") ? monthParam! : nairobiToday().slice(0, 7);
  const monthStart = new Date(`${month}-01T00:00:00Z`);
  const monthEnd = new Date(`${shiftMonth(month, 1)}-01T00:00:00Z`);

  const [mayCreate, mayArchive, heads, entries, feesAgg] = await Promise.all([
    can(user.role, "finance", "create"),
    can(user.role, "finance", "archive"),
    db.financeHead.findMany({ orderBy: [{ kind: "asc" }, { name: "asc" }] }),
    db.financeEntry.findMany({
      where: { date: { gte: monthStart, lt: monthEnd } },
      include: { head: true },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    }),
    db.feePayment.aggregate({
      _sum: { amountCents: true },
      where: { voided: false, receivedAt: { gte: monthStart, lt: monthEnd } },
    }),
  ]);

  const live = entries.filter((e) => !e.voided);
  const incomeCents = live
    .filter((e) => e.head.kind === "INCOME")
    .reduce((sum, e) => sum + e.amountCents, 0);
  const expenseCents = live
    .filter((e) => e.head.kind === "EXPENSE")
    .reduce((sum, e) => sum + e.amountCents, 0);
  const feesCents = feesAgg._sum.amountCents ?? 0;
  const netCents = feesCents + incomeCents - expenseCents;

  const summary: [string, number, string][] = [
    ["Fees collected", feesCents, "text-leaf-600"],
    ["Other income", incomeCents, "text-leaf-600"],
    ["Expenses", expenseCents, "text-danger-500"],
    ["Net for the month", netCents, netCents >= 0 ? "text-leaf-600" : "text-danger-500"],
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink-900">
            Income &amp; Expenses
          </h1>
          <p className="mt-1 text-sm">
            The school ledger for {monthLabel(month)} — fee collections flow in from the Fees
            module automatically; record everything else here.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/finance?month=${shiftMonth(month, -1)}`} className="btn btn-secondary !py-2 text-xs">
            ← {monthLabel(shiftMonth(month, -1))}
          </Link>
          <Link href={`/finance?month=${shiftMonth(month, 1)}`} className="btn btn-secondary !py-2 text-xs">
            {monthLabel(shiftMonth(month, 1))} →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summary.map(([label, cents, color]) => (
          <div key={label} className="card p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-400">{label}</p>
            <p className={`mt-1 font-display text-xl font-extrabold ${color}`}>
              {formatMoney(cents)}
            </p>
          </div>
        ))}
      </div>

      {mayCreate && (
        <>
          <FinanceEntryForm
            heads={heads
              .filter((h) => !h.archived)
              .map((h) => ({ id: h.id, name: h.name, kind: h.kind }))}
            today={nairobiToday()}
          />

          <div className="card space-y-3 p-4">
            <form action={createFinanceHead} className="flex flex-wrap items-end gap-3">
              <div className="min-w-56">
                <label htmlFor="name" className="mb-1 block text-xs font-bold text-ink-400">
                  New head (category)
                </label>
                <input id="name" name="name" placeholder="e.g. Transport Hire" className="field !py-2 text-sm" />
              </div>
              <div>
                <label htmlFor="kind" className="mb-1 block text-xs font-bold text-ink-400">
                  Kind
                </label>
                <select id="kind" name="kind" defaultValue="EXPENSE" className="field !py-2 text-sm">
                  <option value="INCOME">Income</option>
                  <option value="EXPENSE">Expense</option>
                </select>
              </div>
              <button type="submit" className="btn btn-secondary !py-2 text-xs">
                <PlusIcon className="h-3.5 w-3.5" /> Add head
              </button>
            </form>
            {mayArchive && heads.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 border-t border-paper-200 pt-3">
                <span className="text-xs text-ink-400">Click a head to archive / restore it:</span>
                {heads.map((h) => (
                  <form key={h.id} action={setFinanceHeadArchived}>
                    <input type="hidden" name="id" value={h.id} />
                    <input type="hidden" name="archived" value={h.archived ? "false" : "true"} />
                    <button
                      type="submit"
                      className={`chip cursor-pointer ${h.archived ? "bg-paper-200 text-ink-400 line-through" : h.kind === "INCOME" ? "bg-leaf-500/10 text-leaf-600" : "bg-danger-500/10 text-danger-500"}`}
                      title={h.archived ? `Restore ${h.name}` : `Archive ${h.name}`}
                    >
                      {h.name}
                    </button>
                  </form>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <div className="card overflow-x-auto">
        <table className="table-admin">
          <thead>
            <tr>
              <th>Date</th>
              <th>Head</th>
              <th>Description</th>
              <th>Reference</th>
              <th>Recorded by</th>
              <th className="text-right">Income</th>
              <th className="text-right">Expense</th>
              {mayArchive && <th className="text-right">Void</th>}
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-ink-400">
                  No transactions recorded in {monthLabel(month)} yet.
                </td>
              </tr>
            )}
            {entries.map((entry) => (
              <tr key={entry.id} className={entry.voided ? "opacity-50" : ""}>
                <td className="whitespace-nowrap text-ink-400">
                  {entry.date.toLocaleDateString("en-KE", {
                    day: "numeric",
                    month: "short",
                    timeZone: "UTC",
                  })}
                </td>
                <td className="font-semibold text-ink-900">
                  {entry.head.name}
                  {entry.voided && (
                    <span className="chip ml-2 bg-danger-500/10 text-danger-500" title={entry.voidReason ?? ""}>
                      Voided
                    </span>
                  )}
                </td>
                <td className="max-w-xs truncate text-ink-500">{entry.description}</td>
                <td className="text-ink-400">{entry.reference ?? "—"}</td>
                <td className="text-ink-400">{entry.recordedBy}</td>
                <td className="text-right font-bold text-leaf-600">
                  {entry.head.kind === "INCOME" ? formatMoney(entry.amountCents) : ""}
                </td>
                <td className="text-right font-bold text-danger-500">
                  {entry.head.kind === "EXPENSE" ? formatMoney(entry.amountCents) : ""}
                </td>
                {mayArchive && (
                  <td>
                    {!entry.voided ? (
                      <form action={voidFinanceEntry} className="flex items-center justify-end gap-1.5">
                        <input type="hidden" name="id" value={entry.id} />
                        <input
                          name="reason"
                          placeholder="Reason"
                          className="field !w-28 !py-1.5 text-xs"
                          aria-label={`Void reason for ${entry.description}`}
                        />
                        <button
                          type="submit"
                          className="btn btn-danger !p-2"
                          title="Void entry"
                          aria-label={`Void ${entry.description}`}
                        >
                          <BanIcon className="h-3.5 w-3.5" />
                        </button>
                      </form>
                    ) : (
                      <span className="flex justify-end text-ink-300" title="Already voided">
                        <CheckIcon className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
