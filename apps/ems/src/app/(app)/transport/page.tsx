import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { can, requirePermission } from "@/lib/rbac";
import { getActiveSession } from "@/lib/school";
import { formatMoney } from "@/lib/money";
import { RouteForm } from "@/components/transport-forms";
import { setRouteArchived } from "@/lib/actions/transport-actions";

export const metadata: Metadata = { title: "Transport" };

export default async function TransportPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; archived?: string }>;
}) {
  const user = await requirePermission("transport", "view");
  const sp = await searchParams;
  const showArchived = sp.archived === "1";
  const session = await getActiveSession();
  const [mayCreate, mayArchive] = await Promise.all([
    can(user.role, "transport", "create"),
    can(user.role, "transport", "archive"),
  ]);

  const routes = await db.transportRoute.findMany({
    where: { archived: showArchived },
    include: {
      stages: { orderBy: { position: "asc" } },
      vehicles: { where: { archived: false } },
      _count: { select: { assignments: session ? { where: { sessionId: session.id } } : true } },
      feeItems: { where: { archived: false, ...(session ? { sessionId: session.id } : {}) } },
    },
    orderBy: { name: "asc" },
  });

  const riders = routes.reduce((s, r) => s + r._count.assignments, 0);
  const seats = routes.reduce(
    (s, r) => s + r.vehicles.reduce((t, v) => t + v.capacity, 0),
    0,
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink-900">Transport</h1>
          <p className="mt-1 text-sm">
            Routes the buses run, who rides them, and what that costs
            {session ? ` — ${session.name}` : ""}.
          </p>
        </div>
        <Link href="/transport/vehicles" className="btn btn-secondary">
          Vehicles &amp; drivers
        </Link>
      </div>

      {sp.error && (
        <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800">
          {sp.error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <span className="chip bg-paper-200 text-ink-700">
          Routes: <b className="ml-1 text-ink-900">{routes.length}</b>
        </span>
        <span className="chip bg-paper-200 text-ink-700">
          Pupils riding: <b className="ml-1 text-ink-900">{riders}</b>
        </span>
        <span className="chip bg-paper-200 text-ink-700">
          Seats available: <b className="ml-1 text-ink-900">{seats}</b>
        </span>
        {seats > 0 && riders > seats && (
          <span className="chip bg-danger-500/10 text-danger-500">
            Over capacity by {riders - seats}
          </span>
        )}
      </div>

      <div className="card overflow-x-auto">
        <table className="table-admin">
          <thead>
            <tr>
              <th>Route</th>
              <th>Area</th>
              <th>Stages</th>
              <th className="text-right">Riding</th>
              <th>Vehicles</th>
              <th className="text-right">Fee / year</th>
              {mayArchive && <th />}
            </tr>
          </thead>
          <tbody>
            {routes.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-ink-400">
                  {showArchived ? "No archived routes." : "No routes yet — add the first below."}
                </td>
              </tr>
            )}
            {routes.map((r) => {
              const yearly = r.feeItems.reduce((s, f) => s + f.amountCents, 0);
              const capacity = r.vehicles.reduce((s, v) => s + v.capacity, 0);
              return (
                <tr key={r.id}>
                  <td className="font-semibold text-ink-900">
                    <Link href={`/transport/${r.id}`} className="hover:underline">
                      {r.name}
                    </Link>
                  </td>
                  <td className="text-ink-500">{r.description ?? "—"}</td>
                  <td className="text-ink-500">{r.stages.length || "—"}</td>
                  <td className="text-right">
                    {r._count.assignments}
                    {capacity > 0 && (
                      <span className="text-ink-400"> / {capacity}</span>
                    )}
                  </td>
                  <td className="text-ink-500">
                    {r.vehicles.map((v) => v.registration).join(", ") || "—"}
                  </td>
                  <td className="text-right font-semibold">
                    {yearly > 0 ? formatMoney(yearly) : <span className="text-ink-300">not set</span>}
                  </td>
                  {mayArchive && (
                    <td className="text-right">
                      <form action={setRouteArchived}>
                        <input type="hidden" name="id" value={r.id} />
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
        href={showArchived ? "/transport" : "/transport?archived=1"}
        className="inline-block text-xs font-bold text-brand-600 hover:underline"
      >
        {showArchived ? "← Back to active routes" : "View archived routes"}
      </Link>

      {mayCreate && !showArchived && <RouteForm />}
    </div>
  );
}
