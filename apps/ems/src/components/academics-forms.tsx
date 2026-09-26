"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createClass, type ClassFormState } from "@/lib/actions/academics-actions";

const STAGES = [
  { value: "INFANT", label: "Infant School (Playgroup–PP2)" },
  { value: "PRIMARY", label: "Primary School (Grade 1–6)" },
  { value: "JUNIOR", label: "Junior School (Grade 7–9)" },
];

export function CreateClassForm({ suggestedLevel }: { suggestedLevel: number }) {
  const [state, action, pending] = useActionState<ClassFormState, FormData>(createClass, {});

  return (
    <form action={action} className="card max-w-xl space-y-5 p-6 sm:p-8">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-bold text-ink-900">
            Class name *
          </label>
          <input
            key={state.values?.name ?? "n"}
            id="name"
            name="name"
            defaultValue={state.values?.name ?? ""}
            placeholder="e.g. Grade 4"
            className="field"
          />
        </div>
        <div>
          <label htmlFor="stage" className="mb-1.5 block text-sm font-bold text-ink-900">
            Stage *
          </label>
          <select
            key={state.values?.stage ?? "s"}
            id="stage"
            name="stage"
            defaultValue={state.values?.stage ?? ""}
            className="field"
          >
            <option value="" disabled>
              Choose…
            </option>
            {STAGES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="level" className="mb-1.5 block text-sm font-bold text-ink-900">
            Level (ordering) *
          </label>
          <input
            key={state.values?.level ?? "l"}
            id="level"
            name="level"
            type="number"
            min={0}
            defaultValue={state.values?.level ?? String(suggestedLevel)}
            className="field"
          />
          <p className="mt-1 text-xs text-ink-400">0 = youngest class; orders lists and promotion.</p>
        </div>
        <div>
          <label htmlFor="firstStream" className="mb-1.5 block text-sm font-bold text-ink-900">
            First stream
          </label>
          <input
            key={state.values?.firstStream ?? "f"}
            id="firstStream"
            name="firstStream"
            defaultValue={state.values?.firstStream ?? "A"}
            className="field"
          />
        </div>
      </div>

      {state.error && (
        <p className="rounded-lg bg-brand-50 px-3.5 py-2.5 text-sm font-semibold text-brand-800">
          {state.error}
        </p>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Creating…" : "Create class"}
        </button>
        <Link href="/academics/classes" className="btn btn-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}

/** Teacher dropdown that submits on change — one tap to assign. */
export function AssignTeacherSelect({
  streamId,
  current,
  teachers,
  action,
  extra,
}: {
  streamId: string;
  current: string;
  teachers: { id: string; name: string }[];
  action: (formData: FormData) => void;
  /** Additional hidden fields, e.g. { subjectId } for subject teachers. */
  extra?: Record<string, string>;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="streamId" value={streamId} />
      {Object.entries(extra ?? {}).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <select
        name="teacherId"
        defaultValue={current}
        className="field !w-52 !py-1.5 text-sm"
        aria-label="Class teacher"
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        <option value="">— No class teacher —</option>
        {teachers.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </form>
  );
}
