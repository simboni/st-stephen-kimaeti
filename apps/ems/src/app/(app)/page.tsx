import Link from "next/link";
import type { Role } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { db } from "@/lib/db";
import { getActiveSession } from "@/lib/school";
import { studentBalance } from "@/lib/fees";
import { formatMoney } from "@/lib/money";
import { currentNotices, upcomingEvents } from "@/lib/notices";
import { markHomeworkDone } from "@/lib/actions/homework-actions";
import { RoleChip, ROLE_LABELS } from "@/components/role-chip";

/** Notices + upcoming calendar entries for the signed-in role. */
async function NoticeBoard({ role }: { role: Role }) {
  const [notices, events] = await Promise.all([currentNotices(role), upcomingEvents(role)]);
  if (notices.length === 0 && events.length === 0) return null;

  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {notices.length > 0 && (
        <div className="card p-6">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-ink-400">
            Notice board
          </h2>
          <ul className="space-y-3">
            {notices.map((n) => (
              <li key={n.id} className="border-b border-paper-200 pb-3 last:border-0 last:pb-0">
                <p className="text-sm font-bold text-ink-900">{n.title}</p>
                <p className="text-sm leading-relaxed text-ink-500">{n.body}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-ink-400">
                  {n.createdAt.toLocaleDateString("en-KE", {
                    day: "numeric",
                    month: "short",
                    timeZone: "Africa/Nairobi",
                  })}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
      {events.length > 0 && (
        <div className="card p-6">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-ink-400">
            Coming up
          </h2>
          <ul className="space-y-3">
            {events.map((e) => (
              <li key={e.id} className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-50 font-display leading-none text-brand-700">
                  <b className="text-base">{e.date.getUTCDate()}</b>
                  <span className="text-[9px] font-bold uppercase">
                    {e.date.toLocaleDateString("en-KE", { month: "short", timeZone: "UTC" })}
                  </span>
                </span>
                <div>
                  <p className="text-sm font-bold text-ink-900">{e.title}</p>
                  {e.note && <p className="text-xs text-ink-500">{e.note}</p>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/** A parent's children, with current class placement. */
async function ParentPanel({ userId }: { userId: string }) {
  const [links, session] = await Promise.all([
    db.parentLink.findMany({
      where: { userId, student: { archived: false } },
      include: {
        student: {
          include: {
            enrollments: { include: { stream: { include: { class: true } } } },
          },
        },
      },
    }),
    getActiveSession(),
  ]);

  if (links.length === 0)
    return (
      <div className="card p-8 text-center text-sm text-ink-500">
        No children are linked to your account yet — please contact the school office.
      </div>
    );

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-ink-400">
          Your children
        </h2>
        <Link href="/absence" className="text-xs font-bold text-brand-600 hover:text-brand-700">
          Request absence permission →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {await Promise.all(
          links.map(async ({ student }) => {
            const current = student.enrollments.find((e) => e.sessionId === session?.id);
            const balance = session ? await studentBalance(student.id, session.id) : null;
            const [publishedExams, openHomework] = current
              ? await Promise.all([
                  db.exam.findMany({
                    where: {
                      sessionId: current.sessionId,
                      published: true,
                      archived: false,
                      marks: { some: { enrollmentId: current.id } },
                    },
                    include: { term: true },
                    orderBy: { createdAt: "desc" },
                  }),
                  db.homework.findMany({
                    where: {
                      streamId: current.streamId,
                      sessionId: current.sessionId,
                      archived: false,
                      submissions: { none: { enrollmentId: current.id } },
                    },
                    include: { subject: true },
                    orderBy: { dueDate: "asc" },
                    take: 3,
                  }),
                ])
              : [[], []];
            const [total, present] = current
              ? await Promise.all([
                  db.attendanceRecord.count({ where: { enrollmentId: current.id } }),
                  db.attendanceRecord.count({
                    where: {
                      enrollmentId: current.id,
                      status: { in: ["PRESENT", "LATE", "HALF_DAY"] },
                    },
                  }),
                ])
              : [0, 0];
            return (
              <div key={student.id} className="card flex items-center gap-4 p-6">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-500 font-display text-lg font-extrabold text-white">
                  {student.firstName.charAt(0)}
                  {student.lastName.charAt(0)}
                </span>
                <div>
                  <p className="font-display text-base font-extrabold text-ink-900">
                    {student.firstName} {student.lastName}
                  </p>
                  <p className="text-sm text-ink-500">
                    <span className="font-mono text-xs">{student.admissionNo}</span>
                    {current && (
                      <>
                        {" · "}
                        {current.stream.class.name} {current.stream.name}
                      </>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-ink-400">
                    {total > 0
                      ? `Attendance this session: ${Math.round((present / total) * 100)}% of ${total} marked day${total === 1 ? "" : "s"}`
                      : "Report cards appear here as those modules launch."}
                  </p>
                  {balance && balance.chargedCents > 0 && (
                    <p className={`mt-0.5 text-xs font-bold ${balance.balanceCents > 0 ? "text-danger-500" : "text-leaf-600"}`}>
                      Fee balance: {formatMoney(balance.balanceCents)}
                    </p>
                  )}
                  {publishedExams.map((exam) => (
                    <p key={exam.id} className="mt-0.5 text-xs">
                      <Link
                        href={`/exams/${exam.id}/report/${student.id}`}
                        className="font-bold text-brand-600 hover:text-brand-700"
                      >
                        {exam.name} ({exam.term.name}) report card →
                      </Link>
                    </p>
                  ))}
                  {openHomework.map((hw) => (
                    <p key={hw.id} className="mt-0.5 text-xs text-ink-500">
                      Homework due{" "}
                      {hw.dueDate.toLocaleDateString("en-KE", { day: "numeric", month: "short", timeZone: "UTC" })}
                      : <b className="text-ink-700">{hw.title}</b> ({hw.subject.name})
                    </p>
                  ))}
                </div>
              </div>
            );
          }),
        )}
      </div>
    </section>
  );
}

/** A pupil's own placement. */
async function StudentPanel({ userId }: { userId: string }) {
  const [student, session] = await Promise.all([
    db.student.findFirst({
      where: { userId },
      include: {
        enrollments: { include: { stream: { include: { class: true } } } },
      },
    }),
    getActiveSession(),
  ]);

  if (!student)
    return (
      <div className="card p-8 text-center text-sm text-ink-500">
        Your account is not linked to a pupil record — please contact the school office.
      </div>
    );

  const current = student.enrollments.find((e) => e.sessionId === session?.id);
  const [publishedExams, homework] = current
    ? await Promise.all([
        db.exam.findMany({
          where: {
            sessionId: current.sessionId,
            published: true,
            archived: false,
            marks: { some: { enrollmentId: current.id } },
          },
          include: { term: true },
          orderBy: { createdAt: "desc" },
        }),
        db.homework.findMany({
          where: { streamId: current.streamId, sessionId: current.sessionId, archived: false },
          include: { subject: true, submissions: { where: { enrollmentId: current.id } } },
          orderBy: { dueDate: "asc" },
          take: 8,
        }),
      ])
    : [[], []];

  return (
    <section className="card p-6">
      <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-ink-400">
        Your class
      </h2>
      <p className="font-display text-xl font-extrabold text-ink-900">
        {current ? `${current.stream.class.name} ${current.stream.name}` : "Not yet placed"}
      </p>
      <p className="mt-1 text-sm text-ink-500">
        <span className="font-mono text-xs">{student.admissionNo}</span>
        {session ? ` · Session ${session.name}` : ""}
      </p>
      {publishedExams.length > 0 && (
        <div className="mt-3 space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-400">Your results</p>
          {publishedExams.map((exam) => (
            <p key={exam.id} className="text-sm">
              <Link
                href={`/exams/${exam.id}/report/${student.id}`}
                className="font-bold text-brand-600 hover:text-brand-700"
              >
                {exam.name} ({exam.term.name}) report card →
              </Link>
            </p>
          ))}
        </div>
      )}

      {homework.length > 0 ? (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-400">Your homework</p>
          {homework.map((hw) => {
            const sub = hw.submissions[0];
            return (
              <div key={hw.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-paper-100 px-4 py-2.5">
                <div>
                  <p className="text-sm font-bold text-ink-900">
                    {hw.title}
                    <span className="ml-2 text-xs font-semibold text-ink-400">{hw.subject.name}</span>
                  </p>
                  <p className="text-xs text-ink-500">
                    Due{" "}
                    {hw.dueDate.toLocaleDateString("en-KE", { day: "numeric", month: "short", timeZone: "UTC" })}
                    {" · "}
                    {hw.instructions}
                  </p>
                  {sub?.remark && (
                    <p className="text-xs font-semibold text-leaf-600">Teacher: {sub.remark}</p>
                  )}
                </div>
                {!sub ? (
                  <form action={markHomeworkDone}>
                    <input type="hidden" name="homeworkId" value={hw.id} />
                    <button type="submit" className="btn btn-primary !px-3 !py-1.5 text-xs">
                      Mark done
                    </button>
                  </form>
                ) : sub.evaluated ? (
                  <span className="chip bg-leaf-500/10 text-leaf-600">Evaluated</span>
                ) : (
                  <span className="chip bg-sun-400/15 text-sun-500">Done ✓</span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-3 text-xs text-ink-400">
          Your homework and published results appear here.
        </p>
      )}
    </section>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();
  const [showUsers, showAudit, staffProfile, seeStudents, seeFees, seeAttendance, seeFrontOffice] =
    await Promise.all([
      can(user.role, "users", "view"),
      can(user.role, "audit", "view"),
      db.staffProfile.findUnique({ where: { userId: user.id }, select: { id: true } }),
      can(user.role, "students", "view"),
      can(user.role, "fees", "view"),
      can(user.role, "attendance", "view"),
      can(user.role, "frontoffice", "view"),
    ]);

  // Operating numbers, each gated by the viewer's permissions. Everything is
  // computed from aggregates — no per-pupil loops on the dashboard.
  const todayStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const today = new Date(`${todayStr}T00:00:00Z`);
  const session = await getActiveSession();
  const currentTerm =
    session?.terms.find((t) => t.endDate >= today) ??
    session?.terms[session.terms.length - 1] ??
    null;

  const pupilStats: { label: string; value: string; sub?: string; href?: string }[] = [];
  const feeStats: { label: string; value: string; sub?: string; href?: string }[] = [];

  if (seeStudents && session) {
    const enrolls = await db.enrollment.findMany({
      where: { sessionId: session.id, student: { archived: false } },
      select: {
        stream: { select: { classId: true } },
        student: { select: { gender: true, boarding: true, admittedAt: true } },
      },
    });
    const boys = enrolls.filter((e) => e.student.gender === "MALE").length;
    const girls = enrolls.length - boys;
    const boarders = enrolls.filter((e) => e.student.boarding === "BOARDER").length;
    const newThisTerm = currentTerm
      ? enrolls.filter((e) => e.student.admittedAt >= currentTerm.startDate).length
      : 0;
    pupilStats.push(
      { label: "Active pupils", value: String(enrolls.length), sub: `${boys} boys · ${girls} girls`, href: "/students" },
      { label: "Boarders", value: String(boarders), sub: `${enrolls.length - boarders} day scholars` },
      {
        label: `New in ${currentTerm?.name ?? "term"}`,
        value: String(newThisTerm),
        sub: "admissions this term",
        href: "/students?show=all",
      },
    );

    if (seeFees) {
      // School-wide expected fees: per-enrollment match against the fee
      // structure (class + day/boarder scoped), then plain aggregates.
      const [items, payAgg, adjAgg, todayAgg, termAgg] = await Promise.all([
        db.feeItem.findMany({ where: { sessionId: session.id, archived: false } }),
        db.feePayment.aggregate({
          _sum: { amountCents: true },
          where: { sessionId: session.id, voided: false },
        }),
        db.feeAdjustment.aggregate({
          _sum: { amountCents: true },
          where: { sessionId: session.id },
        }),
        db.feePayment.aggregate({
          _sum: { amountCents: true },
          where: { voided: false, receivedAt: { gte: today } },
        }),
        currentTerm
          ? db.feePayment.aggregate({
              _sum: { amountCents: true },
              where: { sessionId: session.id, voided: false, receivedAt: { gte: currentTerm.startDate } },
            })
          : Promise.resolve({ _sum: { amountCents: 0 } }),
      ]);
      let chargedCents = adjAgg._sum.amountCents ?? 0;
      for (const e of enrolls) {
        for (const i of items) {
          if (
            (i.classId === null || i.classId === e.stream.classId) &&
            (i.boarding === null || i.boarding === e.student.boarding)
          )
            chargedCents += i.amountCents;
        }
      }
      const collected = payAgg._sum.amountCents ?? 0;
      const outstanding = chargedCents - collected;
      const rate = chargedCents > 0 ? Math.round((collected / chargedCents) * 100) : 0;
      feeStats.push(
        { label: "Collected today", value: formatMoney(todayAgg._sum.amountCents ?? 0) },
        {
          label: `Collected in ${currentTerm?.name ?? "term"}`,
          value: formatMoney(termAgg._sum.amountCents ?? 0),
        },
        {
          label: "Outstanding fees",
          value: formatMoney(Math.max(0, outstanding)),
          sub: "school-wide, this session",
          href: "/fees",
        },
        {
          label: "Collection rate",
          value: `${rate}%`,
          sub: `${formatMoney(collected)} of ${formatMoney(chargedCents)}`,
        },
      );
    }
  } else if (seeFees) {
    const todayAgg = await db.feePayment.aggregate({
      _sum: { amountCents: true },
      where: { voided: false, receivedAt: { gte: today } },
    });
    feeStats.push({ label: "Collected today", value: formatMoney(todayAgg._sum.amountCents ?? 0) });
  }

  if (seeAttendance) {
    const [marked, present] = await Promise.all([
      db.attendanceRecord.count({ where: { date: today } }),
      db.attendanceRecord.count({ where: { date: today, status: { not: "ABSENT" } } }),
    ]);
    pupilStats.push({
      label: "Attendance today",
      value: marked > 0 ? `${Math.round((present / marked) * 100)}%` : "—",
      sub: marked > 0 ? `${present} of ${marked} marked` : "not marked yet",
      href: "/attendance",
    });
  }
  if (seeFrontOffice) {
    const [open, pendingEnq] = await Promise.all([
      db.complaint.count({ where: { status: "OPEN" } }),
      db.enquiry.count({ where: { status: { in: ["NEW", "FOLLOW_UP"] } } }),
    ]);
    pupilStats.push({
      label: "Front office",
      value: String(open + pendingEnq),
      sub: `${open} open complaint${open === 1 ? "" : "s"} · ${pendingEnq} enquir${pendingEnq === 1 ? "y" : "ies"}`,
      href: "/frontoffice",
    });
  }

  const stats = [...pupilStats, ...feeStats];

  const roleCounts = showUsers
    ? await db.user.groupBy({ by: ["role"], _count: true, where: { active: true } })
    : [];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink-900">
          Welcome, {user.name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm">
          Signed in as <RoleChip role={user.role} /> — this dashboard grows a widget per
          module as we build them.
        </p>
      </div>

      {stats.length > 0 && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => {
            const body = (
              <>
                <p className="text-xs font-bold uppercase tracking-wider text-ink-400">{s.label}</p>
                <p className="mt-1 font-display text-xl font-extrabold text-brand-600">{s.value}</p>
                {s.sub && <p className="mt-0.5 text-xs text-ink-400">{s.sub}</p>}
              </>
            );
            return s.href ? (
              <Link key={s.label} href={s.href} className="card p-5 transition-shadow hover:shadow-md">
                {body}
              </Link>
            ) : (
              <div key={s.label} className="card p-5">
                {body}
              </div>
            );
          })}
        </div>
      )}

      {showUsers && (
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-ink-400">
            Active accounts by role
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {roleCounts
              .sort((a, b) => a.role.localeCompare(b.role))
              .map((rc) => (
                <Link key={rc.role} href="/users" className="card p-5 transition-shadow hover:shadow-md">
                  <p className="font-display text-3xl font-extrabold text-brand-600">{rc._count}</p>
                  <p className="mt-1 text-xs font-bold text-ink-700">{ROLE_LABELS[rc.role]}</p>
                </Link>
              ))}
          </div>
        </section>
      )}

      <NoticeBoard role={user.role} />

      {staffProfile && (
        <div className="card flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="font-display text-base font-extrabold text-ink-900">Staff self-service</p>
            <p className="text-sm text-ink-500">
              Check your leave balances or file a request.
            </p>
          </div>
          <Link href="/my-leave" className="btn btn-primary !py-2 text-xs">
            My leave →
          </Link>
        </div>
      )}

      {user.role === "PARENT" && <ParentPanel userId={user.id} />}
      {user.role === "STUDENT" && <StudentPanel userId={user.id} />}

      {!showUsers && !showAudit && user.role !== "PARENT" && user.role !== "STUDENT" && (
        <div className="card p-8 text-center">
          <p className="font-display text-lg font-extrabold text-ink-900">
            Your portal is being built
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed">
            Your tools appear here module by module as the system rolls out.
          </p>
        </div>
      )}
    </div>
  );
}
