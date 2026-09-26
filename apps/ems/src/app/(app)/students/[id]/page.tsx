import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { can, requirePermission } from "@/lib/rbac";
import { getActiveSession } from "@/lib/school";
import {
  addGuardian,
  exitStudent,
  removeGuardian,
  setStudentArchived,
} from "@/lib/actions/student-actions";
import { studentBalance } from "@/lib/fees";
import { formatMoney } from "@/lib/money";
import { PortalAccessPanel } from "@/components/portal-access";
import { CloseIcon, PencilIcon } from "@/components/icons";

const EXIT_LABELS: Record<string, string> = {
  TRANSFERRED: "Transferred",
  GRADUATED: "Graduated",
  WITHDRAWN: "Withdrawn",
};

export const metadata: Metadata = { title: "Student profile" };

function fmt(d: Date | null) {
  return d
    ? d.toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
    : "—";
}

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("students", "view");
  const { id } = await params;

  const [student, session, mayEdit, mayArchive] = await Promise.all([
    db.student.findUnique({
      where: { id },
      include: {
        guardians: true,
        user: { select: { username: true } },
        parentLinks: { include: { user: { select: { username: true, name: true, phone: true } } } },
        enrollments: {
          include: { stream: { include: { class: true } }, session: true },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    getActiveSession(),
    can(user.role, "students", "edit"),
    can(user.role, "students", "archive"),
  ]);
  if (!student) notFound();

  const current = student.enrollments.find((e) => e.sessionId === session?.id);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="card flex flex-wrap items-center justify-between gap-4 p-6">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 font-display text-xl font-extrabold text-white">
            {student.firstName.charAt(0)}
            {student.lastName.charAt(0)}
          </span>
          <div>
            <h1 className="font-display text-xl font-extrabold text-ink-900">
              {student.firstName} {student.lastName}
              {student.archived && (
                <span className="chip ml-2 bg-danger-500/10 text-danger-500" title={student.archiveReason ?? ""}>
                  Archived
                </span>
              )}
            </h1>
            <p className="text-sm text-ink-500">
              <span className="font-mono text-xs">{student.admissionNo}</span>
              {current && (
                <>
                  {" · "}
                  {current.stream.class.name} {current.stream.name}
                </>
              )}
              {" · "}
              {student.gender === "MALE" ? "Boy" : "Girl"} ·{" "}
              {student.boarding === "BOARDER" ? "Boarder" : "Day scholar"}
            </p>
          </div>
        </div>
        {mayEdit && (
          <Link href={`/students/${student.id}/edit`} className="btn btn-secondary">
            <PencilIcon className="h-4 w-4" /> Edit
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Details */}
        <section className="card p-6">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-ink-400">
            Details
          </h2>
          <dl className="space-y-3 text-sm">
            {[
              ["Date of birth", fmt(student.dateOfBirth)],
              ["UPI / NEMIS", student.upiNumber ?? "—"],
              ["Religion", student.religion ?? "—"],
              ["Address", student.address ?? "—"],
              ["Medical notes", student.medicalNotes ?? "—"],
              ["Admitted", fmt(student.admittedAt)],
            ].map(([label, value]) => (
              <div key={label as string} className="flex justify-between gap-6">
                <dt className="shrink-0 font-bold text-ink-700">{label}</dt>
                <dd className="text-right text-ink-500">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Guardians */}
        <section className="card p-6">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-ink-400">
            Parents &amp; guardians
          </h2>
          <ul className="space-y-3">
            {student.guardians.map((g) => (
              <li key={g.id} className="flex items-start justify-between gap-3 rounded-xl bg-paper-100 p-4">
                <div>
                  <p className="text-sm font-bold text-ink-900">
                    {g.name} <span className="font-normal text-ink-400">· {g.relation}</span>
                  </p>
                  <p className="text-xs text-ink-500">
                    {[g.phone, g.email, g.occupation].filter(Boolean).join(" · ") || "No contact details"}
                  </p>
                </div>
                {mayEdit && student.guardians.length > 1 && (
                  <form action={removeGuardian}>
                    <input type="hidden" name="id" value={g.id} />
                    <button
                      type="submit"
                      className="btn btn-danger !p-1.5"
                      title="Remove guardian"
                      aria-label={`Remove ${g.name}`}
                    >
                      <CloseIcon className="h-3 w-3" />
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
          {mayEdit && (
            <form action={addGuardian} className="mt-4 grid grid-cols-2 gap-2">
              <input type="hidden" name="studentId" value={student.id} />
              <input name="name" placeholder="Name" className="field !py-2 text-sm" aria-label="Guardian name" />
              <select name="relation" defaultValue="Guardian" className="field !py-2 text-sm" aria-label="Relationship">
                {["Mother", "Father", "Guardian", "Grandparent", "Other"].map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <input name="phone" placeholder="Phone" className="field !py-2 text-sm" aria-label="Guardian phone" />
              <button type="submit" className="btn btn-secondary !py-2 text-xs">
                Add guardian
              </button>
            </form>
          )}
        </section>

        {/* Enrollment history */}
        <section className="card p-6">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-ink-400">
            Enrollment history
          </h2>
          <table className="table-admin">
            <thead>
              <tr>
                <th>Session</th>
                <th>Class</th>
              </tr>
            </thead>
            <tbody>
              {student.enrollments.map((e) => (
                <tr key={e.id}>
                  <td className="font-semibold text-ink-900">
                    {e.session.name}
                    {e.sessionId === session?.id && (
                      <span className="chip ml-2 bg-leaf-500/15 text-leaf-600">Current</span>
                    )}
                  </td>
                  <td>
                    {e.stream.class.name} {e.stream.name}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Portal access */}
        {mayEdit ? (
          <PortalAccessPanel
            studentId={student.id}
            hasStudentLogin={!!student.userId}
            studentUsername={student.user?.username}
            guardians={student.guardians.map((g) => ({
              id: g.id,
              name: g.name,
              hasAccount: student.parentLinks.some(
                (pl) => g.phone != null && pl.user.phone === g.phone,
              ),
            }))}
            linkedParents={student.parentLinks.map((pl) => ({
              username: pl.user.username,
              name: pl.user.name,
            }))}
          />
        ) : (
          <section className="card p-6">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-ink-400">
              Portal access
            </h2>
            <p className="text-sm text-ink-500">
              {student.userId ? "Pupil login active." : "No pupil login yet."}{" "}
              {student.parentLinks.length} linked parent account
              {student.parentLinks.length === 1 ? "" : "s"}.
            </p>
          </section>
        )}
      </div>

      {/* Exit / restore */}
      {mayArchive && (
        <section className="card border-danger-500/30 p-6">
          {student.archived ? (
            <form action={setStudentArchived} className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm">
                <p className="font-bold text-ink-900">
                  {student.exitType ? EXIT_LABELS[student.exitType] : "Archived"}
                  {student.exitAt ? ` on ${fmt(student.exitAt)}` : ""}
                  {student.exitDestination ? ` → ${student.exitDestination}` : ""}
                </p>
                <p className="text-ink-500">
                  {student.archiveReason ?? ""}
                  {student.exitBalanceCents != null && student.exitBalanceCents !== 0 && (
                    <span className="ml-1 font-bold text-danger-500">
                      · balance at exit {formatMoney(student.exitBalanceCents)}
                    </span>
                  )}
                </p>
                <p className="mt-1 text-xs text-ink-400">
                  History (enrollments, results, fee records) is preserved. Restore to
                  re-admit the pupil.
                </p>
              </div>
              <input type="hidden" name="id" value={student.id} />
              <input type="hidden" name="archived" value="false" />
              <button type="submit" className="btn btn-secondary !text-leaf-600">
                Restore pupil
              </button>
            </form>
          ) : (
            <ExitForm studentId={student.id} sessionId={session?.id ?? null} />
          )}
        </section>
      )}
    </div>
  );
}

/** Exit form with a live fee-balance warning — money owed stays on record. */
async function ExitForm({ studentId, sessionId }: { studentId: string; sessionId: string | null }) {
  const balance = sessionId ? await studentBalance(studentId, sessionId) : null;

  return (
    <form action={exitStudent} className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-400">
        Exit this pupil (graduation happens through Students → Promotions)
      </p>
      {balance && balance.balanceCents > 0 && (
        <p className="rounded-lg bg-danger-500/10 px-3.5 py-2.5 text-sm font-semibold text-danger-500">
          Outstanding fee balance: {formatMoney(balance.balanceCents)} — it will be
          recorded as the balance at exit and remains payable.
        </p>
      )}
      <input type="hidden" name="id" value={studentId} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="exitType" className="mb-1 block text-xs font-bold text-ink-400">
            Exit type *
          </label>
          <select id="exitType" name="exitType" defaultValue="TRANSFERRED" className="field !py-2 text-sm">
            <option value="TRANSFERRED">Transfer to another school</option>
            <option value="WITHDRAWN">Withdrawal (left schooling)</option>
          </select>
        </div>
        <div>
          <label htmlFor="destination" className="mb-1 block text-xs font-bold text-ink-400">
            Receiving school (transfers)
          </label>
          <input id="destination" name="destination" placeholder="e.g. St. Mary's Mumias" className="field !py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="exitDate" className="mb-1 block text-xs font-bold text-ink-400">
            Exit date
          </label>
          <input id="exitDate" name="exitDate" type="date" className="field !py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="reason" className="mb-1 block text-xs font-bold text-ink-400">
            Note / reason
          </label>
          <input id="reason" name="reason" placeholder="Optional" className="field !py-2 text-sm" />
        </div>
      </div>
      <button type="submit" className="btn btn-danger">
        Record exit
      </button>
      <p className="text-xs text-ink-400">
        The pupil leaves the active roll but every record (results, fees, attendance)
        is preserved, and the account can be restored if they return.
      </p>
    </form>
  );
}
