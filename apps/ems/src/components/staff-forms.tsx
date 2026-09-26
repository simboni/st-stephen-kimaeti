"use client";

import { useActionState } from "react";
import {
  applyLeave,
  createStaff,
  updateStaff,
  type StaffFormState,
} from "@/lib/actions/staff-actions";

function ErrorNote({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p className="rounded-lg bg-brand-50 px-3.5 py-2.5 text-sm font-semibold text-brand-800">
      {error}
    </p>
  );
}

type StaffDefaults = {
  id?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  designation?: string;
  department?: string;
  qualification?: string;
  phone?: string;
  email?: string;
  joinedAt?: string;
};

/** Create or edit a staff profile — pass `staff` with an id to edit. */
export function StaffForm({ staff }: { staff?: StaffDefaults }) {
  const editing = !!staff?.id;
  const [state, action, pending] = useActionState<StaffFormState, FormData>(
    editing ? updateStaff : createStaff,
    {},
  );
  const v = { ...staff, ...(state.values ?? {}) };

  const text = (
    name: keyof StaffDefaults,
    label: string,
    placeholder: string,
    type: "text" | "date" = "text",
  ) => (
    <div>
      <label htmlFor={name} className="mb-1 block text-xs font-bold text-ink-400">
        {label}
      </label>
      <input
        key={`${name}-${v[name] ?? ""}`}
        id={name}
        name={name}
        type={type}
        defaultValue={v[name] ?? ""}
        placeholder={placeholder}
        className="field !py-2 text-sm"
      />
    </div>
  );

  return (
    <form action={action} className="card space-y-4 p-6">
      {editing && <input type="hidden" name="id" value={staff!.id} />}
      <h2 className="font-display text-base font-extrabold text-ink-900">
        {editing ? "Edit profile" : "New staff member"}
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {text("firstName", "First name *", "e.g. Margaret")}
        {text("lastName", "Last name *", "e.g. Wanjiru")}
        <div>
          <label htmlFor="gender" className="mb-1 block text-xs font-bold text-ink-400">
            Gender *
          </label>
          <select key={v.gender ?? "g"} id="gender" name="gender" defaultValue={v.gender ?? ""} className="field !py-2 text-sm">
            <option value="" disabled>
              Choose…
            </option>
            <option value="FEMALE">Female</option>
            <option value="MALE">Male</option>
          </select>
        </div>
        {text("designation", "Designation *", "e.g. Teacher")}
        {text("department", "Department", "e.g. Academics")}
        {text("qualification", "Qualification", "e.g. B.Ed")}
        {text("phone", "Phone", "07xx xxx xxx")}
        {text("email", "Email", "name@school.com")}
        {text("joinedAt", "Date joined", "", "date")}
      </div>
      <ErrorNote error={state.error} />
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Saving…" : editing ? "Save changes" : "Add staff member"}
      </button>
    </form>
  );
}

/** File a leave request — used by HR (staff picker) and self-service (fixed staffId). */
export function LeaveApplyForm({
  staffOptions,
  fixedStaffId,
  leaveTypes,
}: {
  staffOptions?: { id: string; label: string }[];
  fixedStaffId?: string;
  leaveTypes: { id: string; name: string; daysPerYear: number }[];
}) {
  const [state, action, pending] = useActionState<StaffFormState, FormData>(applyLeave, {});
  const v = state.values ?? {};

  return (
    <form action={action} className="card space-y-4 p-6">
      <h2 className="font-display text-base font-extrabold text-ink-900">Apply for leave</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {fixedStaffId ? (
          <input type="hidden" name="staffId" value={fixedStaffId} />
        ) : (
          <div>
            <label htmlFor="staffId" className="mb-1 block text-xs font-bold text-ink-400">
              Staff member *
            </label>
            <select key={v.staffId ?? "s"} id="staffId" name="staffId" defaultValue={v.staffId ?? ""} className="field !py-2 text-sm">
              <option value="" disabled>
                Choose…
              </option>
              {(staffOptions ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="leaveTypeId" className="mb-1 block text-xs font-bold text-ink-400">
            Leave type *
          </label>
          <select key={v.leaveTypeId ?? "t"} id="leaveTypeId" name="leaveTypeId" defaultValue={v.leaveTypeId ?? ""} className="field !py-2 text-sm">
            <option value="" disabled>
              Choose…
            </option>
            {leaveTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.daysPerYear}/yr)
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="startDate" className="mb-1 block text-xs font-bold text-ink-400">
            First day *
          </label>
          <input key={v.startDate ?? "f"} id="startDate" name="startDate" type="date" defaultValue={v.startDate ?? ""} className="field !py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="endDate" className="mb-1 block text-xs font-bold text-ink-400">
            Last day *
          </label>
          <input key={v.endDate ?? "l"} id="endDate" name="endDate" type="date" defaultValue={v.endDate ?? ""} className="field !py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="reason" className="mb-1 block text-xs font-bold text-ink-400">
            Reason *
          </label>
          <input key={v.reason ?? "r"} id="reason" name="reason" defaultValue={v.reason ?? ""} placeholder="Short reason" className="field !py-2 text-sm" />
        </div>
      </div>
      <ErrorNote error={state.error} />
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Submitting…" : "Submit request"}
      </button>
      <p className="text-xs text-ink-400">
        Leave days count working days (Mon–Fri) only. Requests need approval before they
        take effect.
      </p>
    </form>
  );
}
