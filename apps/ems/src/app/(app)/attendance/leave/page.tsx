import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { can, requirePermission } from "@/lib/rbac";
import { decideStudentLeave } from "@/lib/actions/student-leave-actions";

export const metadata: Metadata = { title: "Pupil Leave Requests" };

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-sun-400/15 text-sun-500",
  APPROVED: "bg-leaf-500/10 text-leaf-600",
  REJECTED: "bg-danger-500/10 text-danger-500",
};

export default async function StudentLeavePage({
  searchParams,
}: {
  searchParams: Promise<{ applied?: string }>;
}) {
  const user = await requirePermission("attendance", "view");
  const { applied = "" } = await searchParams;

  const [mayDecide, pending, recent] = await Promise.all([
    can(user.role, "attendance", "edit"),
    db.studentLeave.findMany({
      where: { status: "PENDING" },
      include: { enrollment: { include: { student: true, stream: { include: { class: true } } } } },
      orderBy: { createdAt: "asc" },
    }),
    db.studentLeave.findMany({
      where: { status: { not: "PENDING" } },
      include: { enrollment: { include: { student: true, stream: { include: { class: true } } } } },
      orderBy: { updatedAt: "desc" },
      take: 12,
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-400">
          <Link href="/attendance" className="hover:text-brand-600">Attendance</Link>
        </p>
        <h1 className="font-display text-2xl font-extrabold text-ink-900">
          Pupil Leave Requests
        </h1>
        <p className="mt-1 text-sm">
          {pending.length} awaiting a decision. Approving marks the register
          &ldquo;Absent — approved leave&rdquo; for the working days in the range.
        </p>
      </div>

      {applied && (
        <p className="rounded-xl bg-leaf-500/10 px-4 py-3 text-sm font-semibold text-leaf-600">
          Request logged on behalf of the pupil.
        </p>
      )}

      <div className="card overflow-x-auto">
        <table className="table-admin">
          <thead>
            <tr>
              <th>Pupil</th>
              <th>Class</th>
              <th>Dates</th>
              <th>Reason</th>
              <th>By</th>
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
                  {l.enrollment.student.lastName}, {l.enrollment.student.firstName}
                </td>
                <td>
                  {l.enrollment.stream.class.name} {l.enrollment.stream.name}
                </td>
                <td className="whitespace-nowrap text-ink-500">
                  {l.startDate.toLocaleDateString("en-KE", { day: "numeric", month: "short", timeZone: "UTC" })}
                  {" – "}
                  {l.endDate.toLocaleDateString("en-KE", { day: "numeric", month: "short", timeZone: "UTC" })}
                </td>
                <td className="max-w-40 truncate text-ink-500">{l.reason}</td>
                <td className="text-ink-400">{l.appliedBy}</td>
                {mayDecide && (
                  <td>
                    <form action={decideStudentLeave} className="flex items-center justify-end gap-1.5">
                      <input type="hidden" name="id" value={l.id} />
                      <input
                        name="note"
                        placeholder="Note"
                        className="field !w-24 !py-1.5 text-xs"
                        aria-label={`Decision note for ${l.enrollment.student.firstName}`}
                      />
                      <button type="submit" name="decision" value="approve" className="btn btn-primary !px-3 !py-1.5 text-xs">
                        Approve
                      </button>
                      <button type="submit" name="decision" value="reject" className="btn btn-danger !px-3 !py-1.5 text-xs">
                        Reject
                      </button>
                    </form>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {recent.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-ink-400">
            Recent decisions
          </h2>
          <div className="card overflow-x-auto">
            <table className="table-admin">
              <thead>
                <tr>
                  <th>Pupil</th>
                  <th>Dates</th>
                  <th>Status</th>
                  <th>Decided by</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((l) => (
                  <tr key={l.id}>
                    <td className="font-semibold text-ink-900">
                      {l.enrollment.student.lastName}, {l.enrollment.student.firstName}
                    </td>
                    <td className="whitespace-nowrap text-ink-500">
                      {l.startDate.toLocaleDateString("en-KE", { day: "numeric", month: "short", timeZone: "UTC" })}
                      {" – "}
                      {l.endDate.toLocaleDateString("en-KE", { day: "numeric", month: "short", timeZone: "UTC" })}
                    </td>
                    <td>
                      <span className={`chip ${STATUS_STYLE[l.status]}`}>
                        {l.status.toLowerCase()}
                        {l.decisionNote ? ` — ${l.decisionNote}` : ""}
                      </span>
                    </td>
                    <td className="text-ink-400">{l.decidedBy ?? "—"}</td>
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
