import type { Metadata } from "next";
import Link from "next/link";
import { Stage } from "@prisma/client";
import { db } from "@/lib/db";
import { can, requirePermission } from "@/lib/rbac";
import { getActiveSession } from "@/lib/school";
import {
  addStream,
  assignClassTeacher,
  setClassArchived,
  setStreamArchived,
} from "@/lib/actions/academics-actions";
import { AssignTeacherSelect } from "@/components/academics-forms";
import { BanIcon, CheckIcon, PlusIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Classes & Streams" };

const STAGE_LABELS: Record<Stage, string> = {
  INFANT: "Infant School",
  PRIMARY: "Primary School",
  JUNIOR: "Junior School",
};

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const user = await requirePermission("academics", "view");
  const { show = "" } = await searchParams;
  const showArchived = show === "archived";

  const [classes, teachers, session, mayCreate, mayEdit, mayArchive] = await Promise.all([
    db.schoolClass.findMany({
      where: showArchived ? {} : { archived: false },
      include: {
        streams: {
          where: showArchived ? {} : { archived: false },
          orderBy: { name: "asc" },
          include: { classTeachers: { include: { teacher: true, session: true } } },
        },
      },
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

  const grouped = Object.values(Stage)
    .map((stage) => ({ stage, classes: classes.filter((c) => c.stage === stage) }))
    .filter((g) => g.classes.length > 0);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink-900">
            Classes &amp; Streams
          </h1>
          <p className="mt-1 text-sm">
            The school&rsquo;s structure. Class teachers are per stream, for the active
            session{session ? ` (${session.name})` : ""}.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={showArchived ? "/academics/classes" : "/academics/classes?show=archived"}
            className="btn btn-secondary"
          >
            {showArchived ? "Hide archived" : "Show archived"}
          </Link>
          {mayCreate && (
            <Link href="/academics/classes/new" className="btn btn-primary">
              <PlusIcon className="h-4 w-4" /> New class
            </Link>
          )}
        </div>
      </div>

      {!session && (
        <p className="rounded-xl bg-sun-400/15 px-4 py-3 text-sm font-semibold text-ink-700">
          No active session — set one under Settings → Sessions &amp; Terms to assign class
          teachers.
        </p>
      )}

      {grouped.map(({ stage, classes: stageClasses }) => (
        <section key={stage}>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-ink-400">
            {STAGE_LABELS[stage]}
          </h2>
          <div className="card overflow-x-auto">
            <table className="table-admin">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Stream</th>
                  <th>Class teacher{session ? ` (${session.name})` : ""}</th>
                  {(mayCreate || mayArchive) && <th className="text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {stageClasses.map((cls) =>
                  (cls.streams.length > 0 ? cls.streams : [null]).map((stream, idx) => {
                    const assignment = stream?.classTeachers.find(
                      (ct) => ct.sessionId === session?.id,
                    );
                    return (
                      <tr key={stream?.id ?? cls.id} className={cls.archived || stream?.archived ? "opacity-50" : ""}>
                        <td className="font-semibold text-ink-900">
                          {idx === 0 ? (
                            <span className="flex items-center gap-2">
                              {cls.name}
                              {cls.archived && <span className="chip bg-danger-500/10 text-danger-500">Archived</span>}
                            </span>
                          ) : (
                            ""
                          )}
                        </td>
                        <td>
                          {stream ? (
                            <span className="flex items-center gap-2">
                              <span className="chip bg-paper-200 text-ink-700">{stream.name}</span>
                              {stream.archived && (
                                <span className="chip bg-danger-500/10 text-danger-500">Archived</span>
                              )}
                            </span>
                          ) : (
                            <span className="text-ink-400">No streams</span>
                          )}
                        </td>
                        <td>
                          {stream && session ? (
                            mayEdit && !stream.archived && !cls.archived ? (
                              <AssignTeacherSelect
                                streamId={stream.id}
                                current={assignment?.teacherId ?? ""}
                                teachers={teachers}
                                action={assignClassTeacher}
                              />
                            ) : (
                              <span className={assignment ? "text-ink-900" : "text-ink-400"}>
                                {assignment?.teacher.name ?? "—"}
                              </span>
                            )
                          ) : (
                            <span className="text-ink-400">—</span>
                          )}
                        </td>
                        {(mayCreate || mayArchive) && (
                          <td>
                            <div className="flex items-center justify-end gap-1.5">
                              {idx === 0 && mayCreate && !cls.archived && (
                                <form action={addStream} className="flex items-center gap-1.5">
                                  <input type="hidden" name="classId" value={cls.id} />
                                  <input
                                    name="name"
                                    placeholder="B"
                                    maxLength={12}
                                    className="field !w-16 !py-1.5 text-center text-sm"
                                    aria-label={`New stream for ${cls.name}`}
                                  />
                                  <button type="submit" className="btn btn-secondary !p-2" title="Add stream">
                                    <PlusIcon className="h-3.5 w-3.5" />
                                  </button>
                                </form>
                              )}
                              {stream && mayArchive && (
                                <form action={setStreamArchived}>
                                  <input type="hidden" name="id" value={stream.id} />
                                  <input type="hidden" name="archived" value={stream.archived ? "false" : "true"} />
                                  <button
                                    type="submit"
                                    className={stream.archived ? "btn btn-secondary !p-2 !text-leaf-600" : "btn btn-danger !p-2"}
                                    title={stream.archived ? "Restore stream" : "Archive stream"}
                                    aria-label={`${stream.archived ? "Restore" : "Archive"} ${cls.name} ${stream.name}`}
                                  >
                                    {stream.archived ? <CheckIcon className="h-3.5 w-3.5" /> : <BanIcon className="h-3.5 w-3.5" />}
                                  </button>
                                </form>
                              )}
                              {idx === 0 && mayArchive && (
                                <form action={setClassArchived}>
                                  <input type="hidden" name="id" value={cls.id} />
                                  <input type="hidden" name="archived" value={cls.archived ? "false" : "true"} />
                                  <button
                                    type="submit"
                                    className="btn btn-secondary !px-2.5 !py-1.5 text-xs"
                                    title={cls.archived ? "Restore class" : "Archive class"}
                                  >
                                    {cls.archived ? "Restore class" : "Archive class"}
                                  </button>
                                </form>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  }),
                )}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
