import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { leaveBalances } from "@/lib/staff";
import { LeaveApplyForm } from "@/components/staff-forms";

export const metadata: Metadata = { title: "My Leave" };

const LEAVE_STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-sun-400/15 text-sun-500",
  APPROVED: "bg-leaf-500/10 text-leaf-600",
  REJECTED: "bg-danger-500/10 text-danger-500",
};

/** Self-service leave for any signed-in user with a linked staff profile —
 *  needs no staff-module permission because it only touches own data. */
export default async function MyLeavePage({
  searchParams,
}: {
  searchParams: Promise<{ applied?: string }>;
}) {
  const user = await requireUser();
  const { applied = "" } = await searchParams;

  const staff = await db.staffProfile.findUnique({
    where: { userId: user.id },
    include: {
      leaves: { include: { leaveType: true }, orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!staff)
    return (
      <div className="mx-auto max-w-2xl">
        <div className="card p-8 text-center">
          <p className="font-display text-lg font-extrabold text-ink-900">
            No staff profile linked
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed">
            Your login is not linked to a staff record yet — ask the school administrator
            to link it from the Staff Directory.
          </p>
          <Link href="/" className="btn btn-secondary mt-4">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    );

  const year = new Date().getFullYear();
  const [balances, leaveTypes] = await Promise.all([
    leaveBalances(staff.id, year),
    db.leaveType.findMany({ where: { archived: false }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink-900">My Leave</h1>
        <p className="mt-1 text-sm">
          {staff.firstName} {staff.lastName} · <span className="font-mono text-xs">{staff.employeeNo}</span> ·{" "}
          {staff.designation}
        </p>
      </div>

      {applied && (
        <p className="rounded-xl bg-leaf-500/10 px-4 py-3 text-sm font-semibold text-leaf-600">
          Request submitted — you&rsquo;ll see the decision here.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {balances.map((b) => (
          <div key={b.leaveTypeId} className="card p-4">
            <p className="text-xs font-bold text-ink-700">{b.name}</p>
            <p className="font-display text-xl font-extrabold text-brand-600">
              {b.remaining}
              <span className="text-sm font-bold text-ink-400"> / {b.quota}</span>
            </p>
            <p className="text-[10px] text-ink-400">
              {b.used} used{b.pending > 0 ? ` · ${b.pending} pending` : ""}
            </p>
          </div>
        ))}
      </div>

      <LeaveApplyForm
        fixedStaffId={staff.id}
        leaveTypes={leaveTypes.map((t) => ({ id: t.id, name: t.name, daysPerYear: t.daysPerYear }))}
      />

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-ink-400">
          My requests
        </h2>
        <div className="card overflow-x-auto">
          <table className="table-admin">
            <thead>
              <tr>
                <th>Type</th>
                <th>Dates</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {staff.leaves.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-ink-400">
                    No requests yet.
                  </td>
                </tr>
              )}
              {staff.leaves.map((l) => (
                <tr key={l.id}>
                  <td className="font-semibold text-ink-900">{l.leaveType.name}</td>
                  <td className="whitespace-nowrap text-ink-500">
                    {l.startDate.toLocaleDateString("en-KE", { day: "numeric", month: "short", timeZone: "UTC" })}
                    {" – "}
                    {l.endDate.toLocaleDateString("en-KE", { day: "numeric", month: "short", timeZone: "UTC" })}
                  </td>
                  <td>{l.days}</td>
                  <td className="max-w-xs truncate text-ink-500">{l.reason}</td>
                  <td>
                    <span className={`chip ${LEAVE_STATUS_STYLE[l.status]}`}>
                      {l.status.toLowerCase()}
                      {l.status === "REJECTED" && l.decisionNote ? ` — ${l.decisionNote}` : ""}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
