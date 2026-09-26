"use client";

import { useActionState } from "react";
import {
  createEvent,
  createNotice,
  type CommFormState,
} from "@/lib/actions/communication-actions";

function ErrorNote({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p className="rounded-lg bg-brand-50 px-3.5 py-2.5 text-sm font-semibold text-brand-800">
      {error}
    </p>
  );
}

const AUDIENCES = [
  ["ALL", "Everyone"],
  ["STAFF", "Staff only"],
  ["PARENTS", "Parents only"],
  ["STUDENTS", "Pupils only"],
] as const;

export function NoticeForm() {
  const [state, action, pending] = useActionState<CommFormState, FormData>(createNotice, {});
  const v = state.values ?? {};

  return (
    <form action={action} className="card space-y-3 p-6">
      <h2 className="font-display text-base font-extrabold text-ink-900">Post a notice</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label htmlFor="title" className="mb-1 block text-xs font-bold text-ink-400">
            Title *
          </label>
          <input key={v.title ?? "t"} id="title" name="title" defaultValue={v.title ?? ""} placeholder="e.g. Mid-term break dates" className="field !py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="audience" className="mb-1 block text-xs font-bold text-ink-400">
            Audience *
          </label>
          <select key={v.audience ?? "a"} id="audience" name="audience" defaultValue={v.audience ?? "ALL"} className="field !py-2 text-sm">
            {AUDIENCES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="body" className="mb-1 block text-xs font-bold text-ink-400">
          Notice text *
        </label>
        <textarea key={v.body ?? "b"} id="body" name="body" defaultValue={v.body ?? ""} rows={3} placeholder="What should people know?" className="field !py-2 text-sm" />
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="expiresAt" className="mb-1 block text-xs font-bold text-ink-400">
            Expires (optional)
          </label>
          <input key={v.expiresAt ?? "e"} id="expiresAt" name="expiresAt" type="date" defaultValue={v.expiresAt ?? ""} className="field !py-2 text-sm" />
        </div>
        <button type="submit" disabled={pending} className="btn btn-primary !py-2">
          {pending ? "Posting…" : "Post notice"}
        </button>
      </div>
      <ErrorNote error={state.error} />
    </form>
  );
}

export function EventForm() {
  const [state, action, pending] = useActionState<CommFormState, FormData>(createEvent, {});
  const v = state.values ?? {};

  return (
    <form action={action} className="card space-y-3 p-6">
      <h2 className="font-display text-base font-extrabold text-ink-900">Add a calendar event</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <label htmlFor="ev-title" className="mb-1 block text-xs font-bold text-ink-400">
            Event *
          </label>
          <input key={v.title ?? "t"} id="ev-title" name="title" defaultValue={v.title ?? ""} placeholder="e.g. Sports Day" className="field !py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="ev-date" className="mb-1 block text-xs font-bold text-ink-400">
            Date *
          </label>
          <input key={v.date ?? "d"} id="ev-date" name="date" type="date" defaultValue={v.date ?? ""} className="field !py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="ev-end" className="mb-1 block text-xs font-bold text-ink-400">
            Ends (optional)
          </label>
          <input key={v.endDate ?? "e"} id="ev-end" name="endDate" type="date" defaultValue={v.endDate ?? ""} className="field !py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="ev-audience" className="mb-1 block text-xs font-bold text-ink-400">
            Audience *
          </label>
          <select key={v.audience ?? "a"} id="ev-audience" name="audience" defaultValue={v.audience ?? "ALL"} className="field !py-2 text-sm">
            {AUDIENCES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-64 flex-1">
          <label htmlFor="ev-note" className="mb-1 block text-xs font-bold text-ink-400">
            Note (optional)
          </label>
          <input key={v.note ?? "n"} id="ev-note" name="note" defaultValue={v.note ?? ""} placeholder="Details" className="field !py-2 text-sm" />
        </div>
        <button type="submit" disabled={pending} className="btn btn-primary !py-2">
          {pending ? "Adding…" : "Add event"}
        </button>
      </div>
      <ErrorNote error={state.error} />
    </form>
  );
}
