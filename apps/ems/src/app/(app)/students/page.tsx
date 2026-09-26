import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { can, requirePermission } from "@/lib/rbac";
import { getActiveSession } from "@/lib/school";
import { PlusIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Students" };

const PAGE_SIZE = 25;

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; stream?: string; show?: string; page?: string; imported?: string }>;
}) {
  const user = await requirePermission("students", "view");
  const { q = "", stream = "", show = "", page = "1", imported = "" } = await searchParams;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);

  const [session, mayCreate, mayEdit] = await Promise.all([
    getActiveSession(),
    can(user.role, "students", "create"),
    can(user.role, "students", "edit"),
  ]);

  const classes = await db.schoolClass.findMany({
    where: { archived: false },
    include: { streams: { where: { archived: false }, orderBy: { name: "asc" } } },
    orderBy: { level: "asc" },
  });
  const allStreams = classes.flatMap((c) =>
    c.streams.map((st) => ({ id: st.id, label: `${c.name} ${st.name}` })),
  );

  const where = {
    ...(show === "archived" ? { archived: true } : show === "all" ? {} : { archived: false }),
    ...(q
      ? {
          OR: [
            { firstName: { contains: q, mode: "insensitive" as const } },
            { lastName: { contains: q, mode: "insensitive" as const } },
            { admissionNo: { contains: q, mode: "insensitive" as const } },
            { upiNumber: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(stream && session
      ? { enrollments: { some: { streamId: stream, sessionId: session.id } } }
      : {}),
  };

  const [students, total] = await Promise.all([
    db.student.findMany({
      where,
      include: {
        guardians: { take: 1 },
        enrollments: {
          where: { sessionId: session?.id ?? "none" },
          include: { stream: { include: { class: true } } },
        },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      skip: (pageNum - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.student.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const query = (p: number) =>
    `?${new URLSearchParams({
      ...(q ? { q } : {}),
      ...(stream ? { stream } : {}),
      ...(show ? { show } : {}),
      page: String(p),
    })}`;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink-900">Students</h1>
          <p className="mt-1 text-sm">
            {total} pupil{total === 1 ? "" : "s"}
            {session ? ` · placements shown for ${session.name}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {mayEdit && (
            <Link href="/students/promote" className="btn btn-secondary">
              Promotions
            </Link>
          )}
          {mayCreate && (
            <Link href="/students/import" className="btn btn-secondary">
              Import CSV
            </Link>
          )}
          {mayCreate && (
            <Link href="/students/new" className="btn btn-primary">
              <PlusIcon className="h-4 w-4" /> Admit pupil
            </Link>
          )}
        </div>
      </div>

      {imported && (
        <p className="rounded-xl bg-leaf-500/10 px-4 py-3 text-sm font-semibold text-leaf-600">
          Import complete — {imported} pupil{imported === "1" ? "" : "s"} admitted and enrolled.
        </p>
      )}

      <form className="card flex flex-wrap items-end gap-3 p-4" method="get">
        <div className="min-w-48 flex-1">
          <label htmlFor="q" className="mb-1 block text-xs font-bold text-ink-400">
            Search
          </label>
          <input id="q" name="q" defaultValue={q} placeholder="Name, admission or UPI number…" className="field" />
        </div>
        <div>
          <label htmlFor="stream" className="mb-1 block text-xs font-bold text-ink-400">
            Class
          </label>
          <select id="stream" name="stream" defaultValue={stream} className="field !w-44">
            <option value="">All classes</option>
            {allStreams.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="show" className="mb-1 block text-xs font-bold text-ink-400">
            Status
          </label>
          <select id="show" name="show" defaultValue={show} className="field !w-36">
            <option value="">Active</option>
            <option value="archived">Archived</option>
            <option value="all">All</option>
          </select>
        </div>
        <button type="submit" className="btn btn-secondary">
          Filter
        </button>
      </form>

      <div className="card overflow-x-auto">
        <table className="table-admin">
          <thead>
            <tr>
              <th>Adm No.</th>
              <th>Name</th>
              <th>Class</th>
              <th>Gender</th>
              <th>Type</th>
              <th>Guardian contact</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-ink-400">
                  No pupils match this filter.
                </td>
              </tr>
            )}
            {students.map((s) => {
              const enrollment = s.enrollments[0];
              const guardian = s.guardians[0];
              return (
                <tr key={s.id} className={s.archived ? "opacity-60" : ""}>
                  <td className="font-mono text-xs">{s.admissionNo}</td>
                  <td>
                    <Link
                      href={`/students/${s.id}`}
                      className="font-semibold text-ink-900 hover:text-brand-600"
                    >
                      {s.lastName}, {s.firstName}
                    </Link>
                  </td>
                  <td>
                    {enrollment ? (
                      <span className="chip bg-paper-200 text-ink-700">
                        {enrollment.stream.class.name} {enrollment.stream.name}
                      </span>
                    ) : (
                      <span className="text-ink-400">—</span>
                    )}
                  </td>
                  <td>{s.gender === "MALE" ? "Boy" : "Girl"}</td>
                  <td>{s.boarding === "BOARDER" ? "Boarder" : "Day"}</td>
                  <td className="text-ink-500">
                    {guardian ? (
                      <>
                        {guardian.name}
                        {guardian.phone && (
                          <span className="block text-xs text-ink-400">{guardian.phone}</span>
                        )}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    {s.archived ? (
                      <span className="chip bg-danger-500/10 text-danger-500" title={s.archiveReason ?? ""}>
                        Archived
                      </span>
                    ) : (
                      <span className="chip bg-leaf-500/15 text-leaf-600">Active</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-ink-400">
            Page {pageNum} of {pages}
          </p>
          <div className="flex gap-2">
            {pageNum > 1 && (
              <Link href={query(pageNum - 1)} className="btn btn-secondary">
                ← Previous
              </Link>
            )}
            {pageNum < pages && (
              <Link href={query(pageNum + 1)} className="btn btn-secondary">
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
