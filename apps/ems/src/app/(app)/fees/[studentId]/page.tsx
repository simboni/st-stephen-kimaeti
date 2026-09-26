import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { can, requirePermission } from "@/lib/rbac";
import { getActiveSession } from "@/lib/school";
import { studentBalance, termBreakdown, voteHeadStatement } from "@/lib/fees";
import { formatMoney } from "@/lib/money";
import { voidPayment } from "@/lib/actions/fees-actions";
import { AdjustmentForm, PaymentForm } from "@/components/fees-forms";

export const metadata: Metadata = { title: "Fee account" };

export default async function StudentFeesPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const user = await requirePermission("fees", "view");
  const { studentId } = await params;

  const [student, session, mayCollect, mayAdjust, mayVoid] = await Promise.all([
    db.student.findUnique({
      where: { id: studentId },
      include: { enrollments: { include: { stream: { include: { class: true } } } } },
    }),
    getActiveSession(),
    can(user.role, "fees", "create"),
    can(user.role, "fees", "edit"),
    can(user.role, "fees", "archive"),
  ]);
  if (!student) notFound();
  if (!session)
    return <p className="card p-6 text-sm">No active session — set one in Settings first.</p>;

  const [balance, statement, breakdown] = await Promise.all([
    studentBalance(studentId, session.id),
    voteHeadStatement(studentId, session.id),
    termBreakdown(studentId, session.id),
  ]);
  const current = student.enrollments.find((e) => e.sessionId === session.id);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="card flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h1 className="font-display text-xl font-extrabold text-ink-900">
            {student.firstName} {student.lastName}
          </h1>
          <p className="text-sm text-ink-500">
            <span className="font-mono text-xs">{student.admissionNo}</span>
            {current && ` · ${current.stream.class.name} ${current.stream.name}`}
            {` · ${student.boarding === "BOARDER" ? "Boarder" : "Day scholar"} · ${session.name}`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-400">Balance due</p>
          <p className={`font-display text-2xl font-extrabold ${balance.balanceCents > 0 ? "text-danger-500" : "text-leaf-600"}`}>
            {formatMoney(balance.balanceCents)}
          </p>
          {breakdown.arrearsCents > 0 && (
            <p className="text-xs font-bold text-danger-500">
              incl. arrears {formatMoney(breakdown.arrearsCents)} from previous terms
            </p>
          )}
          <Link href={`/students/${student.id}`} className="text-xs font-bold text-brand-600 hover:text-brand-700">
            View profile →
          </Link>
        </div>
      </div>

      {/* Term-by-term position — where the arrears sit */}
      <section className="card overflow-x-auto">
        <div className="flex flex-wrap items-center justify-between gap-2 px-6 pt-5">
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-ink-400">
            Term position
          </h2>
          <p className="text-xs text-ink-400">
            Payments settle the oldest charges first — unpaid past terms carry into the
            current bill as arrears.
          </p>
        </div>
        <table className="table-admin mt-2">
          <thead>
            <tr>
              <th>Billing period</th>
              <th className="text-right">Charged</th>
              <th className="text-right">Settled</th>
              <th className="text-right">Outstanding</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {breakdown.buckets
              .filter((b) => b.chargedCents !== 0 || b.outstandingCents !== 0)
              .map((b) => (
                <tr key={b.key}>
                  <td className="font-semibold text-ink-900">{b.name}</td>
                  <td className="text-right">{formatMoney(b.chargedCents)}</td>
                  <td className="text-right text-leaf-600">{formatMoney(b.settledCents)}</td>
                  <td className={`text-right font-bold ${b.outstandingCents > 0 ? "text-danger-500" : "text-leaf-600"}`}>
                    {formatMoney(b.outstandingCents)}
                  </td>
                  <td>
                    {b.isCurrent ? (
                      <span className="chip bg-brand-50 text-brand-700">Current term</span>
                    ) : b.isPast && b.outstandingCents > 0 ? (
                      <span className="chip bg-danger-500/10 text-danger-500">Arrears</span>
                    ) : b.isPast ? (
                      <span className="chip bg-leaf-500/10 text-leaf-600">Cleared</span>
                    ) : (
                      <span className="chip bg-paper-200 text-ink-400">Upcoming</span>
                    )}
                  </td>
                </tr>
              ))}
            <tr className="font-bold">
              <td className="font-display text-ink-900">Position today</td>
              <td colSpan={2} className="text-right text-ink-500">
                arrears {formatMoney(breakdown.arrearsCents)} + current term{" "}
                {formatMoney(breakdown.currentDueCents)}
                {balance.balanceCents - breakdown.arrearsCents - breakdown.currentDueCents > 0 &&
                  ` + upcoming ${formatMoney(balance.balanceCents - breakdown.arrearsCents - breakdown.currentDueCents)}`}
              </td>
              <td className={`text-right font-display ${balance.balanceCents > 0 ? "text-danger-500" : "text-leaf-600"}`}>
                {formatMoney(balance.balanceCents)}
              </td>
              <td />
            </tr>
          </tbody>
        </table>
      </section>

      {/* Vote-head statement — the collection roadmap */}
      <section className="card overflow-x-auto">
        <div className="flex items-center justify-between px-6 pt-5">
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-ink-400">
            Balance by vote head
          </h2>
          <p className="text-xs text-ink-400">Collections are guided by these lines.</p>
        </div>
        <table className="table-admin mt-2">
          <thead>
            <tr>
              <th>Vote head</th>
              <th className="text-right">Charged</th>
              <th className="text-right">Adjustments</th>
              <th className="text-right">Paid</th>
              <th className="text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {statement.rows.map((r) => (
              <tr
                key={r.feeTypeId}
                className={r.chargedCents === 0 && r.adjustmentCents === 0 && r.paidCents === 0 ? "opacity-50" : ""}
              >
                <td className="font-semibold text-ink-900">{r.name}</td>
                <td className="text-right">{formatMoney(r.chargedCents)}</td>
                <td className={`text-right ${r.adjustmentCents < 0 ? "text-leaf-600" : r.adjustmentCents > 0 ? "" : "text-ink-300"}`}>
                  {r.adjustmentCents !== 0 ? formatMoney(r.adjustmentCents) : "—"}
                </td>
                <td className="text-right text-leaf-600">{formatMoney(r.paidCents)}</td>
                <td className={`text-right font-bold ${r.balanceCents > 0 ? "text-danger-500" : "text-leaf-600"}`}>
                  {formatMoney(r.balanceCents)}
                </td>
              </tr>
            ))}
            {statement.generalAdjustmentCents !== 0 && (
              <tr>
                <td className="text-ink-500">General adjustments (no vote head)</td>
                <td />
                <td className={`text-right ${statement.generalAdjustmentCents < 0 ? "text-leaf-600" : ""}`}>
                  {formatMoney(statement.generalAdjustmentCents)}
                </td>
                <td />
                <td className={`text-right font-bold ${statement.generalAdjustmentCents > 0 ? "text-danger-500" : "text-leaf-600"}`}>
                  {formatMoney(statement.generalAdjustmentCents)}
                </td>
              </tr>
            )}
            {statement.unallocatedPaidCents !== 0 && (
              <tr>
                <td className="text-ink-500">Unallocated payments (older receipts)</td>
                <td />
                <td />
                <td className="text-right text-leaf-600">{formatMoney(statement.unallocatedPaidCents)}</td>
                <td className="text-right font-bold text-leaf-600">
                  {formatMoney(-statement.unallocatedPaidCents)}
                </td>
              </tr>
            )}
            <tr className="font-bold">
              <td className="font-display text-ink-900">Total</td>
              <td className="text-right">{formatMoney(balance.charges.totalCents)}</td>
              <td className="text-right">
                {formatMoney(balance.chargedCents - balance.charges.totalCents)}
              </td>
              <td className="text-right text-leaf-600">{formatMoney(balance.paidCents)}</td>
              <td className={`text-right font-display ${statement.totalBalanceCents > 0 ? "text-danger-500" : "text-leaf-600"}`}>
                {formatMoney(statement.totalBalanceCents)}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Charges */}
        <section className="card p-6">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-ink-400">
            Charges this session
          </h2>
          <table className="table-admin">
            <tbody>
              {balance.charges.items.map((item) => (
                <tr key={item.id}>
                  <td className="font-semibold text-ink-900">
                    {item.feeType.name}
                    <span className="block text-xs font-normal text-ink-400">
                      {item.term?.name ?? "Whole session"}
                      {item.boarding ? ` · ${item.boarding === "BOARDER" ? "boarders" : "day scholars"}` : ""}
                    </span>
                  </td>
                  <td className="text-right">{formatMoney(item.amountCents)}</td>
                </tr>
              ))}
              {balance.adjustments.map((a) => (
                <tr key={a.id}>
                  <td className="font-semibold text-ink-900">
                    {a.label}
                    <span className="block text-xs font-normal text-ink-400">
                      Adjustment · {a.createdBy ?? ""}
                    </span>
                  </td>
                  <td className={`text-right ${a.amountCents < 0 ? "text-leaf-600" : ""}`}>
                    {formatMoney(a.amountCents)}
                  </td>
                </tr>
              ))}
              <tr>
                <td className="font-display font-extrabold text-ink-900">Total charged</td>
                <td className="text-right font-display font-extrabold text-ink-900">
                  {formatMoney(balance.chargedCents)}
                </td>
              </tr>
            </tbody>
          </table>

          {mayAdjust && (
            <AdjustmentForm
              studentId={student.id}
              heads={statement.rows.map((r) => ({ feeTypeId: r.feeTypeId, name: r.name }))}
            />
          )}
        </section>

        {/* Record payment */}
        <section className="card p-6">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-ink-400">
            Record a payment (per vote head)
          </h2>
          {mayCollect ? (
            <PaymentForm
              studentId={student.id}
              heads={statement.rows.map((r) => ({
                feeTypeId: r.feeTypeId,
                name: r.name,
                balanceCents: r.balanceCents,
              }))}
            />
          ) : (
            <p className="text-sm text-ink-400">Your role can view but not collect.</p>
          )}
        </section>
      </div>

      {/* Payment history */}
      <section className="card overflow-x-auto">
        <table className="table-admin">
          <thead>
            <tr>
              <th>Receipt</th>
              <th>Date</th>
              <th>Method</th>
              <th>Reference</th>
              <th>Received by</th>
              <th className="text-right">Amount</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {balance.payments.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-ink-400">
                  No payments recorded this session.
                </td>
              </tr>
            )}
            {balance.payments.map((p) => (
              <tr key={p.id} className={p.voided ? "opacity-50" : ""}>
                <td>
                  <Link href={`/fees/receipt/${p.id}`} className="font-mono text-xs font-bold text-brand-600 hover:text-brand-700">
                    {p.receiptNo}
                  </Link>
                  {p.voided && (
                    <span className="chip ml-2 bg-danger-500/10 text-danger-500" title={p.voidReason ?? ""}>
                      Voided
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap text-ink-400">
                  {p.receivedAt.toLocaleDateString("en-KE", { dateStyle: "medium", timeZone: "Africa/Nairobi" })}
                </td>
                <td>{p.method}</td>
                <td className="font-mono text-xs">{p.reference ?? "—"}</td>
                <td>{p.receivedBy}</td>
                <td className="text-right font-bold text-ink-900">
                  {formatMoney(p.amountCents)}
                  {p.allocations.length > 0 && (
                    <span className="block text-xs font-normal text-ink-400">
                      {[...p.allocations]
                        .sort((a, b) => a.feeType.name.localeCompare(b.feeType.name))
                        .map((a) => `${a.feeType.name} ${formatMoney(a.amountCents)}`)
                        .join(" + ")}
                    </span>
                  )}
                </td>
                <td className="text-right">
                  {mayVoid && !p.voided && (
                    <form action={voidPayment} className="inline-flex items-center gap-1.5">
                      <input type="hidden" name="id" value={p.id} />
                      <input name="reason" placeholder="Reason" className="field !w-32 !py-1 text-xs" aria-label={`Void reason for ${p.receiptNo}`} />
                      <button type="submit" className="btn btn-danger !px-2.5 !py-1 text-xs">
                        Void
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan={5} className="font-display font-extrabold text-ink-900">
                Total paid
              </td>
              <td className="text-right font-display font-extrabold text-leaf-600">
                {formatMoney(balance.paidCents)}
              </td>
              <td />
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
}
