"use client";

import { useActionState } from "react";
import {
  createRoute,
  saveVehicle,
  type TransportFormState,
} from "@/lib/actions/transport-actions";

function ErrorNote({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p className="rounded-lg bg-brand-50 px-3.5 py-2.5 text-sm font-semibold text-brand-800">
      {error}
    </p>
  );
}

export function RouteForm() {
  const [state, action, pending] = useActionState<TransportFormState, FormData>(createRoute, {});
  const v = state.values ?? {};

  return (
    <form action={action} className="card space-y-4 p-6">
      <h2 className="font-display text-base font-extrabold text-ink-900">Add a route</h2>
      <ErrorNote error={state.error} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="name" className="mb-1 block text-xs font-bold text-ink-400">
            Route name *
          </label>
          <input
            key={v.name ?? "n"}
            id="name"
            name="name"
            defaultValue={v.name ?? ""}
            placeholder="e.g. Kimaeti – Malakisi"
            className="field !py-2 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="description" className="mb-1 block text-xs font-bold text-ink-400">
            Area covered
          </label>
          <input
            key={v.description ?? "d"}
            id="description"
            name="description"
            defaultValue={v.description ?? ""}
            placeholder="Villages and landmarks along the way"
            className="field !py-2 text-sm"
          />
        </div>
      </div>
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Adding…" : "Add route"}
      </button>
    </form>
  );
}

export function VehicleForm({
  routes,
  vehicle,
}: {
  routes: { id: string; name: string }[];
  vehicle?: {
    id: string;
    registration: string;
    make: string | null;
    capacity: number;
    routeId: string | null;
    driverName: string | null;
    driverPhone: string | null;
    driverLicence: string | null;
    insuranceExpiry: string | null;
    inspectionExpiry: string | null;
  };
}) {
  const [state, action, pending] = useActionState<TransportFormState, FormData>(saveVehicle, {});
  const v = state.values ?? {};
  const val = (k: keyof NonNullable<typeof vehicle>, fallback = "") =>
    v[k] ?? (vehicle ? String(vehicle[k] ?? "") : fallback);

  return (
    <form action={action} className="card space-y-4 p-6">
      <h2 className="font-display text-base font-extrabold text-ink-900">
        {vehicle ? "Edit vehicle" : "Add a vehicle"}
      </h2>
      <ErrorNote error={state.error} />
      {vehicle && <input type="hidden" name="id" value={vehicle.id} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="registration" className="mb-1 block text-xs font-bold text-ink-400">
            Registration *
          </label>
          <input
            key={val("registration")}
            id="registration"
            name="registration"
            defaultValue={val("registration")}
            placeholder="KDA 123X"
            className="field !py-2 text-sm uppercase"
          />
        </div>
        <div>
          <label htmlFor="make" className="mb-1 block text-xs font-bold text-ink-400">
            Make / model
          </label>
          <input
            key={val("make")}
            id="make"
            name="make"
            defaultValue={val("make")}
            placeholder="Toyota Coaster"
            className="field !py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="capacity" className="mb-1 block text-xs font-bold text-ink-400">
            Seats *
          </label>
          <input
            key={val("capacity")}
            id="capacity"
            name="capacity"
            defaultValue={val("capacity")}
            inputMode="numeric"
            placeholder="33"
            className="field !py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="routeId" className="mb-1 block text-xs font-bold text-ink-400">
            Route
          </label>
          <select
            key={val("routeId")}
            id="routeId"
            name="routeId"
            defaultValue={val("routeId")}
            className="field !py-2 text-sm"
          >
            <option value="">Not assigned</option>
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label htmlFor="driverName" className="mb-1 block text-xs font-bold text-ink-400">
            Driver
          </label>
          <input
            key={val("driverName")}
            id="driverName"
            name="driverName"
            defaultValue={val("driverName")}
            className="field !py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="driverPhone" className="mb-1 block text-xs font-bold text-ink-400">
            Driver phone
          </label>
          <input
            key={val("driverPhone")}
            id="driverPhone"
            name="driverPhone"
            defaultValue={val("driverPhone")}
            placeholder="07xx xxx xxx"
            className="field !py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="driverLicence" className="mb-1 block text-xs font-bold text-ink-400">
            Licence no.
          </label>
          <input
            key={val("driverLicence")}
            id="driverLicence"
            name="driverLicence"
            defaultValue={val("driverLicence")}
            className="field !py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="insuranceExpiry" className="mb-1 block text-xs font-bold text-ink-400">
            Insurance expires
          </label>
          <input
            key={val("insuranceExpiry")}
            id="insuranceExpiry"
            name="insuranceExpiry"
            type="date"
            defaultValue={val("insuranceExpiry")}
            className="field !py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="inspectionExpiry" className="mb-1 block text-xs font-bold text-ink-400">
            Inspection expires
          </label>
          <input
            key={val("inspectionExpiry")}
            id="inspectionExpiry"
            name="inspectionExpiry"
            type="date"
            defaultValue={val("inspectionExpiry")}
            className="field !py-2 text-sm"
          />
        </div>
      </div>

      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Saving…" : vehicle ? "Save changes" : "Add vehicle"}
      </button>
    </form>
  );
}
