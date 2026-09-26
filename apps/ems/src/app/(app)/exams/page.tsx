import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { can, requirePermission } from "@/lib/rbac";
import { getActiveSession } from "@/lib/school";
import { setExamArchived, setExamPublished } from "@/lib/actions/exams-actions";
import { ExamForm } from "@/components/exams-forms";
import { CBC_LEVELS } from "@/lib/cbc";
import { BanIcon, CheckIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Examinations" };

export default async function ExamsPage() {
  const user = await requirePermission("exams", "view");

  const [session, mayCreate, mayEdit, mayArchive] = await Promise.all([
    getActiveSession(),
    can(user.role, "exams", "create"),
    can(user.role, "exams", "edit"),
    can(user.role, "exams", "archive"),
  ]);

  const exams = session
    ? await db.exam.findMany({
        where: { sessionId: session.id },
        include: { term: true, _count: { select: { marks: true } } },
        orderBy: [{ archived: "asc" }, { term: { number: "asc" } }, { createdAt: "asc" }],
      })
    : [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink-900">Examinations</h1>
        <p className="mt-1 text-sm">
          Exams for {session?.name ?? "the active session"} — enter marks per stream and
          subject, then publish to share report cards with parents and pupils.
        </p>
      </div>

      {/* CBC grading key */}
      <div className="flex flex-wrap gap-2">
        {CBC_LEVELS.map((l) => (
          <span key={l.code} className="chip bg-paper-200 text-ink-700">
            <b className={`mr-1 ${l.color}`}>{l.code}</b> {l.label}
          </span>
        ))}
      </div>

      {mayCreate && session && (
        <ExamForm terms={session.terms.map((t) => ({ id: t.id, name: t.name }))} />
      )}

      <div className="card overflow-x-auto">
        <table className="table-admin">
          <thead>
            <tr>
              <th>Exam</th>
              <th>Term</th>
              <th>Out of</th>
              <th>Marks entered</th>
              <th>Portal</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {exams.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-ink-400">
                  No exams yet — create the first one above.
                </td>
              </tr>
            )}
            {exams.map((exam) => (
              <tr key={exam.id} className={exam.archived ? "opacity-50" : ""}>
                <td className="font-semibold text-ink-900">
                  {exam.name}
                  {exam.archived && (
                    <span className="chip ml-2 bg-danger-500/10 text-danger-500">Archived</span>
                  )}
                </td>
                <td>{exam.term.name}</td>
                <td>{exam.maxMarks}</td>
                <td>{exam._count.marks}</td>
                <td>
                  {exam.published ? (
                    <span className="chip bg-leaf-500/10 text-leaf-600">Published</span>
                  ) : (
                    <span className="chip bg-paper-200 text-ink-400">Draft</span>
                  )}
                </td>
                <td>
                  <div className="flex items-center justify-end gap-1.5">
                    {!exam.archived && (
                      <>
                        <Link href={`/exams/${exam.id}`} className="btn btn-secondary !px-3 !py-1.5 text-xs">
                          Enter marks
                        </Link>
                        <Link href={`/exams/${exam.id}/results`} className="btn btn-secondary !px-3 !py-1.5 text-xs">
                          Results
                        </Link>
                      </>
                    )}
                    {mayEdit && !exam.archived && (
                      <form action={setExamPublished}>
                        <input type="hidden" name="id" value={exam.id} />
                        <input type="hidden" name="published" value={exam.published ? "false" : "true"} />
                        <button type="submit" className="btn btn-secondary !px-3 !py-1.5 text-xs">
                          {exam.published ? "Unpublish" : "Publish"}
                        </button>
                      </form>
                    )}
                    {mayArchive && (
                      <form action={setExamArchived}>
                        <input type="hidden" name="id" value={exam.id} />
                        <input type="hidden" name="archived" value={exam.archived ? "false" : "true"} />
                        <button
                          type="submit"
                          className={exam.archived ? "btn btn-secondary !p-2 !text-leaf-600" : "btn btn-danger !p-2"}
                          title={exam.archived ? "Restore exam" : "Archive exam"}
                          aria-label={`${exam.archived ? "Restore" : "Archive"} ${exam.name}`}
                        >
                          {exam.archived ? <CheckIcon className="h-3.5 w-3.5" /> : <BanIcon className="h-3.5 w-3.5" />}
                        </button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
