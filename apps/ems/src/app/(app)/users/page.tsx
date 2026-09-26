import type { Metadata } from "next";
import Link from "next/link";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { can, requirePermission } from "@/lib/rbac";
import { setUserActive } from "@/lib/actions/user-actions";
import { RoleChip, ROLE_LABELS } from "@/components/role-chip";
import { BanIcon, CheckIcon, KeyIcon, PencilIcon, PlusIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Users & Logins" };

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; show?: string }>;
}) {
  const user = await requirePermission("users", "view");
  const { q = "", role = "", show = "" } = await searchParams;
  const [mayCreate, mayEdit, mayArchive] = await Promise.all([
    can(user.role, "users", "create"),
    can(user.role, "users", "edit"),
    can(user.role, "users", "archive"),
  ]);

  const roleFilter = (Object.values(Role) as string[]).includes(role) ? (role as Role) : undefined;

  const users = await db.user.findMany({
    where: {
      ...(show === "disabled" ? { active: false } : show === "all" ? {} : { active: true }),
      ...(roleFilter ? { role: roleFilter } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { username: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink-900">Users &amp; Logins</h1>
          <p className="mt-1 text-sm">System accounts for staff, parents and pupils.</p>
        </div>
        {mayCreate && (
          <Link href="/users/new" className="btn btn-primary">
            <PlusIcon className="h-4 w-4" /> New user
          </Link>
        )}
      </div>

      {/* Filters */}
      <form className="card flex flex-wrap items-end gap-3 p-4" method="get">
        <div className="min-w-48 flex-1">
          <label htmlFor="q" className="mb-1 block text-xs font-bold text-ink-400">
            Search
          </label>
          <input id="q" name="q" defaultValue={q} placeholder="Name, username or email…" className="field" />
        </div>
        <div>
          <label htmlFor="role" className="mb-1 block text-xs font-bold text-ink-400">
            Role
          </label>
          <select id="role" name="role" defaultValue={role} className="field !w-44">
            <option value="">All roles</option>
            {Object.values(Role).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="show" className="mb-1 block text-xs font-bold text-ink-400">
            Status
          </label>
          <select id="show" name="show" defaultValue={show} className="field !w-36">
            <option value="">Active</option>
            <option value="disabled">Disabled</option>
            <option value="all">All</option>
          </select>
        </div>
        <button type="submit" className="btn btn-secondary">
          Filter
        </button>
      </form>

      <div className="card overflow-x-auto">
        <table className="table-admin">
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Role</th>
              <th>Contact</th>
              <th>Last login</th>
              <th>Status</th>
              {(mayEdit || mayArchive) && <th className="text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-ink-400">
                  No users match this filter.
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className={u.active ? "" : "opacity-60"}>
                <td className="font-semibold text-ink-900">{u.name}</td>
                <td className="font-mono text-xs">{u.username}</td>
                <td>
                  <RoleChip role={u.role} />
                </td>
                <td className="text-ink-500">
                  {u.email ?? "—"}
                  {u.phone ? <span className="block text-xs text-ink-400">{u.phone}</span> : null}
                </td>
                <td className="whitespace-nowrap text-ink-400">
                  {u.lastLoginAt
                    ? u.lastLoginAt.toLocaleString("en-KE", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "Africa/Nairobi",
                      })
                    : "Never"}
                </td>
                <td>
                  {u.active ? (
                    <span className="chip bg-leaf-500/15 text-leaf-600">Active</span>
                  ) : (
                    <span className="chip bg-danger-500/10 text-danger-500" title={u.archiveReason ?? ""}>
                      Disabled
                    </span>
                  )}
                </td>
                {(mayEdit || mayArchive) && (
                  <td>
                    <div className="flex items-center justify-end gap-1.5">
                      {mayEdit && (
                        <>
                          <Link
                            href={`/users/${u.id}`}
                            className="btn btn-secondary !p-2"
                            title="Edit"
                            aria-label={`Edit ${u.name}`}
                          >
                            <PencilIcon className="h-3.5 w-3.5" />
                          </Link>
                          <Link
                            href={`/users/${u.id}/password`}
                            className="btn btn-secondary !p-2"
                            title="Reset password"
                            aria-label={`Reset password for ${u.name}`}
                          >
                            <KeyIcon className="h-3.5 w-3.5" />
                          </Link>
                        </>
                      )}
                      {mayArchive && u.id !== user.id && (
                        <form action={setUserActive}>
                          <input type="hidden" name="id" value={u.id} />
                          <input type="hidden" name="active" value={u.active ? "false" : "true"} />
                          {u.active ? (
                            <button
                              type="submit"
                              className="btn btn-danger !p-2"
                              title="Disable account"
                              aria-label={`Disable ${u.name}`}
                            >
                              <BanIcon className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <button
                              type="submit"
                              className="btn btn-secondary !p-2 !text-leaf-600"
                              title="Re-enable account"
                              aria-label={`Enable ${u.name}`}
                            >
                              <CheckIcon className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </form>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
