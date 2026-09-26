import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { can, requirePermission } from "@/lib/rbac";
import { setActiveSession } from "@/lib/actions/settings-actions";
import { EditTermsForm } from "@/components/settings-forms";
import { CalendarIcon, PlusIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Sessions & Terms" };

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function fmt(d: Date) {
  return d.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function SessionsPage() {
  const user = await requirePermission("settings", "view");
  const [sessions, mayEdit, mayCreate] = await Promise.all([
    db.academicSession.findMany({
      include: { terms: { orderBy: { number: "asc" } } },
      orderBy: { startDate: "desc" },
    }),
    can(user.role, "settings", "edit"),
    can(user.role, "settings", "create"),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink-900">
            Academic Sessions &amp; Terms
          </h1>
          <p className="mt-1 text-sm">
            The school calendar — every record in the system (enrolments, fees, exams,
            attendance) is scoped to a session. Exactly one session is active at a time.
          </p>
        </div>
        {mayCreate && (
          <Link href="/settings/sessions/new" className="btn btn-primary">
            <PlusIcon className="h-4 w-4" /> New session
          </Link>
        )}
      </div>

      {sessions.length === 0 && (
        <div className="card p-8 text-center text-sm text-ink-400">
          No sessions yet — create the first one to get started.
        </div>
      )}

      <div className="space-y-5">
        {sessions.map((s) => (
          <section key={s.id} className={`card p-6 sm:p-8 ${s.active ? "!border-brand-400" : ""}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <CalendarIcon className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-display text-lg font-extrabold text-ink-900">{s.name}</h2>
                  <p className="text-xs text-ink-400">
                    {fmt(s.startDate)} – {fmt(s.endDate)}
                  </p>
                </div>
              </div>
              {s.active ? (
                <span className="chip bg-leaf-500/15 text-leaf-600">Active session</span>
              ) : (
                mayEdit && (
                  <form action={setActiveSession}>
                    <input type="hidden" name="id" value={s.id} />
                    <button type="submit" className="btn btn-secondary">
                      Make active
                    </button>
                  </form>
                )
              )}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="overflow-x-auto">
                <table className="table-admin">
                  <thead>
                    <tr>
                      <th>Term</th>
                      <th>Starts</th>
                      <th>Ends</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.terms.map((t) => (
                      <tr key={t.id}>
                        <td className="font-semibold text-ink-900">{t.name}</td>
                        <td>{fmt(t.startDate)}</td>
                        <td>{fmt(t.endDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {mayEdit && (
                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-ink-400">
                    Adjust term dates
                  </p>
                  <EditTermsForm
                    sessionId={s.id}
                    terms={s.terms.map((t) => ({
                      number: t.number,
                      start: iso(t.startDate),
                      end: iso(t.endDate),
                    }))}
                  />
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
