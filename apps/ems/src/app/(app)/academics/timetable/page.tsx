import type { Metadata } from "next";
import { db } from "@/lib/db";
import { can, requirePermission } from "@/lib/rbac";
import { getActiveSession } from "@/lib/school";
import { removeLesson } from "@/lib/actions/timetable-actions";
import { AddLessonForm } from "@/components/timetable-forms";
import { CloseIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Timetable" };

const DAYS = [1, 2, 3, 4, 5] as const;
const DAY_LABELS: Record<number, string> = { 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri" };
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export default async function TimetablePage({
  searchParams,
}: {
  searchParams: Promise<{ stream?: string; teacher?: string }>;
}) {
  const user = await requirePermission("academics", "view");
  const { stream: streamParam = "", teacher: teacherParam = "" } = await searchParams;

  const [classes, teachers, session, mayEdit] = await Promise.all([
    db.schoolClass.findMany({
      where: { archived: false },
      include: { streams: { where: { archived: false }, orderBy: { name: "asc" } } },
      orderBy: { level: "asc" },
    }),
    db.user.findMany({
      where: { role: "TEACHER", active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    getActiveSession(),
    can(user.role, "academics", "edit"),
  ]);

  const allStreams = classes.flatMap((c) =>
    c.streams.map((st) => ({ id: st.id, label: `${c.name} ${st.name}`, classId: c.id })),
  );
  const teacherView = teachers.find((t) => t.id === teacherParam) ?? null;
  const selectedStream = teacherView
    ? null
    : (allStreams.find((s) => s.id === streamParam) ?? allStreams[0]);

  const slots = session
    ? await db.timetableSlot.findMany({
        where: teacherView
          ? { teacherId: teacherView.id, sessionId: session.id }
          : { streamId: selectedStream?.id ?? "", sessionId: session.id },
        include: {
          subject: true,
          teacher: { select: { name: true } },
          stream: { include: { class: true } },
        },
      })
    : [];

  const streamSubjects = selectedStream
    ? (
        await db.classSubject.findMany({
          where: { classId: selectedStream.classId, subject: { archived: false } },
          include: { subject: true },
        })
      ).map((cs) => cs.subject)
    : [];

  const grid = new Map<string, (typeof slots)[number]>();
  for (const slot of slots) grid.set(`${slot.day}:${slot.period}`, slot);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink-900">Timetable</h1>
          <p className="mt-1 text-sm">
            {teacherView
              ? `${teacherView.name}'s week across all streams`
              : "Weekly lessons per stream"}
            {session ? ` — ${session.name}` : ""}. Print with your browser (Ctrl/Cmd+P).
          </p>
        </div>
        <form method="get" className="flex flex-wrap items-end gap-2">
          <div>
            <label htmlFor="stream" className="mb-1 block text-xs font-bold text-ink-400">
              Stream
            </label>
            <select
              id="stream"
              name="stream"
              defaultValue={selectedStream?.id ?? ""}
              className="field !w-40 !py-1.5 text-sm"
            >
              {allStreams.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="teacher" className="mb-1 block text-xs font-bold text-ink-400">
              …or teacher view
            </label>
            <select
              id="teacher"
              name="teacher"
              defaultValue={teacherView?.id ?? ""}
              className="field !w-44 !py-1.5 text-sm"
            >
              <option value="">— by stream —</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-secondary !px-4 !py-1.5 text-xs">
            View
          </button>
        </form>
      </div>

      {!session ? (
        <p className="rounded-xl bg-sun-400/15 px-4 py-3 text-sm font-semibold text-ink-700">
          No active session — set one under Settings → Sessions &amp; Terms.
        </p>
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="table-admin">
              <thead>
                <tr>
                  <th className="!w-20">Period</th>
                  {DAYS.map((d) => (
                    <th key={d}>{DAY_LABELS[d]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERIODS.map((p) => (
                  <tr key={p}>
                    <td className="font-display font-extrabold text-ink-900">P{p}</td>
                    {DAYS.map((d) => {
                      const slot = grid.get(`${d}:${p}`);
                      return (
                        <td key={d} className="!px-2 align-top">
                          {slot ? (
                            <div className="group relative rounded-lg bg-brand-50 px-2.5 py-1.5">
                              <p className="text-xs font-bold text-brand-800">
                                {slot.subject.name}
                              </p>
                              <p className="text-[11px] text-ink-500">
                                {teacherView
                                  ? `${slot.stream.class.name} ${slot.stream.name}`
                                  : (slot.teacher?.name ?? "—")}
                                {slot.room ? ` · ${slot.room}` : ""}
                              </p>
                              {mayEdit && !teacherView && (
                                <form action={removeLesson} className="absolute -right-1.5 -top-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                                  <input type="hidden" name="id" value={slot.id} />
                                  <button
                                    type="submit"
                                    className="flex h-5 w-5 items-center justify-center rounded-full bg-danger-500 text-white"
                                    title="Remove lesson"
                                    aria-label={`Remove ${slot.subject.name} ${DAY_LABELS[d]} period ${p}`}
                                  >
                                    <CloseIcon className="h-3 w-3" />
                                  </button>
                                </form>
                              )}
                            </div>
                          ) : (
                            <span className="block px-2.5 py-1.5 text-xs text-ink-400/50">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {mayEdit && !teacherView && selectedStream && (
            <AddLessonForm
              streamId={selectedStream.id}
              streamLabel={selectedStream.label}
              subjects={streamSubjects.map((s) => ({ id: s.id, name: s.name }))}
              teachers={teachers}
            />
          )}
        </>
      )}
    </div>
  );
}
