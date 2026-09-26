import type { Metadata } from "next";
import { AttendanceStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { can, requirePermission } from "@/lib/rbac";
import { getActiveSession } from "@/lib/school";
import { saveRegister } from "@/lib/actions/attendance-actions";
import { MarkAllPresent } from "@/components/attendance-forms";

export const metadata: Metadata = { title: "Attendance" };

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LATE: "Late",
  HALF_DAY: "Half day",
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ stream?: string; date?: string; saved?: string }>;
}) {
  const user = await requirePermission("attendance", "view");
  const { stream: streamParam = "", date: dateParam = "", saved = "" } = await searchParams;
  const dateStr = /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : todayIso();

  const [classes, session, mayMark] = await Promise.all([
    db.schoolClass.findMany({
      where: { archived: false },
      include: { streams: { where: { archived: false }, orderBy: { name: "asc" } } },
      orderBy: { level: "asc" },
    }),
    getActiveSession(),
    can(user.role, "attendance", "create"),
  ]);

  const allStreams = classes.flatMap((c) =>
    c.streams.map((st) => ({ id: st.id, label: `${c.name} ${st.name}` })),
  );
  const selectedStream = allStreams.find((s) => s.id === streamParam) ?? allStreams[0];

  const enrollments =
    session && selectedStream
      ? await db.enrollment.findMany({
          where: {
            streamId: selectedStream.id,
            sessionId: session.id,
            student: { archived: false },
          },
          include: {
            student: true,
            attendance: { where: { date: new Date(`${dateStr}T00:00:00Z`) } },
          },
          orderBy: { student: { lastName: "asc" } },
        })
      : [];

  const marked = enrollments.filter((e) => e.attendance.length > 0);
  const summary = Object.values(AttendanceStatus).map((status) => ({
    status,
    count: marked.filter((e) => e.attendance[0]?.status === status).length,
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink-900">Attendance</h1>
          <p className="mt-1 text-sm">
            Daily register per stream{session ? ` — ${session.name}` : ""}.
          </p>
        </div>
        <form method="get" className="flex flex-wrap items-end gap-2">
          <div>
            <label htmlFor="stream" className="mb-1 block text-xs font-bold text-ink-400">
              Stream
            </label>
            <select id="stream" name="stream" defaultValue={selectedStream?.id ?? ""} className="field !w-40 !py-1.5 text-sm">
              {allStreams.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
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

      {!session ? (
        <p className="rounded-xl bg-sun-400/15 px-4 py-3 text-sm font-semibold text-ink-700">
          No active session — set one under Settings → Sessions &amp; Terms.
        </p>
      ) : enrollments.length === 0 ? (
        <p className="card p-6 text-sm text-ink-400">
          No active pupils enrolled in {selectedStream?.label} this session.
        </p>
      ) : (
        <>
          {saved && (
            <p className="rounded-xl bg-leaf-500/10 px-4 py-3 text-sm font-semibold text-leaf-600">
              Register saved for {selectedStream?.label} on {dateStr}.
            </p>
          )}

          {/* summary chips */}
          <div className="flex flex-wrap gap-2">
            {summary.map((s) => (
              <span key={s.status} className="chip bg-paper-200 text-ink-700">
                {STATUS_LABELS[s.status]}: {s.count}
              </span>
            ))}
            <span className="chip bg-paper-200 text-ink-700">
              Unmarked: {enrollments.length - marked.length}
            </span>
          </div>

          <form action={saveRegister}>
            <input type="hidden" name="streamId" value={selectedStream!.id} />
            <input type="hidden" name="date" value={dateStr} />
            <div className="card overflow-x-auto">
              <table className="table-admin">
                <thead>
                  <tr>
                    <th>Adm No.</th>
                    <th>Pupil</th>
                    <th>Status</th>
                    <th>Session %</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((e) => (
                    <tr key={e.id}>
                      <td className="font-mono text-xs">{e.student.admissionNo}</td>
                      <td className="font-semibold text-ink-900">
                        {e.student.lastName}, {e.student.firstName}
                      </td>
                      <td>
                        {mayMark ? (
                          <select
                            name={`st_${e.id}`}
                            defaultValue={e.attendance[0]?.status ?? "PRESENT"}
                            className="field !w-32 !py-1.5 text-sm"
                            aria-label={`Status for ${e.student.firstName} ${e.student.lastName}`}
                          >
                            {Object.values(AttendanceStatus).map((st) => (
                              <option key={st} value={st}>
                                {STATUS_LABELS[st]}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span>{e.attendance[0] ? STATUS_LABELS[e.attendance[0].status] : "—"}</span>
                        )}
                      </td>
                      <td>
                        <SessionPercent enrollmentId={e.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {mayMark && (
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
        </>
      )}
    </div>
  );
}

async function SessionPercent({ enrollmentId }: { enrollmentId: string }) {
  const [total, present] = await Promise.all([
    db.attendanceRecord.count({ where: { enrollmentId } }),
    db.attendanceRecord.count({
      where: { enrollmentId, status: { in: ["PRESENT", "LATE", "HALF_DAY"] } },
    }),
  ]);
  if (total === 0) return <span className="text-ink-400">—</span>;
  const pct = Math.round((present / total) * 100);
  return (
    <span className={pct >= 90 ? "font-bold text-leaf-600" : pct >= 75 ? "font-bold text-sun-500" : "font-bold text-danger-500"}>
      {pct}%
    </span>
  );
}
