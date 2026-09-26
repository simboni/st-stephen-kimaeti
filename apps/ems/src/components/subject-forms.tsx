"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createSubject, type SubjectFormState } from "@/lib/actions/subjects-actions";

export function CreateSubjectForm() {
  const [state, action, pending] = useActionState<SubjectFormState, FormData>(createSubject, {});

  return (
    <form action={action} className="card max-w-xl space-y-5 p-6 sm:p-8">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-bold text-ink-900">
            Subject name *
          </label>
          <input
            key={state.values?.name ?? "n"}
            id="name"
            name="name"
            defaultValue={state.values?.name ?? ""}
            placeholder="e.g. Mathematics"
            className="field"
          />
        </div>
        <div>
          <label htmlFor="code" className="mb-1.5 block text-sm font-bold text-ink-900">
            Short code
          </label>
          <input
            key={state.values?.code ?? "c"}
            id="code"
            name="code"
            defaultValue={state.values?.code ?? ""}
            placeholder="e.g. MATH"
            className="field"
          />
        </div>
        <div>
          <label htmlFor="type" className="mb-1.5 block text-sm font-bold text-ink-900">
            Type
          </label>
          <select
            key={state.values?.type ?? "t"}
            id="type"
            name="type"
            defaultValue={state.values?.type ?? "CORE"}
            className="field"
          >
            <option value="CORE">Core</option>
            <option value="OPTIONAL">Optional</option>
          </select>
        </div>
      </div>

      {state.error && (
        <p className="rounded-lg bg-brand-50 px-3.5 py-2.5 text-sm font-semibold text-brand-800">
          {state.error}
        </p>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Creating…" : "Create subject"}
        </button>
        <Link href="/academics/subjects" className="btn btn-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}
