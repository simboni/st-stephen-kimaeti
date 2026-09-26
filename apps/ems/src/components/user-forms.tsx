"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  createUser,
  resetPassword,
  updateUser,
  type UserFormState,
} from "@/lib/actions/user-actions";
import type { RoleOption } from "@/components/role-chip";

function ErrorNote({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p className="rounded-lg bg-brand-50 px-3.5 py-2.5 text-sm font-semibold text-brand-800">
      {error}
    </p>
  );
}

export function CreateUserForm({ roles }: { roles: RoleOption[] }) {
  const [state, action, pending] = useActionState<UserFormState, FormData>(createUser, {});
  return (
    <form action={action} className="card max-w-xl space-y-5 p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-bold text-ink-900">
            Full name *
          </label>
          <input key={state.values?.name ?? "n"} id="name" name="name" defaultValue={state.values?.name ?? ""} className="field" placeholder="e.g. Mary Atieno" />
        </div>
        <div>
          <label htmlFor="username" className="mb-1.5 block text-sm font-bold text-ink-900">
            Username *
          </label>
          <input key={state.values?.username ?? "u"} id="username" name="username" defaultValue={state.values?.username ?? ""} className="field" placeholder="e.g. mary.atieno" />
        </div>
        <div>
          <label htmlFor="role" className="mb-1.5 block text-sm font-bold text-ink-900">
            Role *
          </label>
          <select key={state.values?.role ?? "r"} id="role" name="role" className="field" defaultValue={state.values?.role ?? ""}>
            <option value="" disabled>
              Choose…
            </option>
            {roles.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-bold text-ink-900">
            Temporary password *
          </label>
          <input id="password" name="password" type="text" className="field" placeholder="Min 8 characters" />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-bold text-ink-900">
            Email
          </label>
          <input key={state.values?.email ?? "e"} id="email" name="email" type="email" defaultValue={state.values?.email ?? ""} className="field" placeholder="Optional" />
        </div>
        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-bold text-ink-900">
            Phone
          </label>
          <input key={state.values?.phone ?? "p"} id="phone" name="phone" defaultValue={state.values?.phone ?? ""} className="field" placeholder="Optional" />
        </div>
      </div>
      <ErrorNote error={state.error} />
      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Creating…" : "Create user"}
        </button>
        <Link href="/users" className="btn btn-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}

export function EditUserForm({
  user,
  roles,
}: {
  user: { id: string; name: string; username: string; email: string | null; phone: string | null; role: string };
  roles: RoleOption[];
}) {
  const [state, action, pending] = useActionState<UserFormState, FormData>(updateUser, {});
  return (
    <form action={action} className="card max-w-xl space-y-5 p-6 sm:p-8">
      <input type="hidden" name="id" value={user.id} />
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-bold text-ink-900">
            Full name *
          </label>
          <input id="name" name="name" defaultValue={user.name} className="field" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-bold text-ink-900">Username</label>
          <input value={user.username} disabled className="field opacity-60" />
        </div>
        <div>
          <label htmlFor="role" className="mb-1.5 block text-sm font-bold text-ink-900">
            Role *
          </label>
          <select id="role" name="role" defaultValue={user.role} className="field">
            {roles.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-bold text-ink-900">
            Email
          </label>
          <input id="email" name="email" type="email" defaultValue={user.email ?? ""} className="field" />
        </div>
        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-bold text-ink-900">
            Phone
          </label>
          <input id="phone" name="phone" defaultValue={user.phone ?? ""} className="field" />
        </div>
      </div>
      <ErrorNote error={state.error} />
      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Saving…" : "Save changes"}
        </button>
        <Link href="/users" className="btn btn-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}

export function ResetPasswordForm({ user }: { user: { id: string; name: string; username: string } }) {
  const [state, action, pending] = useActionState<UserFormState, FormData>(resetPassword, {});
  return (
    <form action={action} className="card max-w-md space-y-5 p-6 sm:p-8">
      <input type="hidden" name="id" value={user.id} />
      <p className="text-sm leading-relaxed">
        Set a new temporary password for <strong className="text-ink-900">{user.name}</strong>{" "}
        (<span className="font-mono text-xs">{user.username}</span>). They&rsquo;ll be asked to
        change it after signing in.
      </p>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-bold text-ink-900">
          New temporary password *
        </label>
        <input id="password" name="password" type="text" className="field" placeholder="Min 8 characters" />
      </div>
      <ErrorNote error={state.error} />
      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Resetting…" : "Reset password"}
        </button>
        <Link href="/users" className="btn btn-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}
