"use client";

import { useActionState } from "react";
import {
  createParentLogin,
  createStudentLogin,
  linkParentByUsername,
  type PortalCredsState,
} from "@/lib/actions/portal-actions";

function CredsNote({ state }: { state: PortalCredsState }) {
  if (state.error)
    return (
      <p className="rounded-lg bg-brand-50 px-3.5 py-2.5 text-sm font-semibold text-brand-800">
        {state.error}
      </p>
    );
  if (!state.username) return null;
  return (
    <div className="rounded-lg bg-leaf-500/10 px-3.5 py-2.5 text-sm">
      <p className="font-semibold text-leaf-600">{state.note}</p>
      <p className="mt-1 font-mono text-xs text-ink-900">
        username: <strong>{state.username}</strong>
        {state.password && (
          <>
            {" · "}password: <strong>{state.password}</strong>
          </>
        )}
      </p>
    </div>
  );
}

export function PortalAccessPanel({
  studentId,
  hasStudentLogin,
  studentUsername,
  guardians,
  linkedParents,
}: {
  studentId: string;
  hasStudentLogin: boolean;
  studentUsername?: string;
  guardians: { id: string; name: string; hasAccount: boolean }[];
  linkedParents: { username: string; name: string }[];
}) {
  const [pupilState, pupilAction, pupilPending] = useActionState<PortalCredsState, FormData>(
    createStudentLogin,
    {},
  );
  const [parentState, parentAction, parentPending] = useActionState<PortalCredsState, FormData>(
    createParentLogin,
    {},
  );
  const [linkState, linkAction, linkPending] = useActionState<PortalCredsState, FormData>(
    linkParentByUsername,
    {},
  );

  return (
    <section className="card space-y-5 p-6">
      <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-ink-400">
        Portal access
      </h2>

      {/* Pupil login */}
      <div className="space-y-2">
        <p className="text-sm font-bold text-ink-900">Pupil login</p>
        {hasStudentLogin ? (
          <p className="text-sm text-ink-500">
            Active — username <span className="font-mono text-xs">{studentUsername}</span>{" "}
            (reset the password under Users &amp; Logins).
          </p>
        ) : (
          <form action={pupilAction}>
            <input type="hidden" name="studentId" value={studentId} />
            <button type="submit" disabled={pupilPending} className="btn btn-secondary !py-2 text-xs">
              {pupilPending ? "Creating…" : "Create pupil login"}
            </button>
          </form>
        )}
        <CredsNote state={pupilState} />
      </div>

      {/* Parent logins */}
      <div className="space-y-2">
        <p className="text-sm font-bold text-ink-900">Parent logins</p>
        {linkedParents.length > 0 && (
          <ul className="space-y-1 text-sm text-ink-500">
            {linkedParents.map((p) => (
              <li key={p.username}>
                {p.name} — <span className="font-mono text-xs">{p.username}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap gap-2">
          {guardians
            .filter((g) => !g.hasAccount)
            .map((g) => (
              <form key={g.id} action={parentAction}>
                <input type="hidden" name="guardianId" value={g.id} />
                <button type="submit" disabled={parentPending} className="btn btn-secondary !py-2 text-xs">
                  {parentPending ? "Creating…" : `Create login for ${g.name.split(" ")[0]}`}
                </button>
              </form>
            ))}
        </div>
        <CredsNote state={parentState} />
      </div>

      {/* Link an existing parent (siblings) */}
      <div className="space-y-2">
        <p className="text-sm font-bold text-ink-900">
          Link an existing parent account{" "}
          <span className="font-normal text-ink-400">(siblings share one login)</span>
        </p>
        <form action={linkAction} className="flex gap-2">
          <input type="hidden" name="studentId" value={studentId} />
          <input
            name="username"
            placeholder="parent username"
            className="field !w-52 !py-2 font-mono text-xs"
            aria-label="Parent username to link"
          />
          <button type="submit" disabled={linkPending} className="btn btn-secondary !py-2 text-xs">
            {linkPending ? "Linking…" : "Link"}
          </button>
        </form>
        <CredsNote state={linkState} />
      </div>
    </section>
  );
}
