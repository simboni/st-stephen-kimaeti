import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { streamResults } from "@/lib/exams";
import { cbcLevel } from "@/lib/cbc";

export const metadata: Metadata = { title: "Exam Results" };

export default async function ExamResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ examId: string }>;
  searchParams: Promise<{ stream?: string }>;
}) {
  await requirePermission("exams", "view");
  const { examId } = await params;
  const { stream: streamParam = "" } = await searchParams;

  const classes = await db.schoolClass.findMany({
    where: { archived: false },
    include: { streams: { where: { archived: false }, orderBy: { name: "asc" } } },
    orderBy: { level: "asc" },
  });
  const allStreams = classes.flatMap((c) =>
    c.streams.map((st) => ({ id: st.id, label: `${c.name} ${st.name}` })),
  );
  const selectedStream = allStreams.find((s) => s.id === streamParam) ?? allStreams[0];
  if (!selectedStream) notFound();

  const results = await streamResults(examId, selectedStream.id);
  if (!results) notFound();
  const { exam, subjects, rows } = results;

  const marked = rows.filter((r) => r.subjectsMarked > 0);
  const classAvg =
    marked.length > 0 ? marked.reduce((s, r) => s + r.averagePct, 0) / marked.length : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-400">
            <Link href="/exams" className="hover:text-brand-600">Examinations</Link> · {exam.term.name}
          </p>
          <h1 className="font-display text-2xl font-extrabold text-ink-900">
            {exam.name} — Results
          </h1>
          <p className="mt-1 text-sm">
            {selectedStream.label} · out of {exam.maxMarks} per subject · class average{" "}
            {classAvg.toFixed(1)}%.
          </p>
        </div>
        <form method="get" className="flex flex-wrap items-end gap-2">
          <div>
            <label htmlFor="stream" className="mb-1 block text-xs font-bold text-ink-400">
              Stream
            </label>
            <select id="stream" name="stream" defaultValue={selectedStream.id} className="field !w-36 !py-1.5 text-sm">
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
          <Link href={`/exams/${exam.id}?stream=${selectedStream.id}`} className="btn btn-secondary !px-4 !py-1.5 text-xs">
            ← Marks entry
          </Link>
          <Link
            href={`/exams/${exam.id}/reports?stream=${selectedStream.id}`}
            className="btn btn-primary !px-4 !py-1.5 text-xs"
          >
            Print class report cards
          </Link>
        </form>
      </div>

      <div className="card overflow-x-auto">
        <table className="table-admin">
          <thead>
            <tr>
              <th>Pos</th>
              <th>Pupil</th>
              {subjects.map((s) => (
                <th key={s.id} className="text-center" title={s.name}>
                  {s.code ?? s.name.slice(0, 4).toUpperCase()}
                </th>
              ))}
              <th className="text-right">Total</th>
              <th className="text-right">Avg %</th>
              <th>Level</th>
              <th className="text-right">Report</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={subjects.length + 6} className="text-center text-ink-400">
                  No pupils enrolled in this stream.
                </td>
              </tr>
            )}
            {[...rows]
              .sort((a, b) => a.position - b.position)
              .map((row) => {
                const level = row.subjectsMarked > 0 ? cbcLevel(row.averagePct, 100) : null;
                return (
                  <tr key={row.enrollmentId}>
                    <td className="font-bold text-ink-900">{row.subjectsMarked > 0 ? row.position : "—"}</td>
                    <td className="font-semibold text-ink-900">
                      {row.name}
                      <span className="ml-2 font-mono text-xs font-normal text-ink-400">
                        {row.admissionNo}
                      </span>
                    </td>
                    {subjects.map((s) => {
                      const score = row.scores.has(s.id) ? row.scores.get(s.id) : undefined;
                      return (
                        <td key={s.id} className="text-center">
                          {score === undefined ? (
                            <span className="text-ink-300">—</span>
                          ) : score === null ? (
                            <span className="text-ink-400">Abs</span>
                          ) : (
                            <span className={`font-semibold ${cbcLevel(score, exam.maxMarks).color}`}>
                              {score}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td className="text-right font-bold text-ink-900">
                      {row.subjectsMarked > 0 ? row.totalScore : "—"}
                    </td>
                    <td className="text-right">{row.subjectsMarked > 0 ? row.averagePct.toFixed(1) : "—"}</td>
                    <td>
                      {level ? <span className={`font-bold ${level.color}`}>{level.code}</span> : "—"}
                    </td>
                    <td className="text-right">
                      <Link
                        href={`/exams/${exam.id}/report/${row.studentId}`}
                        className="text-xs font-bold text-brand-600 hover:text-brand-700"
                      >
                        Report card →
                      </Link>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
