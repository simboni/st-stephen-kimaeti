import type { Metadata } from "next";
import { db } from "@/lib/db";
import { can, requirePermission } from "@/lib/rbac";
import { setEventArchived, setNoticeArchived } from "@/lib/actions/communication-actions";
import { EventForm, NoticeForm } from "@/components/communication-forms";
import { BanIcon, CheckIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Notices & Calendar" };

const AUDIENCE_LABELS: Record<string, string> = {
  ALL: "Everyone",
  STAFF: "Staff",
  PARENTS: "Parents",
  STUDENTS: "Pupils",
};

export default async function CommunicationPage({
  searchParams,
}: {
  searchParams: Promise<{ posted?: string; added?: string }>;
}) {
  const user = await requirePermission("communication", "view");
  const { posted = "", added = "" } = await searchParams;

  const [mayCreate, mayArchive, notices, events] = await Promise.all([
    can(user.role, "communication", "create"),
    can(user.role, "communication", "archive"),
    db.notice.findMany({ orderBy: [{ archived: "asc" }, { createdAt: "desc" }], take: 30 }),
    db.calendarEvent.findMany({ orderBy: [{ archived: "asc" }, { date: "asc" }], take: 30 }),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink-900">
          Notices &amp; Calendar
        </h1>
        <p className="mt-1 text-sm">
          Notices and events appear on the dashboards of the audience you choose —
          staff, parents, pupils or everyone.
        </p>
      </div>

      {(posted || added) && (
        <p className="rounded-xl bg-leaf-500/10 px-4 py-3 text-sm font-semibold text-leaf-600">
          {posted ? "Notice posted." : "Event added to the calendar."}
        </p>
      )}

      {mayCreate && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <NoticeForm />
          <EventForm />
        </div>
      )}

      {/* Notices */}
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-ink-400">
          Notices
        </h2>
        <div className="card overflow-x-auto">
          <table className="table-admin">
            <thead>
              <tr>
                <th>Notice</th>
                <th>Audience</th>
                <th>Posted</th>
                <th>Expires</th>
                {mayArchive && <th className="text-right">Archive</th>}
              </tr>
            </thead>
            <tbody>
              {notices.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-ink-400">
                    Nothing posted yet.
                  </td>
                </tr>
              )}
              {notices.map((n) => (
                <tr key={n.id} className={n.archived ? "opacity-50" : ""}>
                  <td>
                    <p className="font-semibold text-ink-900">
                      {n.title}
                      {n.archived && (
                        <span className="chip ml-2 bg-danger-500/10 text-danger-500">Archived</span>
                      )}
                    </p>
                    <p className="max-w-md truncate text-xs text-ink-500">{n.body}</p>
                  </td>
                  <td>
                    <span className="chip bg-brand-50 text-brand-700">{AUDIENCE_LABELS[n.audience]}</span>
                  </td>
                  <td className="whitespace-nowrap text-ink-400">
                    {n.createdAt.toLocaleDateString("en-KE", { day: "numeric", month: "short", timeZone: "Africa/Nairobi" })}
                    {" · "}
                    {n.createdBy}
                  </td>
                  <td className="text-ink-400">
                    {n.expiresAt
                      ? n.expiresAt.toLocaleDateString("en-KE", { day: "numeric", month: "short", timeZone: "UTC" })
                      : "—"}
                  </td>
                  {mayArchive && (
                    <td>
                      <form action={setNoticeArchived} className="flex justify-end">
                        <input type="hidden" name="id" value={n.id} />
                        <input type="hidden" name="archived" value={n.archived ? "false" : "true"} />
                        <button
                          type="submit"
                          className={n.archived ? "btn btn-secondary !p-2 !text-leaf-600" : "btn btn-danger !p-2"}
                          title={n.archived ? "Restore notice" : "Archive notice"}
                          aria-label={`${n.archived ? "Restore" : "Archive"} ${n.title}`}
                        >
                          {n.archived ? <CheckIcon className="h-3.5 w-3.5" /> : <BanIcon className="h-3.5 w-3.5" />}
                        </button>
                      </form>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Calendar */}
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-ink-400">
          School calendar
        </h2>
        <div className="card overflow-x-auto">
          <table className="table-admin">
            <thead>
              <tr>
                <th>Event</th>
                <th>When</th>
                <th>Audience</th>
                <th>Note</th>
                {mayArchive && <th className="text-right">Archive</th>}
              </tr>
            </thead>
            <tbody>
              {events.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-ink-400">
                    No events yet.
                  </td>
                </tr>
              )}
              {events.map((e) => (
                <tr key={e.id} className={e.archived ? "opacity-50" : ""}>
                  <td className="font-semibold text-ink-900">
                    {e.title}
                    {e.archived && (
                      <span className="chip ml-2 bg-danger-500/10 text-danger-500">Archived</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap text-ink-500">
                    {e.date.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}
                    {e.endDate
                      ? ` – ${e.endDate.toLocaleDateString("en-KE", { day: "numeric", month: "short", timeZone: "UTC" })}`
                      : ""}
                  </td>
                  <td>
                    <span className="chip bg-brand-50 text-brand-700">{AUDIENCE_LABELS[e.audience]}</span>
                  </td>
                  <td className="max-w-xs truncate text-ink-500">{e.note ?? "—"}</td>
                  {mayArchive && (
                    <td>
                      <form action={setEventArchived} className="flex justify-end">
                        <input type="hidden" name="id" value={e.id} />
                        <input type="hidden" name="archived" value={e.archived ? "false" : "true"} />
                        <button
                          type="submit"
                          className={e.archived ? "btn btn-secondary !p-2 !text-leaf-600" : "btn btn-danger !p-2"}
                          title={e.archived ? "Restore event" : "Archive event"}
                          aria-label={`${e.archived ? "Restore" : "Archive"} ${e.title}`}
                        >
                          {e.archived ? <CheckIcon className="h-3.5 w-3.5" /> : <BanIcon className="h-3.5 w-3.5" />}
                        </button>
                      </form>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
