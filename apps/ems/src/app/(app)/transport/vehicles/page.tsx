import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { can, requirePermission } from "@/lib/rbac";
import { ChevronLeftIcon } from "@/components/icons";
import { VehicleForm } from "@/components/transport-forms";
import { setVehicleArchived } from "@/lib/actions/transport-actions";

export const metadata: Metadata = { title: "Vehicles" };

function iso(d: Date | null) {
  return d ? d.toISOString().slice(0, 10) : null;
}

/** Days until a date, or null when there is no date. */
function daysUntil(d: Date | null) {
  if (!d) return null;
  return Math.round((d.getTime() - Date.now()) / 86_400_000);
}

function ExpiryCell({ date }: { date: Date | null }) {
  const days = daysUntil(date);
  if (days == null) return <span className="text-ink-300">—</span>;
  const label = date!.toISOString().slice(0, 10);
  if (days < 0)
    return <span className="chip bg-danger-500/10 text-danger-500">Expired {label}</span>;
  if (days <= 30)
    return <span className="chip bg-brand-50 text-brand-800">{days}d — {label}</span>;
  return <span className="text-ink-500">{label}</span>;
}

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; edit?: string; archived?: string }>;
}) {
  const user = await requirePermission("transport", "view");
  const sp = await searchParams;
  const showArchived = sp.archived === "1";
  const [mayCreate, mayArchive] = await Promise.all([
    can(user.role, "transport", "create"),
    can(user.role, "transport", "archive"),
  ]);

  const [vehicles, routes] = await Promise.all([
    db.vehicle.findMany({
      where: { archived: showArchived },
      include: { route: true },
      orderBy: { registration: "asc" },
    }),
    db.transportRoute.findMany({ where: { archived: false }, orderBy: { name: "asc" } }),
  ]);

  const editing = sp.edit ? vehicles.find((v) => v.id === sp.edit) : undefined;
  const expiring = vehicles.filter((v) => {
    const a = daysUntil(v.insuranceExpiry);
    const b = daysUntil(v.inspectionExpiry);
    return (a != null && a <= 30) || (b != null && b <= 30);
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Link
          href="/transport"
          className="mb-2 inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:underline"
        >
          <ChevronLeftIcon className="h-3.5 w-3.5" /> Transport
        </Link>
        <h1 className="font-display text-2xl font-extrabold text-ink-900">Vehicles &amp; drivers</h1>
        <p className="mt-1 text-sm">
          The buses, who drives them, and when their papers run out.
        </p>
      </div>

      {sp.saved && (
        <p className="rounded-xl bg-leaf-500/10 px-4 py-3 text-sm font-semibold text-leaf-700">
          Vehicle saved.
        </p>
      )}
      {expiring.length > 0 && !showArchived && (
        <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800">
          {expiring.length} vehicle{expiring.length === 1 ? " has" : "s have"} insurance or
          inspection expiring within 30 days: {expiring.map((v) => v.registration).join(", ")}.
        </p>
      )}

      <div className="card overflow-x-auto">
        <table className="table-admin">
          <thead>
            <tr>
              <th>Registration</th>
              <th>Make</th>
              <th className="text-right">Seats</th>
              <th>Route</th>
              <th>Driver</th>
              <th>Insurance</th>
              <th>Inspection</th>
              {mayArchive && <th />}
            </tr>
          </thead>
          <tbody>
            {vehicles.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-ink-400">
                  {showArchived ? "No retired vehicles." : "No vehicles yet."}
                </td>
              </tr>
            )}
            {vehicles.map((v) => (
              <tr key={v.id}>
                <td className="whitespace-nowrap font-mono text-xs font-bold">
                  {mayCreate && !showArchived ? (
                    <Link href={`/transport/vehicles?edit=${v.id}`} className="hover:underline">
                      {v.registration}
                    </Link>
                  ) : (
                    v.registration
                  )}
                </td>
                <td className="text-ink-500">{v.make ?? "—"}</td>
                <td className="text-right">{v.capacity}</td>
                <td className="text-ink-500">{v.route?.name ?? "—"}</td>
                <td className="text-ink-500">
                  {v.driverName ?? "—"}
                  {v.driverPhone && <span className="block text-xs">{v.driverPhone}</span>}
                </td>
                <td><ExpiryCell date={v.insuranceExpiry} /></td>
                <td><ExpiryCell date={v.inspectionExpiry} /></td>
                {mayArchive && (
                  <td className="text-right">
                    <form action={setVehicleArchived}>
                      <input type="hidden" name="id" value={v.id} />
                      <input type="hidden" name="archived" value={showArchived ? "false" : "true"} />
                      <button type="submit" className="btn btn-secondary !px-3 !py-1.5 text-xs">
                        {showArchived ? "Return" : "Retire"}
                      </button>
                    </form>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Link
        href={showArchived ? "/transport/vehicles" : "/transport/vehicles?archived=1"}
        className="inline-block text-xs font-bold text-brand-600 hover:underline"
      >
        {showArchived ? "← Back to active vehicles" : "View retired vehicles"}
      </Link>

      {mayCreate && !showArchived && (
        <VehicleForm
          routes={routes}
          vehicle={
            editing
              ? {
                  id: editing.id,
                  registration: editing.registration,
                  make: editing.make,
                  capacity: editing.capacity,
                  routeId: editing.routeId,
                  driverName: editing.driverName,
                  driverPhone: editing.driverPhone,
                  driverLicence: editing.driverLicence,
                  insuranceExpiry: iso(editing.insuranceExpiry),
                  inspectionExpiry: iso(editing.inspectionExpiry),
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
