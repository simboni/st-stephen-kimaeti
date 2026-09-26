import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getActiveSession } from "@/lib/school";
import { StudentLeaveForm } from "@/components/student-leave-forms";

export const metadata: Metadata = { title: "Absence Requests" };

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-sun-400/15 text-sun-500",
  APPROVED: "bg-leaf-500/10 text-leaf-600",
  REJECTED: "bg-danger-500/10 text-danger-500",
};

/** Absence permission — self-service for parents (their children) and
 *  pupils (themselves). Needs no module permission: own data only. */
export default async function AbsencePage({
  searchParams,
}: {
  searchParams: Promise<{ applied?: string }>;
}) {
  const user = await requireUser();
  const { applied = "" } = await searchParams;
  const session = await getActiveSession();

  const students =
    user.role === "PARENT"
      ? (
          await db.parentLink.findMany({
            where: { userId: user.id, student: { archived: false } },
            include: { student: true },
          })
        ).map((l) => l.student)
      : user.role === "STUDENT"
        ? await db.student.findMany({ where: { userId: user.id, archived: false } })
        : [];

  if (students.length === 0 || !session)
    return (
      <div className="mx-auto max-w-2xl">
        <div className="card p-8 text-center">
          <p className="font-display text-lg font-extrabold text-ink-900">
            No linked pupils
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed">
            Absence requests are made from parent and pupil accounts with linked
            children — please contact the school office.
          </p>
          <Link href="/" className="btn btn-secondary mt-4">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    );

  const enrollments = await db.enrollment.findMany({
    where: { studentId: { in: students.map((s) => s.id) }, sessionId: session.id },
    include: {
      student: true,
      stream: { include: { class: true } },
      studentLeaves: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink-900">
          Absence Requests
        </h1>
        <p className="mt-1 text-sm">
          Ask for permission before a pupil misses school — session {session.name}.
        </p>
      </div>

      {applied && (
        <p className="rounded-xl bg-leaf-500/10 px-4 py-3 text-sm font-semibold text-leaf-600">
          Request sent — the class teacher or office will respond here.
        </p>
      )}

      <StudentLeaveForm
        pupils={enrollments.map((e) => ({
          studentId: e.studentId,
          label: `${e.student.firstName} ${e.student.lastName} (${e.stream.class.name} ${e.stream.name})`,
        }))}
      />

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-ink-400">
          Requests this session
        </h2>
        <div className="card overflow-x-auto">
          <table className="table-admin">
            <thead>
              <tr>
                <th>Pupil</th>
                <th>Dates</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.every((e) => e.studentLeaves.length === 0) && (
                <tr>
                  <td colSpan={4} className="text-center text-ink-400">
                    No requests yet.
                  </td>
                </tr>
              )}
              {enrollments.flatMap((e) =>
                e.studentLeaves.map((l) => (
                  <tr key={l.id}>
                    <td className="font-semibold text-ink-900">
                      {e.student.firstName} {e.student.lastName}
                    </td>
                    <td className="whitespace-nowrap text-ink-500">
                      {l.startDate.toLocaleDateString("en-KE", { day: "numeric", month: "short", timeZone: "UTC" })}
                      {" – "}
                      {l.endDate.toLocaleDateString("en-KE", { day: "numeric", month: "short", timeZone: "UTC" })}
                    </td>
                    <td className="max-w-xs truncate text-ink-500">{l.reason}</td>
                    <td>
                      <span className={`chip ${STATUS_STYLE[l.status]}`}>
                        {l.status.toLowerCase()}
                        {l.status === "REJECTED" && l.decisionNote ? ` — ${l.decisionNote}` : ""}
                      </span>
                    </td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
