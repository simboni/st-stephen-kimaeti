import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { can, requirePermission } from "@/lib/rbac";
import { saveMarks } from "@/lib/actions/exams-actions";
import { cbcLevel } from "@/lib/cbc";

export const metadata: Metadata = { title: "Marks Entry" };

export default async function MarksEntryPage({
  params,
  searchParams,
}: {
  params: Promise<{ examId: string }>;
  searchParams: Promise<{ stream?: string; subject?: string; saved?: string }>;
}) {
  const user = await requirePermission("exams", "view");
  const { examId } = await params;
  const { stream: streamParam = "", subject: subjectParam = "", saved = "" } = await searchParams;

  const [exam, classes, mayMark] = await Promise.all([
    db.exam.findUnique({ where: { id: examId }, include: { term: true, session: true } }),
    db.schoolClass.findMany({
      where: { archived: false },
      include: { streams: { where: { archived: false }, orderBy: { name: "asc" } } },
      orderBy: { level: "asc" },
    }),
    can(user.role, "exams", "create"),
  ]);
  if (!exam) notFound();

  const allStreams = classes.flatMap((c) =>
    c.streams.map((st) => ({ id: st.id, classId: c.id, label: `${c.name} ${st.name}` })),
  );
  const selectedStream = allStreams.find((s) => s.id === streamParam) ?? allStreams[0];

  const subjects = selectedStream
    ? (
        await db.classSubject.findMany({
          where: { classId: selectedStream.classId, subject: { archived: false } },
          include: { subject: true },
          orderBy: { subject: { name: "asc" } },
        })
      ).map((cs) => cs.subject)
    : [];
  const selectedSubject = subjects.find((s) => s.id === subjectParam) ?? subjects[0];

  const enrollments =
    selectedStream && selectedSubject
      ? await db.enrollment.findMany({
          where: {
            streamId: selectedStream.id,
            sessionId: exam.sessionId,
            student: { archived: false },
          },
          include: {
            student: true,
            marks: { where: { examId, subjectId: selectedSubject.id } },
          },
          orderBy: { student: { lastName: "asc" } },
        })
      : [];

  const entered = enrollments.filter((e) => e.marks.length > 0).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-400">
            <Link href="/exams" className="hover:text-brand-600">Examinations</Link> · {exam.term.name}
          </p>
          <h1 className="font-display text-2xl font-extrabold text-ink-900">{exam.name}</h1>
          <p className="mt-1 text-sm">
            Marks entry, out of {exam.maxMarks} — {entered}/{enrollments.length} entered for
            this subject.
          </p>
        </div>
        <form method="get" className="flex flex-wrap items-end gap-2">
          <div>
            <label htmlFor="stream" className="mb-1 block text-xs font-bold text-ink-400">
              Stream
            </label>
            <select id="stream" name="stream" defaultValue={selectedStream?.id ?? ""} className="field !w-36 !py-1.5 text-sm">
              {allStreams.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="subject" className="mb-1 block text-xs font-bold text-ink-400">
              Subject
            </label>
            <select id="subject" name="subject" defaultValue={selectedSubject?.id ?? ""} className="field !w-44 !py-1.5 text-sm">
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-secondary !px-4 !py-1.5 text-xs">
            Open grid
          </button>
          <Link
            href={`/exams/${exam.id}/results?stream=${selectedStream?.id ?? ""}`}
            className="btn btn-secondary !px-4 !py-1.5 text-xs"
          >
            Results →
          </Link>
        </form>
      </div>

      {saved && (
        <p className="rounded-xl bg-leaf-500/10 px-4 py-3 text-sm font-semibold text-leaf-600">
          Marks saved for {selectedStream?.label} · {selectedSubject?.name}.
        </p>
      )}

      {!selectedStream || !selectedSubject ? (
        <p className="card p-6 text-sm text-ink-400">
          {selectedStream
            ? "This class has no subjects assigned yet — add them under Academics → Subjects."
            : "No streams found — set up classes first."}
        </p>
      ) : enrollments.length === 0 ? (
        <p className="card p-6 text-sm text-ink-400">
          No active pupils enrolled in {selectedStream.label} this session.
        </p>
      ) : (
        <form action={saveMarks}>
          <input type="hidden" name="examId" value={exam.id} />
          <input type="hidden" name="streamId" value={selectedStream.id} />
          <input type="hidden" name="subjectId" value={selectedSubject.id} />
          <div className="card overflow-x-auto">
            <table className="table-admin">
              <thead>
                <tr>
                  <th>Adm No.</th>
                  <th>Pupil</th>
                  <th>Score / {exam.maxMarks}</th>
                  <th>Absent</th>
                  <th>Level</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((e) => {
                  const mark = e.marks[0];
                  const level =
                    mark && mark.score !== null ? cbcLevel(mark.score, exam.maxMarks) : null;
                  return (
                    <tr key={e.id}>
                      <td className="font-mono text-xs">{e.student.admissionNo}</td>
                      <td className="font-semibold text-ink-900">
                        {e.student.lastName}, {e.student.firstName}
                      </td>
                      <td>
                        {mayMark ? (
                          <input
                            name={`sc_${e.id}`}
                            defaultValue={mark?.score ?? ""}
                            inputMode="numeric"
                            className="field !w-24 !py-1.5 text-sm"
                            aria-label={`Score for ${e.student.firstName} ${e.student.lastName}`}
                          />
                        ) : (
                          <span>{mark ? (mark.score ?? "Absent") : "—"}</span>
                        )}
                      </td>
                      <td>
                        {mayMark ? (
                          <input
                            type="checkbox"
                            name={`ab_${e.id}`}
                            defaultChecked={!!mark && mark.score === null}
                            className="h-4 w-4 accent-brand-600"
                            aria-label={`Absent: ${e.student.firstName} ${e.student.lastName}`}
                          />
                        ) : mark && mark.score === null ? (
                          "Yes"
                        ) : (
                          ""
                        )}
                      </td>
                      <td>
                        {mark && mark.score === null ? (
                          <span className="chip bg-paper-200 text-ink-400">Absent</span>
                        ) : level ? (
                          <span className={`font-bold ${level.color}`}>{level.code}</span>
                        ) : (
                          <span className="text-ink-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {mayMark && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button type="submit" className="btn btn-primary">
                Save marks
              </button>
              <p className="text-xs text-ink-400">
                Blank scores are left unchanged; ticking Absent overrides the score. Re-saving
                overwrites earlier entries (audited).
              </p>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
