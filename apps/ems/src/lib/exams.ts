import "server-only";
import { db } from "@/lib/db";

/** One pupil's computed result line for an exam, within their stream. */
export type ResultRow = {
  enrollmentId: string;
  studentId: string;
  admissionNo: string;
  name: string;
  /** subjectId → score (null = absent, missing key = not entered). */
  scores: Map<string, number | null>;
  totalScore: number;
  /** Number of subjects with an entry (score or absent). */
  subjectsMarked: number;
  /** Average % across marked subjects (absences count as zero). */
  averagePct: number;
  position: number;
};

/**
 * Computes a stream's results for an exam: per-pupil scores, totals,
 * averages and class positions (competition ranking — ties share a position).
 */
export async function streamResults(examId: string, streamId: string) {
  const exam = await db.exam.findUnique({
    where: { id: examId },
    include: { term: true, session: true },
  });
  if (!exam) return null;

  const [enrollments, marks, stream] = await Promise.all([
    db.enrollment.findMany({
      where: { streamId, sessionId: exam.sessionId, student: { archived: false } },
      include: { student: true },
      orderBy: { student: { lastName: "asc" } },
    }),
    db.mark.findMany({
      where: { examId, enrollment: { streamId } },
    }),
    db.stream.findUnique({ where: { id: streamId }, include: { class: true } }),
  ]);
  if (!stream) return null;

  const subjects = (
    await db.classSubject.findMany({
      where: { classId: stream.classId, subject: { archived: false } },
      include: { subject: true },
      orderBy: { subject: { name: "asc" } },
    })
  ).map((cs) => cs.subject);

  const byEnrollment = new Map<string, Map<string, number | null>>();
  for (const m of marks) {
    if (!byEnrollment.has(m.enrollmentId)) byEnrollment.set(m.enrollmentId, new Map());
    byEnrollment.get(m.enrollmentId)!.set(m.subjectId, m.score);
  }

  const rows: ResultRow[] = enrollments.map((e) => {
    const scores = byEnrollment.get(e.id) ?? new Map<string, number | null>();
    let totalScore = 0;
    let subjectsMarked = 0;
    for (const s of subjects) {
      if (!scores.has(s.id)) continue;
      subjectsMarked += 1;
      totalScore += scores.get(s.id) ?? 0;
    }
    const averagePct =
      subjectsMarked > 0 && exam.maxMarks > 0
        ? (totalScore / (subjectsMarked * exam.maxMarks)) * 100
        : 0;
    return {
      enrollmentId: e.id,
      studentId: e.studentId,
      admissionNo: e.student.admissionNo,
      name: `${e.student.lastName}, ${e.student.firstName}`,
      scores,
      totalScore,
      subjectsMarked,
      averagePct,
      position: 0,
    };
  });

  // Competition ranking on total score; unmarked pupils sit at the bottom.
  const ranked = [...rows].sort((a, b) => b.totalScore - a.totalScore);
  ranked.forEach((row, i) => {
    row.position = i > 0 && ranked[i - 1].totalScore === row.totalScore ? ranked[i - 1].position : i + 1;
  });

  return { exam, stream, subjects, rows };
}

/** A pupil's attendance summary for a session (used on report cards). */
export async function attendanceSummary(enrollmentId: string) {
  const [total, present] = await Promise.all([
    db.attendanceRecord.count({ where: { enrollmentId } }),
    db.attendanceRecord.count({
      where: { enrollmentId, status: { in: ["PRESENT", "LATE", "HALF_DAY"] } },
    }),
  ]);
  return { total, present };
}
