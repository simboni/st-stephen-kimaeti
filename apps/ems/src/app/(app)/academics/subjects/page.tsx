import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { can, requirePermission } from "@/lib/rbac";
import { getActiveSession } from "@/lib/school";
import {
  assignSubjectTeacher,
  setSubjectArchived,
  toggleClassSubject,
} from "@/lib/actions/subjects-actions";
import { AssignTeacherSelect } from "@/components/academics-forms";
import { BanIcon, CheckIcon, PlusIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Subjects" };

export default async function SubjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ stream?: string }>;
}) {
  const user = await requirePermission("academics", "view");
  const { stream: streamParam = "" } = await searchParams;

  const [subjects, classes, teachers, session, mayCreate, mayEdit, mayArchive] =
    await Promise.all([
      db.subject.findMany({
        where: {},
        include: { classSubjects: true },
        orderBy: { name: "asc" },
      }),
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
      can(user.role, "academics", "create"),
      can(user.role, "academics", "edit"),
      can(user.role, "academics", "archive"),
    ]);

  const activeSubjects = subjects.filter((s) => !s.archived);
  const allStreams = classes.flatMap((c) => c.streams.map((st) => ({ ...st, className: c.name, classId: c.id })));
  const selectedStream = allStreams.find((s) => s.id === streamParam) ?? allStreams[0];
  const streamSubjects = selectedStream
    ? activeSubjects.filter((s) =>
        s.classSubjects.some((cs) => cs.classId === selectedStream.classId),
      )
    : [];
  const subjectTeachers = selectedStream && session
    ? await db.subjectTeacher.findMany({
        where: { streamId: selectedStream.id, sessionId: session.id },
      })
    : [];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink-900">Subjects</h1>
          <p className="mt-1 text-sm">
            CBC learning areas: what exists, which classes take what, and who teaches it.
          </p>
        </div>
        {mayCreate && (
          <Link href="/academics/subjects/new" className="btn btn-primary">
            <PlusIcon className="h-4 w-4" /> New subject
          </Link>
        )}
      </div>

      {/* ------------------------------------ class ↔ subject matrix */}
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-ink-400">
          Which classes take which subjects{mayEdit ? " — click a cell to toggle" : ""}
        </h2>
        <div className="card overflow-x-auto">
          <table className="table-admin">
            <thead>
              <tr>
                <th>Subject</th>
                {classes.map((c) => (
                  <th key={c.id} className="!px-1.5 text-center">
                    <span className="[writing-mode:vertical-rl] rotate-180 whitespace-nowrap">{c.name}</span>
                  </th>
                ))}
                {mayArchive && <th className="text-right">Archive</th>}
              </tr>
            </thead>
            <tbody>
              {subjects.map((s) => (
                <tr key={s.id} className={s.archived ? "opacity-50" : ""}>
                  <td className="whitespace-nowrap font-semibold text-ink-900">
                    {s.name}
                    {s.code && <span className="ml-2 font-mono text-xs text-ink-400">{s.code}</span>}
                    {s.type === "OPTIONAL" && (
                      <span className="chip ml-2 bg-sun-400/20 text-[#8a6d00]">Optional</span>
                    )}
                    {s.archived && (
                      <span className="chip ml-2 bg-danger-500/10 text-danger-500">Archived</span>
                    )}
                  </td>
                  {classes.map((c) => {
                    const on = s.classSubjects.some((cs) => cs.classId === c.id);
                    const cell = (
                      <span
                        className={`mx-auto flex h-6 w-6 items-center justify-center rounded-md border text-transparent ${
                          on
                            ? "border-leaf-600/30 bg-leaf-500/15 !text-leaf-600"
                            : "border-paper-300 bg-paper-100"
                        }`}
                      >
                        <CheckIcon className="h-3.5 w-3.5" />
                      </span>
                    );
                    return (
                      <td key={c.id} className="!px-1.5 text-center">
                        {mayEdit && !s.archived ? (
                          <form action={toggleClassSubject}>
                            <input type="hidden" name="classId" value={c.id} />
                            <input type="hidden" name="subjectId" value={s.id} />
                            <input type="hidden" name="value" value={on ? "false" : "true"} />
                            <button
                              type="submit"
                              className="cursor-pointer"
                              aria-label={`Toggle ${s.name} for ${c.name}`}
                            >
                              {cell}
                            </button>
                          </form>
                        ) : (
                          cell
                        )}
                      </td>
                    );
                  })}
                  {mayArchive && (
                    <td>
                      <form action={setSubjectArchived} className="flex justify-end">
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="archived" value={s.archived ? "false" : "true"} />
                        <button
                          type="submit"
                          className={s.archived ? "btn btn-secondary !p-2 !text-leaf-600" : "btn btn-danger !p-2"}
                          title={s.archived ? "Restore subject" : "Archive subject"}
                          aria-label={`${s.archived ? "Restore" : "Archive"} ${s.name}`}
                        >
                          {s.archived ? <CheckIcon className="h-3.5 w-3.5" /> : <BanIcon className="h-3.5 w-3.5" />}
                        </button>
                      </form>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ------------------------------------ subject teachers per stream */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-ink-400">
            Subject teachers{session ? ` — ${session.name}` : ""}
          </h2>
          {selectedStream && (
            <form method="get" className="flex items-center gap-2">
              <label htmlFor="stream" className="text-xs font-bold text-ink-400">
                Stream
              </label>
              <select
                id="stream"
                name="stream"
                defaultValue={selectedStream.id}
                className="field !w-44 !py-1.5 text-sm"
              >
                {allStreams.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.className} {s.name}
                  </option>
                ))}
              </select>
              <button type="submit" className="btn btn-secondary !px-3 !py-1.5 text-xs">
                View
              </button>
            </form>
          )}
        </div>

        {!session ? (
          <p className="rounded-xl bg-sun-400/15 px-4 py-3 text-sm font-semibold text-ink-700">
            No active session — set one under Settings → Sessions &amp; Terms.
          </p>
        ) : !selectedStream ? (
          <p className="card p-6 text-sm text-ink-400">No streams yet.</p>
        ) : streamSubjects.length === 0 ? (
          <p className="card p-6 text-sm text-ink-400">
            {selectedStream.className} has no subjects ticked in the matrix above yet.
          </p>
        ) : (
          <div className="card overflow-x-auto">
            <table className="table-admin">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>
                    Teacher — {selectedStream.className} {selectedStream.name}
                  </th>
                </tr>
              </thead>
              <tbody>
                {streamSubjects.map((s) => {
                  const current = subjectTeachers.find((st) => st.subjectId === s.id);
                  const teacherName = teachers.find((t) => t.id === current?.teacherId)?.name;
                  return (
                    <tr key={s.id}>
                      <td className="font-semibold text-ink-900">{s.name}</td>
                      <td>
                        {mayEdit ? (
                          <SubjectTeacherCell
                            streamId={selectedStream.id}
                            subjectId={s.id}
                            current={current?.teacherId ?? ""}
                            teachers={teachers}
                          />
                        ) : (
                          <span className={teacherName ? "text-ink-900" : "text-ink-400"}>
                            {teacherName ?? "—"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function SubjectTeacherCell({
  streamId,
  subjectId,
  current,
  teachers,
}: {
  streamId: string;
  subjectId: string;
  current: string;
  teachers: { id: string; name: string }[];
}) {
  return (
    <AssignTeacherSelect
      streamId={streamId}
      current={current}
      teachers={teachers}
      action={assignSubjectTeacher}
      extra={{ subjectId }}
    />
  );
}
