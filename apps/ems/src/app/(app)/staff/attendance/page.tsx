import type { Metadata } from "next";
import { StaffAttendanceStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { can, requirePermission } from "@/lib/rbac";
import { saveStaffRegister } from "@/lib/actions/staff-actions";
import { MarkAllPresent } from "@/components/attendance-forms";

export const metadata: Metadata = { title: "Staff Attendance" };

const STATUS_LABELS: Record<StaffAttendanceStatus, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LATE: "Late",
  HALF_DAY: "Half day",
  ON_LEAVE: "On leave",
};

function todayIso() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default async function StaffAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; saved?: string }>;
}) {
  const user = await requirePermission("staff", "view");
  const { date: dateParam = "", saved = "" } = await searchParams;
  const dateStr = /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : todayIso();

  const [staff, mayMark] = await Promise.all([
    db.staffProfile.findMany({
      where: { archived: false },
      include: { attendance: { where: { date: new Date(`${dateStr}T00:00:00Z`) } } },
      orderBy: { employeeNo: "asc" },
    }),
    can(user.role, "staff", "create"),
  ]);

  const marked = staff.filter((s) => s.attendance.length > 0);
  const summary = Object.values(StaffAttendanceStatus).map((status) => ({
    status,
    count: marked.filter((s) => s.attendance[0]?.status === status).length,
  }));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink-900">Staff Attendance</h1>
          <p className="mt-1 text-sm">
            Daily register for all active staff. Approved leave fills itself in.
          </p>
        </div>
        <form method="get" className="flex flex-wrap items-end gap-2">
          <div>
            <label htmlFor="date" className="mb-1 block text-xs font-bold text-ink-400">
              Date
            </label>
            <input id="date" name="date" type="date" defaultValue={dateStr} className="field !py-1.5 text-sm" />
          </div>
          <button type="submit" className="btn btn-secondary !px-4 !py-1.5 text-xs">
            Open register
          </button>
        </form>
      </div>

      {saved && (
        <p className="rounded-xl bg-leaf-500/10 px-4 py-3 text-sm font-semibold text-leaf-600">
          Staff register saved for {dateStr}.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {summary.map((s) => (
          <span key={s.status} className="chip bg-paper-200 text-ink-700">
            {STATUS_LABELS[s.status]}: {s.count}
          </span>
        ))}
        <span className="chip bg-paper-200 text-ink-700">
          Unmarked: {staff.length - marked.length}
        </span>
      </div>

      <form action={saveStaffRegister}>
        <input type="hidden" name="date" value={dateStr} />
        <div className="card overflow-x-auto">
          <table className="table-admin">
            <thead>
              <tr>
                <th>Emp No.</th>
                <th>Name</th>
                <th>Designation</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {staff.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-ink-400">
                    No active staff records.
                  </td>
                </tr>
              )}
              {staff.map((s) => (
                <tr key={s.id}>
                  <td className="font-mono text-xs">{s.employeeNo}</td>
                  <td className="font-semibold text-ink-900">
                    {s.lastName}, {s.firstName}
                  </td>
                  <td className="text-ink-500">{s.designation}</td>
                  <td>
                    {mayMark ? (
                      <select
                        name={`st_${s.id}`}
                        defaultValue={s.attendance[0]?.status ?? "PRESENT"}
                        className="field !w-32 !py-1.5 text-sm"
                        aria-label={`Status for ${s.firstName} ${s.lastName}`}
                      >
                        {Object.values(StaffAttendanceStatus).map((st) => (
                          <option key={st} value={st}>
                            {STATUS_LABELS[st]}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span>{s.attendance[0] ? STATUS_LABELS[s.attendance[0].status] : "—"}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {mayMark && staff.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="submit" className="btn btn-primary">
              Save register
            </button>
            <MarkAllPresent />
            <p className="text-xs text-ink-400">
              Re-saving a day overwrites its earlier register (audited).
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
