import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { can, requirePermission } from "@/lib/rbac";
import { createLeaveType, decideLeave } from "@/lib/actions/staff-actions";
import { LeaveApplyForm } from "@/components/staff-forms";
import { PlusIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Leave Management" };

const LEAVE_STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-sun-400/15 text-sun-500",
  APPROVED: "bg-leaf-500/10 text-leaf-600",
  REJECTED: "bg-danger-500/10 text-danger-500",
};

export default async function LeavePage({
  searchParams,
}: {
  searchParams: Promise<{ applied?: string }>;
}) {
  const user = await requirePermission("staff", "view");
  const { applied = "" } = await searchParams;

  const [mayCreate, mayDecide, leaveTypes, pending, recent, staff] = await Promise.all([
    can(user.role, "staff", "create"),
    can(user.role, "staff", "edit"),
    db.leaveType.findMany({ where: { archived: false }, orderBy: { name: "asc" } }),
    db.leaveApplication.findMany({
      where: { status: "PENDING" },
      include: { staff: true, leaveType: true },
      orderBy: { createdAt: "asc" },
    }),
    db.leaveApplication.findMany({
      where: { status: { not: "PENDING" } },
      include: { staff: true, leaveType: true },
      orderBy: { updatedAt: "desc" },
      take: 12,
    }),
    db.staffProfile.findMany({ where: { archived: false }, orderBy: { employeeNo: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink-900">Leave Management</h1>
        <p className="mt-1 text-sm">
          {pending.length} request{pending.length === 1 ? "" : "s"} awaiting a decision.
          Staff with linked logins can also apply from their own dashboard.
        </p>
      </div>

      {applied && (
        <p className="rounded-xl bg-leaf-500/10 px-4 py-3 text-sm font-semibold text-leaf-600">
          Leave request submitted — it appears below for approval.
        </p>
      )}

      {/* Pending queue */}
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-ink-400">
          Awaiting decision
        </h2>
        <div className="card overflow-x-auto">
          <table className="table-admin">
            <thead>
              <tr>
                <th>Staff</th>
                <th>Type</th>
                <th>Dates</th>
                <th>Days</th>
                <th>Reason</th>
                {mayDecide && <th className="text-right">Decision</th>}
              </tr>
            </thead>
            <tbody>
              {pending.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-ink-400">
                    Nothing pending — all caught up.
                  </td>
                </tr>
              )}
              {pending.map((l) => (
                <tr key={l.id}>
                  <td className="font-semibold text-ink-900">
                    <Link href={`/staff/${l.staffId}`} className="hover:text-brand-600">
                      {l.staff.lastName}, {l.staff.firstName}
                    </Link>
                  </td>
                  <td>{l.leaveType.name}</td>
                  <td className="whitespace-nowrap text-ink-500">
                    {l.startDate.toLocaleDateString("en-KE", { day: "numeric", month: "short", timeZone: "UTC" })}
                    {" – "}
                    {l.endDate.toLocaleDateString("en-KE", { day: "numeric", month: "short", timeZone: "UTC" })}
                  </td>
                  <td>{l.days}</td>
                  <td className="max-w-40 truncate text-ink-500">{l.reason}</td>
                  {mayDecide && (
                    <td>
                      <div className="flex items-center justify-end gap-1.5">
                        <form action={decideLeave} className="flex items-center gap-1.5">
                          <input type="hidden" name="id" value={l.id} />
                          <input
                            name="note"
                            placeholder="Note"
                            className="field !w-24 !py-1.5 text-xs"
                            aria-label={`Decision note for ${l.staff.firstName}`}
                          />
                          <button type="submit" name="decision" value="approve" className="btn btn-primary !px-3 !py-1.5 text-xs">
                            Approve
                          </button>
                          <button type="submit" name="decision" value="reject" className="btn btn-danger !px-3 !py-1.5 text-xs">
                            Reject
                          </button>
                        </form>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {mayDecide && pending.length > 0 && (
          <p className="mt-2 text-xs text-ink-400">
            Approving fills the staff register with “On leave” for the working days in
            the range.
          </p>
        )}
      </section>

      {mayCreate && (
        <>
          <LeaveApplyForm
            staffOptions={staff.map((s) => ({
              id: s.id,
              label: `${s.lastName}, ${s.firstName} (${s.employeeNo})`,
            }))}
            leaveTypes={leaveTypes.map((t) => ({ id: t.id, name: t.name, daysPerYear: t.daysPerYear }))}
          />

          <form action={createLeaveType} className="card flex flex-wrap items-end gap-3 p-4">
            <div className="min-w-48">
              <label htmlFor="name" className="mb-1 block text-xs font-bold text-ink-400">
                New leave type
              </label>
              <input id="name" name="name" placeholder="e.g. Study" className="field !py-2 text-sm" />
            </div>
            <div>
              <label htmlFor="daysPerYear" className="mb-1 block text-xs font-bold text-ink-400">
                Days / year
              </label>
              <input id="daysPerYear" name="daysPerYear" placeholder="e.g. 10" className="field !w-28 !py-2 text-sm" inputMode="numeric" />
            </div>
            <button type="submit" className="btn btn-secondary !py-2 text-xs">
              <PlusIcon className="h-3.5 w-3.5" /> Add type
            </button>
            <p className="text-xs text-ink-400">
              Existing: {leaveTypes.map((t) => `${t.name} (${t.daysPerYear})`).join(" · ")}
            </p>
          </form>
        </>
      )}

      {/* Recent decisions */}
      {recent.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-ink-400">
            Recent decisions
          </h2>
          <div className="card overflow-x-auto">
            <table className="table-admin">
              <thead>
                <tr>
                  <th>Staff</th>
                  <th>Type</th>
                  <th>Days</th>
                  <th>Status</th>
                  <th>Decided by</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((l) => (
                  <tr key={l.id}>
                    <td className="font-semibold text-ink-900">
                      {l.staff.lastName}, {l.staff.firstName}
                    </td>
                    <td>{l.leaveType.name}</td>
                    <td>{l.days}</td>
                    <td>
                      <span className={`chip ${LEAVE_STATUS_STYLE[l.status]}`}>
                        {l.status.toLowerCase()}
                        {l.decisionNote ? ` — ${l.decisionNote}` : ""}
                      </span>
                    </td>
                    <td className="text-ink-500">{l.decidedBy ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
