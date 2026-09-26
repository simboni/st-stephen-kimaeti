"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  admitStudent,
  updateStudent,
  type StudentFormState,
} from "@/lib/actions/student-actions";

type StreamOption = { id: string; label: string };

function ErrorNote({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p className="rounded-lg bg-brand-50 px-3.5 py-2.5 text-sm font-semibold text-brand-800">
      {error}
    </p>
  );
}

function Field({
  label,
  children,
  span = false,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  span?: boolean;
}) {
  return (
    <div className={span ? "sm:col-span-2" : ""}>
      <span className="mb-1.5 block text-sm font-bold text-ink-900">{label}</span>
      {children}
    </div>
  );
}

function PersonalFields({
  v,
  streams,
  currentStreamId,
}: {
  v: Record<string, string>;
  streams: StreamOption[];
  currentStreamId?: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <Field label="First name *">
        <input key={v.firstName ?? "f"} name="firstName" defaultValue={v.firstName ?? ""} className="field" />
      </Field>
      <Field label="Last name *">
        <input key={v.lastName ?? "l"} name="lastName" defaultValue={v.lastName ?? ""} className="field" />
      </Field>
      <Field label="Gender *">
        <select key={v.gender ?? "g"} name="gender" defaultValue={v.gender ?? ""} className="field">
          <option value="" disabled>
            Choose…
          </option>
          <option value="MALE">Boy</option>
          <option value="FEMALE">Girl</option>
        </select>
      </Field>
      <Field label="Day scholar / Boarder *">
        <select key={v.boarding ?? "b"} name="boarding" defaultValue={v.boarding ?? "DAY"} className="field">
          <option value="DAY">Day scholar</option>
          <option value="BOARDER">Boarder</option>
        </select>
      </Field>
      <Field label={<>Class &amp; stream *</>}>
        <select
          key={v.streamId ?? currentStreamId ?? "s"}
          name="streamId"
          defaultValue={v.streamId ?? currentStreamId ?? ""}
          className="field"
        >
          <option value="" disabled>
            Choose…
          </option>
          {streams.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Date of birth">
        <input key={v.dateOfBirth ?? "d"} name="dateOfBirth" type="date" defaultValue={v.dateOfBirth ?? ""} className="field" />
      </Field>
      <Field label="UPI / NEMIS number">
        <input key={v.upiNumber ?? "u"} name="upiNumber" defaultValue={v.upiNumber ?? ""} className="field" placeholder="Optional" />
      </Field>
      <Field label="Religion">
        <input key={v.religion ?? "r"} name="religion" defaultValue={v.religion ?? ""} className="field" placeholder="Optional" />
      </Field>
      <Field label="Home address" span>
        <input key={v.address ?? "a"} name="address" defaultValue={v.address ?? ""} className="field" placeholder="Optional" />
      </Field>
      <Field label="Medical notes (allergies, conditions)" span>
        <textarea
          key={v.medicalNotes ?? "m"}
          name="medicalNotes"
          defaultValue={v.medicalNotes ?? ""}
          rows={2}
          className="field"
          placeholder="Optional — visible to staff who need it"
        />
      </Field>
    </div>
  );
}

function GuardianFields({ index, v }: { index: 1 | 2; v: Record<string, string> }) {
  const p = (k: string) => v[`g${index}${k}`] ?? "";
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <Field label={index === 1 ? "Guardian name *" : "Guardian name"}>
        <input key={p("Name") || `n${index}`} name={`g${index}Name`} defaultValue={p("Name")} className="field" placeholder="e.g. Jane Wanjala" />
      </Field>
      <Field label="Relationship">
        <select key={p("Relation") || `r${index}`} name={`g${index}Relation`} defaultValue={p("Relation") || "Mother"} className="field">
          {["Mother", "Father", "Guardian", "Grandparent", "Other"].map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Phone">
        <input key={p("Phone") || `p${index}`} name={`g${index}Phone`} defaultValue={p("Phone")} className="field" placeholder="07xx xxx xxx" />
      </Field>
      <Field label="Email">
        <input key={p("Email") || `e${index}`} name={`g${index}Email`} type="email" defaultValue={p("Email")} className="field" placeholder="Optional" />
      </Field>
      <Field label="Occupation" span>
        <input key={p("Occupation") || `o${index}`} name={`g${index}Occupation`} defaultValue={p("Occupation")} className="field" placeholder="Optional" />
      </Field>
    </div>
  );
}

export function AdmitStudentForm({
  streams,
  suggestedAdmissionNo,
}: {
  streams: StreamOption[];
  suggestedAdmissionNo: string;
}) {
  const [state, action, pending] = useActionState<StudentFormState, FormData>(admitStudent, {});
  const v = state.values ?? {};

  return (
    <form action={action} className="max-w-2xl space-y-6">
      <section className="card space-y-5 p-6 sm:p-8">
        <h2 className="font-display text-base font-extrabold text-ink-900">Pupil details</h2>
        <Field label="Admission number">
          <input
            key={v.admissionNo ?? "adm"}
            name="admissionNo"
            defaultValue={v.admissionNo ?? suggestedAdmissionNo}
            className="field font-mono"
          />
        </Field>
        <PersonalFields v={v} streams={streams} />
      </section>

      <section className="card space-y-5 p-6 sm:p-8">
        <h2 className="font-display text-base font-extrabold text-ink-900">
          Parent / guardian 1 *
        </h2>
        <GuardianFields index={1} v={v} />
      </section>

      <section className="card space-y-5 p-6 sm:p-8">
        <h2 className="font-display text-base font-extrabold text-ink-900">
          Parent / guardian 2 <span className="font-normal text-ink-400">(optional)</span>
        </h2>
        <GuardianFields index={2} v={v} />
      </section>

      <ErrorNote error={state.error} />

      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Admitting…" : "Admit pupil"}
        </button>
        <Link href="/students" className="btn btn-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}

export function EditStudentForm({
  student,
  streams,
  currentStreamId,
}: {
  student: Record<string, string> & { id: string };
  streams: StreamOption[];
  currentStreamId?: string;
}) {
  const [state, action, pending] = useActionState<StudentFormState, FormData>(updateStudent, {});
  const v = { ...student, ...(state.values ?? {}) };

  return (
    <form action={action} className="card max-w-2xl space-y-5 p-6 sm:p-8">
      <input type="hidden" name="id" value={student.id} />
      <PersonalFields v={v} streams={streams} currentStreamId={currentStreamId} />
      <ErrorNote error={state.error} />
      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Saving…" : "Save changes"}
        </button>
        <Link href={`/students/${student.id}`} className="btn btn-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}
