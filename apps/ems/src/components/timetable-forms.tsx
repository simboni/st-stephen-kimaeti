"use client";

import { useActionState } from "react";
import { addLesson, type TimetableFormState } from "@/lib/actions/timetable-actions";

const DAYS = [
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
];

export function AddLessonForm({
  streamId,
  streamLabel,
  subjects,
  teachers,
}: {
  streamId: string;
  streamLabel: string;
  subjects: { id: string; name: string }[];
  teachers: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState<TimetableFormState, FormData>(addLesson, {});

  return (
    <form action={action} className="card space-y-4 p-6">
      <h2 className="font-display text-base font-extrabold text-ink-900">
        Add lesson — {streamLabel}
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <input type="hidden" name="streamId" value={streamId} />
        <div>
          <label htmlFor="day" className="mb-1 block text-xs font-bold text-ink-400">
            Day
          </label>
          <select id="day" name="day" className="field !py-2 text-sm" defaultValue="1">
            {DAYS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="period" className="mb-1 block text-xs font-bold text-ink-400">
            Period
          </label>
          <select id="period" name="period" className="field !py-2 text-sm" defaultValue="1">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
              <option key={p} value={p}>
                Period {p}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="subjectId" className="mb-1 block text-xs font-bold text-ink-400">
            Subject
          </label>
          <select id="subjectId" name="subjectId" className="field !py-2 text-sm" defaultValue="">
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
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="teacherId" className="mb-1 block text-xs font-bold text-ink-400">
            Teacher
          </label>
          <select id="teacherId" name="teacherId" className="field !py-2 text-sm" defaultValue="">
            <option value="">— none —</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="room" className="mb-1 block text-xs font-bold text-ink-400">
            Room
          </label>
          <input id="room" name="room" placeholder="Optional" className="field !py-2 text-sm" />
        </div>
        <div className="flex items-end">
          <button type="submit" disabled={pending} className="btn btn-primary w-full !py-2">
            {pending ? "Adding…" : "Add"}
          </button>
        </div>
      </div>

      {state.error && (
        <p className="rounded-lg bg-brand-50 px-3.5 py-2.5 text-sm font-semibold text-brand-800">
          {state.error}
        </p>
      )}
      {state.added && (
        <p className="rounded-lg bg-leaf-500/10 px-3.5 py-2.5 text-sm font-semibold text-leaf-600">
          {state.added}
        </p>
      )}
    </form>
  );
}
