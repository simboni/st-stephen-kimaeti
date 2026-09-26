"use client";

import { useActionState } from "react";
import {
  applyStudentLeave,
  type StudentLeaveState,
} from "@/lib/actions/student-leave-actions";

export function StudentLeaveForm({
  pupils,
}: {
  pupils: { studentId: string; label: string }[];
}) {
  const [state, action, pending] = useActionState<StudentLeaveState, FormData>(
    applyStudentLeave,
    {},
  );
  const v = state.values ?? {};

  return (
    <form action={action} className="card space-y-4 p-6">
      <h2 className="font-display text-base font-extrabold text-ink-900">
        Request absence permission
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {pupils.length === 1 ? (
          <input type="hidden" name="studentId" value={pupils[0].studentId} />
        ) : (
          <div>
            <label htmlFor="studentId" className="mb-1 block text-xs font-bold text-ink-400">
              Child *
            </label>
            <select key={v.studentId ?? "s"} id="studentId" name="studentId" defaultValue={v.studentId ?? ""} className="field !py-2 text-sm">
              <option value="" disabled>
                Choose…
              </option>
              {pupils.map((c) => (
                <option key={c.studentId} value={c.studentId}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="startDate" className="mb-1 block text-xs font-bold text-ink-400">
            First day away *
          </label>
          <input key={v.startDate ?? "f"} id="startDate" name="startDate" type="date" defaultValue={v.startDate ?? ""} className="field !py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="endDate" className="mb-1 block text-xs font-bold text-ink-400">
            Last day away *
          </label>
          <input key={v.endDate ?? "l"} id="endDate" name="endDate" type="date" defaultValue={v.endDate ?? ""} className="field !py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="reason" className="mb-1 block text-xs font-bold text-ink-400">
            Reason *
          </label>
          <input key={v.reason ?? "r"} id="reason" name="reason" defaultValue={v.reason ?? ""} placeholder="e.g. Medical appointment" className="field !py-2 text-sm" />
        </div>
      </div>
      {state.error && (
        <p className="rounded-lg bg-brand-50 px-3.5 py-2.5 text-sm font-semibold text-brand-800">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Sending…" : "Send request"}
      </button>
      <p className="text-xs text-ink-400">
        The class teacher or school office reviews every request. Approved days are
        marked in the register as absence with permission.
      </p>
    </form>
  );
}
