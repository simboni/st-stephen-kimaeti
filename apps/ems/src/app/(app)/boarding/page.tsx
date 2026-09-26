import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { can, requirePermission } from "@/lib/rbac";
import { getActiveSession } from "@/lib/school";
import { HostelForm } from "@/components/boarding-forms";
import { setHostelArchived } from "@/lib/actions/boarding-actions";

export const metadata: Metadata = { title: "Dormitories" };

export default async function BoardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; archived?: string }>;
}) {
  const user = await requirePermission("boarding", "view");
  const sp = await searchParams;
  const showArchived = sp.archived === "1";
  const session = await getActiveSession();
  const [mayCreate, mayArchive] = await Promise.all([
    can(user.role, "boarding", "create"),
    can(user.role, "boarding", "archive"),
  ]);

  const [hostels, staff, boardersOnRoll, housed] = await Promise.all([
    db.hostel.findMany({
      where: { archived: showArchived },
      include: {
        warden: true,
        rooms: {
          include: {
            _count: {
              select: { allocations: session ? { where: { sessionId: session.id } } : true },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    db.staffProfile.findMany({
      where: { archived: false },
      orderBy: { lastName: "asc" },
    }),
    session
      ? db.enrollment.count({
          where: {
            sessionId: session.id,
            student: { archived: false, boarding: "BOARDER" },
          },
        })
      : 0,
    session ? db.bedAllocation.count({ where: { sessionId: session.id } }) : 0,
  ]);

  const totalBeds = hostels.reduce(
    (s, h) => s + h.rooms.reduce((t, r) => t + r.beds, 0),
    0,
  );
  const unhoused = boardersOnRoll - housed;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink-900">Dormitories</h1>
        <p className="mt-1 text-sm">
          Where the boarders sleep, and who is in charge of them
          {session ? ` — ${session.name}` : ""}.
        </p>
      </div>

      {sp.error && (
        <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800">
          {sp.error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <span className="chip bg-paper-200 text-ink-700">
          Boarders on the roll: <b className="ml-1 text-ink-900">{boardersOnRoll}</b>
        </span>
        <span className="chip bg-paper-200 text-ink-700">
          Beds: <b className="ml-1 text-ink-900">{housed} of {totalBeds} taken</b>
        </span>
        {unhoused > 0 && (
          <span className="chip bg-brand-50 text-brand-800">
            {unhoused} boarder{unhoused === 1 ? "" : "s"} without a bed
          </span>
        )}
        {totalBeds > 0 && boardersOnRoll > totalBeds && (
          <span className="chip bg-danger-500/10 text-danger-500">
            {boardersOnRoll - totalBeds} more boarders than beds
          </span>
        )}
      </div>

      <div className="card overflow-x-auto">
        <table className="table-admin">
          <thead>
            <tr>
              <th>Dormitory</th>
              <th>Houses</th>
              <th>Matron / master</th>
              <th className="text-right">Rooms</th>
              <th className="text-right">Beds</th>
              <th className="text-right">Occupied</th>
              {mayArchive && <th />}
            </tr>
          </thead>
          <tbody>
            {hostels.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-ink-400">
                  {showArchived ? "No archived dormitories." : "No dormitories yet."}
                </td>
              </tr>
            )}
            {hostels.map((h) => {
              const beds = h.rooms.reduce((s, r) => s + r.beds, 0);
              const taken = h.rooms.reduce((s, r) => s + r._count.allocations, 0);
              return (
                <tr key={h.id}>
                  <td className="font-semibold text-ink-900">
                    <Link href={`/boarding/${h.id}`} className="hover:underline">
                      {h.name}
                    </Link>
                  </td>
                  <td className="text-ink-500">{h.gender === "MALE" ? "Boys" : "Girls"}</td>
                  <td className="text-ink-500">
                    {h.warden ? `${h.warden.firstName} ${h.warden.lastName}` : "—"}
                  </td>
                  <td className="text-right">{h.rooms.length}</td>
                  <td className="text-right">{beds}</td>
                  <td className="text-right font-semibold">
                    {taken}
                    {beds > 0 && (
                      <span className="ml-1 text-xs font-normal text-ink-400">
                        ({Math.round((taken / beds) * 100)}%)
                      </span>
                    )}
                  </td>
                  {mayArchive && (
                    <td className="text-right">
                      <form action={setHostelArchived}>
                        <input type="hidden" name="id" value={h.id} />
                        <input type="hidden" name="archived" value={showArchived ? "false" : "true"} />
                        <button type="submit" className="btn btn-secondary !px-3 !py-1.5 text-xs">
                          {showArchived ? "Restore" : "Archive"}
                        </button>
                      </form>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Link
        href={showArchived ? "/boarding" : "/boarding?archived=1"}
        className="inline-block text-xs font-bold text-brand-600 hover:underline"
      >
        {showArchived ? "← Back to active dormitories" : "View archived dormitories"}
      </Link>

      {mayCreate && !showArchived && (
        <HostelForm
          staff={staff.map((s) => ({ id: s.id, name: `${s.lastName}, ${s.firstName}` }))}
        />
      )}
    </div>
  );
}
