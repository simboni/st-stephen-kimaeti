"use client";

import { useActionState } from "react";
import {
  createComplaint,
  createEnquiry,
  type OfficeFormState,
} from "@/lib/actions/frontoffice-actions";

function ErrorNote({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p className="rounded-lg bg-brand-50 px-3.5 py-2.5 text-sm font-semibold text-brand-800">
      {error}
    </p>
  );
}

export function EnquiryLogForm() {
  const [state, action, pending] = useActionState<OfficeFormState, FormData>(createEnquiry, {});
  const v = state.values ?? {};

  return (
    <form action={action} className="card space-y-3 p-6">
      <h2 className="font-display text-base font-extrabold text-ink-900">Log an enquiry</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input key={v.name ?? "n"} name="name" defaultValue={v.name ?? ""} placeholder="Name *" className="field !py-2 text-sm" aria-label="Enquirer name" />
        <input key={v.phone ?? "p"} name="phone" defaultValue={v.phone ?? ""} placeholder="Phone" className="field !py-2 text-sm" aria-label="Enquirer phone" />
        <input key={v.email ?? "e"} name="email" defaultValue={v.email ?? ""} placeholder="Email" className="field !py-2 text-sm" aria-label="Enquirer email" />
        <input key={v.subject ?? "s"} name="subject" defaultValue={v.subject ?? ""} placeholder="Class / topic" className="field !py-2 text-sm" aria-label="Enquiry subject" />
      </div>
      <textarea key={v.message ?? "m"} name="message" defaultValue={v.message ?? ""} rows={2} placeholder="What did they ask? *" className="field !py-2 text-sm" aria-label="Enquiry message" />
      <ErrorNote error={state.error} />
      <button type="submit" disabled={pending} className="btn btn-primary !py-2 text-xs">
        {pending ? "Saving…" : "Log enquiry"}
      </button>
    </form>
  );
}

export function ComplaintLogForm() {
  const [state, action, pending] = useActionState<OfficeFormState, FormData>(createComplaint, {});
  const v = state.values ?? {};

  return (
    <form action={action} className="card space-y-3 p-6">
      <h2 className="font-display text-base font-extrabold text-ink-900">
        Log a walk-in / phone complaint
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <input key={v.name ?? "n"} name="name" defaultValue={v.name ?? ""} placeholder="Name *" className="field !py-2 text-sm" aria-label="Complainant name" />
        <input key={v.phone ?? "p"} name="phone" defaultValue={v.phone ?? ""} placeholder="Phone" className="field !py-2 text-sm" aria-label="Complainant phone" />
        <input key={v.subject ?? "s"} name="subject" defaultValue={v.subject ?? ""} placeholder="Subject" className="field !py-2 text-sm" aria-label="Complaint subject" />
      </div>
      <textarea key={v.message ?? "m"} name="message" defaultValue={v.message ?? ""} rows={2} placeholder="What happened? *" className="field !py-2 text-sm" aria-label="Complaint message" />
      <ErrorNote error={state.error} />
      <button type="submit" disabled={pending} className="btn btn-primary !py-2 text-xs">
        {pending ? "Saving…" : "Log complaint"}
      </button>
    </form>
  );
}
