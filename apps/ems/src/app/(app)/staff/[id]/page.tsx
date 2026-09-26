import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { can, requirePermission } from "@/lib/rbac";
import { leaveBalances } from "@/lib/staff";
import {
  linkStaffAccount,
  setStaffArchived,
  unlinkStaffAccount,
} from "@/lib/actions/staff-actions";
import { StaffForm } from "@/components/staff-forms";
import { BanIcon, CheckIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Staff Profile" };

const LEAVE_STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-sun-400/15 text-sun-500",
  APPROVED: "bg-leaf-500/10 text-leaf-600",
  REJECTED: "bg-danger-500/10 text-danger-500",
};

export default async function StaffProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await requirePermission("staff", "view");
  const { id } = await params;
  const { saved = "" } = await searchParams;

  const staff = await db.staffProfile.findUnique({
    where: { id },
    include: {
      user: true,
      leaves: { include: { leaveType: true }, orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  if (!staff) notFound();

  const year = new Date().getFullYear();
  const [mayEdit, mayArchive, balances, presentDays, totalDays] = await Promise.all([
    can(user.role, "staff", "edit"),
    can(user.role, "staff", "archive"),
    leaveBalances(staff.id, year),
    db.staffAttendanceRecord.count({
      where: { staffId: staff.id, status: { in: ["PRESENT", "LATE", "HALF_DAY"] } },
    }),
    db.staffAttendanceRecord.count({ where: { staffId: staff.id } }),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-400">
            <Link href="/staff" className="hover:text-brand-600">Staff Directory</Link> ·{" "}
            <span className="font-mono">{staff.employeeNo}</span>
          </p>
          <h1 className="font-display text-2xl font-extrabold text-ink-900">
            {staff.firstName} {staff.lastName}
            {staff.archived && (
              <span className="chip ml-3 bg-danger-500/10 align-middle text-danger-500">
                Archived{staff.archiveReason ? ` — ${staff.archiveReason}` : ""}
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm">
            {staff.designation}
            {staff.department ? ` · ${staff.department}` : ""}
            {totalDays > 0
              ? ` · attendance ${Math.round((presentDays / totalDays) * 100)}% of ${totalDays} marked day${totalDays === 1 ? "" : "s"}`
              : ""}
          </p>
        </div>
        {mayArchive && (
          <form action={setStaffArchived} className="flex items-center gap-2">
            <input type="hidden" name="id" value={staff.id} />
            <input type="hidden" name="archived" value={staff.archived ? "false" : "true"} />
            {!staff.archived && (
              <input name="reason" placeholder="Reason (e.g. left service)" className="field !w-48 !py-1.5 text-xs" aria-label="Archive reason" />
            )}
            <button
              type="submit"
              className={staff.archived ? "btn btn-secondary !py-1.5 text-xs !text-leaf-600" : "btn btn-danger !py-1.5 text-xs"}
            >
              {staff.archived ? (
                <>
                  <CheckIcon className="h-3.5 w-3.5" /> Restore
                </>
              ) : (
                <>
                  <BanIcon className="h-3.5 w-3.5" /> Archive
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {saved && (
        <p className="rounded-xl bg-leaf-500/10 px-4 py-3 text-sm font-semibold text-leaf-600">
          Profile saved.
        </p>
      )}

      {/* Login link */}
      <div className="card flex flex-wrap items-center gap-3 p-4">
        <p className="text-sm font-bold text-ink-700">System login:</p>
        {staff.user ? (
          <>
            <span className="chip bg-leaf-500/10 text-leaf-600">{staff.user.username}</span>
            <span className="text-xs text-ink-400">
              Signing in unlocks leave self-service on their dashboard.
            </span>
            {mayEdit && (
              <form action={unlinkStaffAccount}>
                <input type="hidden" name="id" value={staff.id} />
                <button type="submit" className="btn btn-secondary !py-1.5 text-xs">
                  Unlink
                </button>
              </form>
            )}
          </>
        ) : mayEdit ? (
          <form action={linkStaffAccount} className="flex items-center gap-2">
            <input type="hidden" name="id" value={staff.id} />
            <input
              name="username"
              placeholder="Existing username"
              className="field !w-44 !py-1.5 text-xs"
              aria-label="Username to link"
            />
            <button type="submit" className="btn btn-secondary !py-1.5 text-xs">
              Link account
            </button>
            <span className="text-xs text-ink-400">
              Create staff logins under Users &amp; Logins first.
            </span>
          </form>
        ) : (
          <span className="chip bg-paper-200 text-ink-400">none</span>
        )}
      </div>

      {/* Leave balances */}
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-ink-400">
          Leave balances {year}
        </h2>
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
      </section>

      {/* Leave history */}
      {staff.leaves.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-ink-400">
            Recent leave requests
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
                      <span className={`chip ${LEAVE_STATUS_STYLE[l.status]}`}>{l.status.toLowerCase()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Contact & profile */}
      {mayEdit ? (
        <StaffForm
          staff={{
            id: staff.id,
            firstName: staff.firstName,
            lastName: staff.lastName,
            gender: staff.gender,
            designation: staff.designation,
            department: staff.department ?? "",
            qualification: staff.qualification ?? "",
            phone: staff.phone ?? "",
            email: staff.email ?? "",
            joinedAt: staff.joinedAt ? staff.joinedAt.toISOString().slice(0, 10) : "",
          }}
        />
      ) : (
        <div className="card p-6">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
            {[
              ["Phone", staff.phone ?? "—"],
              ["Email", staff.email ?? "—"],
              ["Qualification", staff.qualification ?? "—"],
              ["Joined", staff.joinedAt ? staff.joinedAt.toLocaleDateString("en-KE", { dateStyle: "medium", timeZone: "UTC" }) : "—"],
            ].map(([label, value]) => (
              <div key={label as string}>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{label}</dt>
                <dd className="font-semibold text-ink-900">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
