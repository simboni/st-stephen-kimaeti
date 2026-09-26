"use client";

import { useActionState } from "react";
import { createHostel, type BoardingFormState } from "@/lib/actions/boarding-actions";

export function HostelForm({ staff }: { staff: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<BoardingFormState, FormData>(createHostel, {});
  const v = state.values ?? {};

  return (
    <form action={action} className="card space-y-4 p-6">
      <h2 className="font-display text-base font-extrabold text-ink-900">Add a dormitory</h2>
      {state.error && (
        <p className="rounded-lg bg-brand-50 px-3.5 py-2.5 text-sm font-semibold text-brand-800">
          {state.error}
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="name" className="mb-1 block text-xs font-bold text-ink-400">
            Name *
          </label>
          <input
            key={v.name ?? "n"}
            id="name"
            name="name"
            defaultValue={v.name ?? ""}
            placeholder="e.g. St Charles"
            className="field !py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="gender" className="mb-1 block text-xs font-bold text-ink-400">
            Houses *
          </label>
          <select
            key={v.gender ?? "g"}
            id="gender"
            name="gender"
            defaultValue={v.gender ?? ""}
            className="field !py-2 text-sm"
          >
            <option value="">Choose…</option>
            <option value="MALE">Boys</option>
            <option value="FEMALE">Girls</option>
          </select>
        </div>
        <div>
          <label htmlFor="wardenId" className="mb-1 block text-xs font-bold text-ink-400">
            Matron / master
          </label>
          <select
            key={v.wardenId ?? "w"}
            id="wardenId"
            name="wardenId"
            defaultValue={v.wardenId ?? ""}
            className="field !py-2 text-sm"
          >
            <option value="">Not assigned</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Adding…" : "Add dormitory"}
      </button>
    </form>
  );
}
