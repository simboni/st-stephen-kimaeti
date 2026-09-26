import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { getSchoolSettings, logoSrc } from "@/lib/school";
import { attendanceSummary, streamResults } from "@/lib/exams";
import { saveReportRemarks } from "@/lib/actions/exams-actions";
import { ReportCard } from "@/components/report-card";
import { PrintButton } from "@/components/fees-forms";

export const metadata: Metadata = { title: "Report Card" };

export default async function ReportCardPage({
  params,
  searchParams,
}: {
  params: Promise<{ examId: string; studentId: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await requireUser();
  const { examId, studentId } = await params;
  const { saved = "" } = await searchParams;

  const exam = await db.exam.findUnique({ where: { id: examId }, include: { term: true } });
  if (!exam || exam.archived) notFound();

  // Staff need the exams module; parents and pupils may open their own
  // pupil's card once the exam is published to the portal.
  const isStaff = await can(user.role, "exams", "view");
  if (!isStaff) {
    let linked = false;
    if (user.role === "PARENT") {
      linked = !!(await db.parentLink.findUnique({
        where: { userId_studentId: { userId: user.id, studentId } },
      }));
    } else if (user.role === "STUDENT") {
      const own = await db.student.findUnique({ where: { id: studentId }, select: { userId: true } });
      linked = own?.userId === user.id;
    }
    if (!linked || !exam.published) redirect("/denied");
  }

  const enrollment = await db.enrollment.findUnique({
    where: { studentId_sessionId: { studentId, sessionId: exam.sessionId } },
  });
  if (!enrollment) notFound();

  const [results, school, attendance, classTeacher, terms, remarks, mayRemark] =
    await Promise.all([
      streamResults(examId, enrollment.streamId),
      getSchoolSettings(),
      attendanceSummary(enrollment.id),
      db.classTeacher.findUnique({
        where: { streamId_sessionId: { streamId: enrollment.streamId, sessionId: exam.sessionId } },
        include: { teacher: true },
      }),
      db.term.findMany({ where: { sessionId: exam.sessionId }, orderBy: { number: "asc" } }),
      db.reportRemark.findUnique({
        where: { examId_enrollmentId: { examId, enrollmentId: enrollment.id } },
      }),
      can(user.role, "exams", "create"),
    ]);
  if (!results) notFound();

  const row = results.rows.find((r) => r.studentId === studentId);
  if (!row) notFound();

  const nextTerm = terms.find((t) => t.number === exam.term.number + 1) ?? null;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between print:hidden">
        {isStaff ? (
          <Link href={`/exams/${examId}/results?stream=${enrollment.streamId}`} className="btn btn-secondary">
            ← Back to results
          </Link>
        ) : (
          <Link href="/" className="btn btn-secondary">
            ← Back to dashboard
          </Link>
        )}
        <PrintButton label="Print report card" />
      </div>

      {saved && (
        <p className="rounded-xl bg-leaf-500/10 px-4 py-3 text-sm font-semibold text-leaf-600 print:hidden">
          Remarks saved — they print on the card below.
        </p>
      )}

      {isStaff && mayRemark && (
        <form action={saveReportRemarks} className="card space-y-3 p-5 print:hidden">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-400">
            Report-card remarks (leave blank to use the automatic CBC remark)
          </p>
          <input type="hidden" name="examId" value={examId} />
          <input type="hidden" name="enrollmentId" value={enrollment.id} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="teacherRemark" className="mb-1 block text-xs font-bold text-ink-400">
                Class teacher&rsquo;s remark
              </label>
              <textarea
                id="teacherRemark"
                name="teacherRemark"
                rows={2}
                defaultValue={remarks?.teacherRemark ?? ""}
                placeholder="e.g. A focused term — keep encouraging daily reading at home."
                className="field !py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="headRemark" className="mb-1 block text-xs font-bold text-ink-400">
                Head teacher&rsquo;s remark
              </label>
              <textarea
                id="headRemark"
                name="headRemark"
                rows={2}
                defaultValue={remarks?.headRemark ?? ""}
                placeholder="Optional"
                className="field !py-2 text-sm"
              />
            </div>
          </div>
          <button type="submit" className="btn btn-secondary !py-2 text-xs">
            Save remarks
          </button>
        </form>
      )}

      <ReportCard
        school={school}
        logoSrc={logoSrc(school)}
        examName={exam.name}
        termName={exam.term.name}
        sessionName={results.exam.session.name}
        maxMarks={exam.maxMarks}
        streamLabel={`${results.stream.class.name} ${results.stream.name}`}
        classSize={results.rows.filter((r) => r.subjectsMarked > 0).length}
        row={row}
        subjects={results.subjects}
        attendance={attendance}
        classTeacherName={classTeacher?.teacher.name ?? null}
        nextTermStart={nextTerm?.startDate ?? null}
        teacherRemark={remarks?.teacherRemark}
        headRemark={remarks?.headRemark}
      />
    </div>
  );
}
