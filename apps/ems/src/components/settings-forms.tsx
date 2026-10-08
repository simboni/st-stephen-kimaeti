"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  createSession,
  removeSchoolLogo,
  updateSchoolLogo,
  updateSchoolSettings,
  updateTermDates,
  type SessionFormState,
  type SettingsFormState,
} from "@/lib/actions/settings-actions";

export function SchoolLogoForm({
  logoSrc,
  hasCustomLogo,
  canEdit,
}: {
  logoSrc: string;
  hasCustomLogo: boolean;
  canEdit: boolean;
}) {
  const [state, action, pending] = useActionState<SettingsFormState, FormData>(
    updateSchoolLogo,
    {},
  );

  return (
    <div className="card max-w-2xl p-6 sm:p-8">
      <h2 className="font-display text-lg font-extrabold text-ink-900">School logo</h2>
      <p className="mt-1 text-sm">
        Shown on the sign-in page, the sidebar, and every printed document. PNG, JPG or
        WebP, up to 1&nbsp;MB — a square image works best.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoSrc}
          alt="Current school logo"
          className="h-24 w-24 rounded-full border border-paper-300 bg-white object-contain p-1"
        />
        {canEdit && (
          <div className="min-w-64 flex-1 space-y-4">
            <form action={action} className="space-y-3">
              <input
                type="file"
                name="logo"
                accept="image/png,image/jpeg,image/webp"
                className="block w-full text-sm text-ink-500 file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-bold file:text-brand-700 hover:file:bg-brand-100"
                aria-label="Choose logo image"
              />
              <div className="flex flex-wrap gap-3">
                <button type="submit" disabled={pending} className="btn btn-primary">
                  {pending ? "Uploading…" : "Upload logo"}
                </button>
                {hasCustomLogo && (
                  <button formAction={removeSchoolLogo} className="btn btn-danger" formNoValidate>
                    Remove &amp; use default
                  </button>
                )}
              </div>
            </form>
            <ErrorNote error={state.error} />
            {state.saved && (
              <p className="rounded-lg bg-leaf-500/10 px-3.5 py-2.5 text-sm font-semibold text-leaf-600">
                Logo updated — it now appears across the system.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ErrorNote({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p className="rounded-lg bg-brand-50 px-3.5 py-2.5 text-sm font-semibold text-brand-800">
      {error}
    </p>
  );
}

export function SchoolSettingsForm({
  settings,
  canEdit,
}: {
  settings: {
    name: string;
    shortName: string;
    motto: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    currency: string;
    admissionPrefix: string;
    timezone: string;
  };
  canEdit: boolean;
}) {
  const [state, action, pending] = useActionState<SettingsFormState, FormData>(
    updateSchoolSettings,
    {},
  );

  const dis = !canEdit;

  return (
    <form action={action} className="card max-w-2xl space-y-5 p-6 sm:p-8">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="name" className="mb-1.5 block text-sm font-bold text-ink-900">
            School name *
          </label>
          <input id="name" name="name" defaultValue={state.values?.name ?? settings.name} className="field" disabled={dis} />
        </div>
        <div>
          <label htmlFor="shortName" className="mb-1.5 block text-sm font-bold text-ink-900">
            Short name *
          </label>
          <input id="shortName" name="shortName" defaultValue={state.values?.shortName ?? settings.shortName} className="field" disabled={dis} />
        </div>
        <div>
          <label htmlFor="motto" className="mb-1.5 block text-sm font-bold text-ink-900">
            Motto
          </label>
          <input id="motto" name="motto" defaultValue={state.values?.motto ?? settings.motto ?? ""} className="field" disabled={dis} />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-bold text-ink-900">
            Email
          </label>
          <input id="email" name="email" type="email" defaultValue={state.values?.email ?? settings.email ?? ""} className="field" disabled={dis} />
        </div>
        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-bold text-ink-900">
            Phone
          </label>
          <input id="phone" name="phone" defaultValue={state.values?.phone ?? settings.phone ?? ""} className="field" disabled={dis} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="address" className="mb-1.5 block text-sm font-bold text-ink-900">
            Postal address
          </label>
          <input id="address" name="address" defaultValue={state.values?.address ?? settings.address ?? ""} className="field" disabled={dis} />
        </div>
        <div>
          <label htmlFor="currency" className="mb-1.5 block text-sm font-bold text-ink-900">
            Currency code
          </label>
          <input id="currency" name="currency" defaultValue={state.values?.currency ?? settings.currency} className="field" disabled={dis} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-bold text-ink-900">Timezone</label>
          <input value={settings.timezone} disabled className="field opacity-60" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="admissionPrefix" className="mb-1.5 block text-sm font-bold text-ink-900">
            Admission number prefix *
          </label>
          <input
            id="admissionPrefix"
            name="admissionPrefix"
            defaultValue={state.values?.admissionPrefix ?? settings.admissionPrefix}
            className="field"
            disabled={dis}
          />
          <p className="mt-1.5 text-xs text-ink-500">
            The school&rsquo;s initials, which begin every admission number — e.g.{" "}
            <b>SSK</b> gives SSK-260041. Changing it does not renumber anyone; only pupils
            admitted from now on get the new prefix.
          </p>
        </div>
      </div>

      <ErrorNote error={state.error} />
      {state.saved && (
        <p className="rounded-lg bg-leaf-500/10 px-3.5 py-2.5 text-sm font-semibold text-leaf-600">
          Settings saved.
        </p>
      )}

      {canEdit && (
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Saving…" : "Save settings"}
        </button>
      )}
    </form>
  );
}

function TermDateFields({
  defaults,
  values,
}: {
  defaults?: { number: number; start: string; end: string }[];
  /** Echoed submission values — win over defaults after a failed submit. */
  values?: Record<string, string>;
}) {
  const base = defaults ?? [1, 2, 3].map((n) => ({ number: n, start: "", end: "" }));
  const rows = base.map((t) => ({
    number: t.number,
    start: values?.[`term${t.number}Start`] ?? t.start,
    end: values?.[`term${t.number}End`] ?? t.end,
  }));
  return (
    <div className="space-y-3">
      {rows.map((t) => (
        <div key={t.number} className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[5.5rem_1fr_1fr]">
          <span className="text-sm font-bold text-ink-900">Term {t.number}</span>
          <input
            key={`s${t.number}-${t.start}`}
            type="date"
            name={`term${t.number}Start`}
            defaultValue={t.start}
            className="field"
            aria-label={`Term ${t.number} start date`}
          />
          <input
            key={`e${t.number}-${t.end}`}
            type="date"
            name={`term${t.number}End`}
            defaultValue={t.end}
            className="field"
            aria-label={`Term ${t.number} end date`}
          />
        </div>
      ))}
    </div>
  );
}

export function CreateSessionForm() {
  const [state, action, pending] = useActionState<SessionFormState, FormData>(createSession, {});
  return (
    <form action={action} className="card max-w-xl space-y-5 p-6 sm:p-8">
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-bold text-ink-900">
          Session name *
        </label>
        <input key={state.values?.name ?? "new"} id="name" name="name" defaultValue={state.values?.name ?? ""} placeholder="e.g. 2026-2027" className="field" />
      </div>
      <div>
        <p className="mb-2 text-sm font-bold text-ink-900">Term dates *</p>
        <TermDateFields values={state.values} />
      </div>
      <ErrorNote error={state.error} />
      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Creating…" : "Create session"}
        </button>
        <Link href="/settings/sessions" className="btn btn-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}

export function EditTermsForm({
  sessionId,
  terms,
}: {
  sessionId: string;
  terms: { number: number; start: string; end: string }[];
}) {
  const [state, action, pending] = useActionState<SessionFormState, FormData>(updateTermDates, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="sessionId" value={sessionId} />
      <TermDateFields defaults={terms} values={state.values} />
      <ErrorNote error={state.error} />
      <button type="submit" disabled={pending} className="btn btn-secondary">
        {pending ? "Saving…" : "Save term dates"}
      </button>
    </form>
  );
}
