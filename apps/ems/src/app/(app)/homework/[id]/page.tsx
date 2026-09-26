import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { can, requirePermission } from "@/lib/rbac";
import { evaluateSubmission, setHomeworkArchived } from "@/lib/actions/homework-actions";
import { BanIcon, CheckIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Homework Detail" };

export default async function HomeworkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("homework", "view");
  const { id } = await params;

  const homework = await db.homework.findUnique({
    where: { id },
    include: {
      stream: { include: { class: true } },
      subject: true,
      submissions: true,
    },
  });
  if (!homework) notFound();

  const [enrollments, mayEdit, mayArchive] = await Promise.all([
    db.enrollment.findMany({
      where: {
        streamId: homework.streamId,
        sessionId: homework.sessionId,
        student: { archived: false },
      },
      include: { student: true },
      orderBy: { student: { lastName: "asc" } },
    }),
    can(user.role, "homework", "edit"),
    can(user.role, "homework", "archive"),
  ]);

  const byEnrollment = new Map(homework.submissions.map((s) => [s.enrollmentId, s]));
  const doneCount = homework.submissions.length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-400">
            <Link href={`/homework?stream=${homework.streamId}`} className="hover:text-brand-600">
              Homework
            </Link>{" "}
            · {homework.stream.class.name} {homework.stream.name} · {homework.subject.name}
          </p>
          <h1 className="font-display text-2xl font-extrabold text-ink-900">
            {homework.title}
            {homework.archived && (
              <span className="chip ml-3 bg-danger-500/10 align-middle text-danger-500">Archived</span>
            )}
          </h1>
          <p className="mt-1 max-w-xl text-sm leading-relaxed">{homework.instructions}</p>
          <p className="mt-1 text-sm text-ink-400">
            Due{" "}
            {homework.dueDate.toLocaleDateString("en-KE", {
              dateStyle: "long",
              timeZone: "UTC",
            })}{" "}
            · set by {homework.createdBy} · {doneCount}/{enrollments.length} done.
          </p>
        </div>
        {mayArchive && (
          <form action={setHomeworkArchived}>
            <input type="hidden" name="id" value={homework.id} />
            <input type="hidden" name="archived" value={homework.archived ? "false" : "true"} />
            <button
              type="submit"
              className={homework.archived ? "btn btn-secondary !py-1.5 text-xs !text-leaf-600" : "btn btn-danger !py-1.5 text-xs"}
            >
              {homework.archived ? (
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

      <div className="card overflow-x-auto">
        <table className="table-admin">
          <thead>
            <tr>
              <th>Pupil</th>
              <th>Status</th>
              <th>Pupil note</th>
              <th>Teacher remark</th>
              {mayEdit && <th className="text-right">Evaluate</th>}
            </tr>
          </thead>
          <tbody>
            {enrollments.map((e) => {
              const sub = byEnrollment.get(e.id);
              return (
                <tr key={e.id}>
                  <td className="font-semibold text-ink-900">
                    {e.student.lastName}, {e.student.firstName}
                    <span className="ml-2 font-mono text-xs font-normal text-ink-400">
                      {e.student.admissionNo}
                    </span>
                  </td>
                  <td>
                    {!sub ? (
                      <span className="chip bg-paper-200 text-ink-400">Not done</span>
                    ) : sub.evaluated ? (
                      <span className="chip bg-leaf-500/10 text-leaf-600">Evaluated</span>
                    ) : (
                      <span className="chip bg-sun-400/15 text-sun-500">Done</span>
                    )}
                  </td>
                  <td className="max-w-40 truncate text-ink-500">{sub?.note ?? "—"}</td>
                  <td className="max-w-40 truncate text-ink-500">{sub?.remark ?? "—"}</td>
                  {mayEdit && (
                    <td>
                      {sub && !sub.evaluated ? (
                        <form action={evaluateSubmission} className="flex items-center justify-end gap-1.5">
                          <input type="hidden" name="homeworkId" value={homework.id} />
                          <input type="hidden" name="enrollmentId" value={e.id} />
                          <input
                            name="remark"
                            placeholder="Remark"
                            className="field !w-28 !py-1.5 text-xs"
                            aria-label={`Remark for ${e.student.firstName} ${e.student.lastName}`}
                          />
                          <button type="submit" className="btn btn-secondary !px-3 !py-1.5 text-xs">
                            Mark seen
                          </button>
                        </form>
                      ) : (
                        <span className="flex justify-end text-ink-300">
                          {sub?.evaluated ? <CheckIcon className="h-3.5 w-3.5" /> : "—"}
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
