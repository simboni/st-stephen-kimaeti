import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { getSchoolSettings, logoSrc } from "@/lib/school";
import { attendanceSummary, streamResults } from "@/lib/exams";
import { ReportCard } from "@/components/report-card";
import { PrintButton } from "@/components/fees-forms";

export const metadata: Metadata = { title: "Class Report Cards" };

export default async function ClassReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ examId: string }>;
  searchParams: Promise<{ stream?: string }>;
}) {
  await requirePermission("exams", "view");
  const { examId } = await params;
  const { stream: streamId = "" } = await searchParams;
  if (!streamId) notFound();

  const results = await streamResults(examId, streamId);
  if (!results) notFound();
  const { exam, stream, subjects, rows } = results;

  const [school, classTeacher, terms, remarksList] = await Promise.all([
    getSchoolSettings(),
    db.classTeacher.findUnique({
      where: { streamId_sessionId: { streamId, sessionId: exam.sessionId } },
      include: { teacher: true },
    }),
    db.term.findMany({ where: { sessionId: exam.sessionId }, orderBy: { number: "asc" } }),
    db.reportRemark.findMany({ where: { examId } }),
  ]);
  const remarksByEnrollment = new Map(remarksList.map((r) => [r.enrollmentId, r]));
  const nextTerm = terms.find((t) => t.number === exam.term.number + 1) ?? null;
  const classSize = rows.filter((r) => r.subjectsMarked > 0).length;

  const cards = await Promise.all(
    rows
      .filter((r) => r.subjectsMarked > 0)
      .sort((a, b) => a.position - b.position)
      .map(async (row) => ({ row, attendance: await attendanceSummary(row.enrollmentId) })),
  );

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <Link href={`/exams/${examId}/results?stream=${streamId}`} className="btn btn-secondary">
          ← Back to results
        </Link>
        <div className="flex items-center gap-3">
          <p className="text-sm text-ink-500">
            {cards.length} report card{cards.length === 1 ? "" : "s"} — {stream.class.name}{" "}
            {stream.name}
          </p>
          <PrintButton label="Print all" />
        </div>
      </div>

      {cards.length === 0 && (
        <p className="card p-6 text-sm text-ink-400">
          No marks entered for this stream yet — nothing to print.
        </p>
      )}

      <div className="space-y-6 print:space-y-0">
        {cards.map(({ row, attendance }) => (
          <ReportCard
            key={row.enrollmentId}
            school={school}
            logoSrc={logoSrc(school)}
            examName={exam.name}
            termName={exam.term.name}
            sessionName={exam.session.name}
            maxMarks={exam.maxMarks}
            streamLabel={`${stream.class.name} ${stream.name}`}
            classSize={classSize}
            row={row}
            subjects={subjects}
            attendance={attendance}
            classTeacherName={classTeacher?.teacher.name ?? null}
            nextTermStart={nextTerm?.startDate ?? null}
            teacherRemark={remarksByEnrollment.get(row.enrollmentId)?.teacherRemark}
            headRemark={remarksByEnrollment.get(row.enrollmentId)?.headRemark}
          />
        ))}
      </div>
    </div>
  );
}
