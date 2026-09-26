import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { can, requirePermission } from "@/lib/rbac";
import { getActiveSession } from "@/lib/school";
import { HomeworkForm } from "@/components/homework-forms";

export const metadata: Metadata = { title: "Homework" };

export default async function HomeworkPage({
  searchParams,
}: {
  searchParams: Promise<{ stream?: string }>;
}) {
  const user = await requirePermission("homework", "view");
  const { stream: streamParam = "" } = await searchParams;

  const [classes, session, mayCreate] = await Promise.all([
    db.schoolClass.findMany({
      where: { archived: false },
      include: { streams: { where: { archived: false }, orderBy: { name: "asc" } } },
      orderBy: { level: "asc" },
    }),
    getActiveSession(),
    can(user.role, "homework", "create"),
  ]);

  const allStreams = classes.flatMap((c) =>
    c.streams.map((st) => ({ id: st.id, classId: c.id, label: `${c.name} ${st.name}` })),
  );
  const selectedStream = allStreams.find((s) => s.id === streamParam) ?? allStreams[0];

  const [subjects, homework] = await Promise.all([
    selectedStream
      ? db.classSubject
          .findMany({
            where: { classId: selectedStream.classId, subject: { archived: false } },
            include: { subject: true },
            orderBy: { subject: { name: "asc" } },
          })
          .then((rows) => rows.map((r) => r.subject))
      : [],
    selectedStream && session
      ? db.homework.findMany({
          where: { streamId: selectedStream.id, sessionId: session.id },
          include: { subject: true, _count: { select: { submissions: true } } },
          orderBy: [{ archived: "asc" }, { dueDate: "desc" }],
          take: 30,
        })
      : [],
  ]);

  const pupilCount =
    selectedStream && session
      ? await db.enrollment.count({
          where: { streamId: selectedStream.id, sessionId: session.id, student: { archived: false } },
        })
      : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink-900">Homework</h1>
          <p className="mt-1 text-sm">
            Assignments per stream and subject{session ? ` — ${session.name}` : ""}. Pupils
            tick them done from their portal.
          </p>
        </div>
        <form method="get" className="flex items-end gap-2">
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
          <button type="submit" className="btn btn-secondary !px-4 !py-1.5 text-xs">
            View
          </button>
        </form>
      </div>

      {mayCreate && selectedStream && session && (
        <HomeworkForm
          streamId={selectedStream.id}
          streamLabel={selectedStream.label}
          subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
        />
      )}

      <div className="card overflow-x-auto">
        <table className="table-admin">
          <thead>
            <tr>
              <th>Homework</th>
              <th>Subject</th>
              <th>Due</th>
              <th>Done</th>
              <th className="text-right">Open</th>
            </tr>
          </thead>
          <tbody>
            {homework.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-ink-400">
                  No homework for {selectedStream?.label ?? "this stream"} yet.
                </td>
              </tr>
            )}
            {homework.map((hw) => (
              <tr key={hw.id} className={hw.archived ? "opacity-50" : ""}>
                <td>
                  <p className="font-semibold text-ink-900">
                    {hw.title}
                    {hw.archived && (
                      <span className="chip ml-2 bg-danger-500/10 text-danger-500">Archived</span>
                    )}
                  </p>
                  <p className="max-w-md truncate text-xs text-ink-500">{hw.instructions}</p>
                </td>
                <td>{hw.subject.name}</td>
                <td className="whitespace-nowrap text-ink-500">
                  {hw.dueDate.toLocaleDateString("en-KE", { day: "numeric", month: "short", timeZone: "UTC" })}
                </td>
                <td>
                  <span className={hw._count.submissions >= pupilCount && pupilCount > 0 ? "font-bold text-leaf-600" : ""}>
                    {hw._count.submissions}/{pupilCount}
                  </span>
                </td>
                <td className="text-right">
                  <Link href={`/homework/${hw.id}`} className="text-xs font-bold text-brand-600 hover:text-brand-700">
                    Open →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
