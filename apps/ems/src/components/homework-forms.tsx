"use client";

import { useActionState } from "react";
import { createHomework, type HomeworkFormState } from "@/lib/actions/homework-actions";

function ErrorNote({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p className="rounded-lg bg-brand-50 px-3.5 py-2.5 text-sm font-semibold text-brand-800">
      {error}
    </p>
  );
}

/** Post homework for the selected stream — subjects come pre-filtered
 *  to that stream's class (the page re-renders them per GET selection). */
export function HomeworkForm({
  streamId,
  streamLabel,
  subjects,
}: {
  streamId: string;
  streamLabel: string;
  subjects: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState<HomeworkFormState, FormData>(createHomework, {});
  const v = state.values ?? {};

  return (
    <form action={action} className="card space-y-3 p-6">
      <h2 className="font-display text-base font-extrabold text-ink-900">
        Post homework — {streamLabel}
      </h2>
      <input type="hidden" name="streamId" value={streamId} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="subjectId" className="mb-1 block text-xs font-bold text-ink-400">
            Subject *
          </label>
          <select key={v.subjectId ?? "s"} id="subjectId" name="subjectId" defaultValue={v.subjectId ?? ""} className="field !py-2 text-sm">
            <option value="" disabled>
              Choose…
            </option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="hw-title" className="mb-1 block text-xs font-bold text-ink-400">
            Title *
          </label>
          <input key={v.title ?? "t"} id="hw-title" name="title" defaultValue={v.title ?? ""} placeholder="e.g. Fractions worksheet" className="field !py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="dueDate" className="mb-1 block text-xs font-bold text-ink-400">
            Due date *
          </label>
          <input key={v.dueDate ?? "d"} id="dueDate" name="dueDate" type="date" defaultValue={v.dueDate ?? ""} className="field !py-2 text-sm" />
        </div>
      </div>
      <div>
        <label htmlFor="instructions" className="mb-1 block text-xs font-bold text-ink-400">
          Instructions *
        </label>
        <textarea key={v.instructions ?? "i"} id="instructions" name="instructions" defaultValue={v.instructions ?? ""} rows={2} placeholder="What should the pupils do?" className="field !py-2 text-sm" />
      </div>
      <ErrorNote error={state.error} />
      <button type="submit" disabled={pending} className="btn btn-primary !py-2">
        {pending ? "Posting…" : "Post homework"}
      </button>
    </form>
  );
}
