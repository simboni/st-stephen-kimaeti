"use client";

import { useActionState } from "react";
import { createExam, type ExamFormState } from "@/lib/actions/exams-actions";

function ErrorNote({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p className="rounded-lg bg-brand-50 px-3.5 py-2.5 text-sm font-semibold text-brand-800">
      {error}
    </p>
  );
}

export function ExamForm({ terms }: { terms: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<ExamFormState, FormData>(createExam, {});
  const v = state.values ?? {};

  return (
    <form action={action} className="card space-y-4 p-6">
      <h2 className="font-display text-base font-extrabold text-ink-900">
        Create an exam (active session)
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-xs font-bold text-ink-400">
            Exam name *
          </label>
          <input key={v.name ?? "n"} id="name" name="name" defaultValue={v.name ?? ""} placeholder="e.g. End-Term 1 Exam" className="field !py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="termId" className="mb-1 block text-xs font-bold text-ink-400">
            Term *
          </label>
          <select key={v.termId ?? "t"} id="termId" name="termId" defaultValue={v.termId ?? ""} className="field !py-2 text-sm">
            <option value="" disabled>
              Choose…
            </option>
            {terms.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="maxMarks" className="mb-1 block text-xs font-bold text-ink-400">
            Marked out of *
          </label>
          <input key={v.maxMarks ?? "m"} id="maxMarks" name="maxMarks" defaultValue={v.maxMarks ?? "100"} className="field !py-2 text-sm" inputMode="numeric" />
        </div>
        <div className="flex items-end">
          <button type="submit" disabled={pending} className="btn btn-primary w-full !py-2">
            {pending ? "Creating…" : "Create exam"}
          </button>
        </div>
      </div>
      <ErrorNote error={state.error} />
    </form>
  );
}
