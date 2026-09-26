import type { Metadata } from "next";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission, MODULES, type Action } from "@/lib/rbac";
import { requireUser } from "@/lib/auth";
import { togglePermission } from "@/lib/actions/permission-actions";
import { ROLE_LABELS } from "@/components/role-chip";
import { CheckIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Roles & Permissions" };

const ACTIONS: { key: Action; label: string }[] = [
  { key: "view", label: "View" },
  { key: "create", label: "Create" },
  { key: "edit", label: "Edit" },
  { key: "archive", label: "Archive" },
];

const MODULE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  frontoffice: "Front Office",
  academics: "Academics",
  students: "Students",
  attendance: "Attendance",
  exams: "Examinations",
  homework: "Homework",
  fees: "Fees",
  finance: "Income & Expenses",
  staff: "Staff & HR",
  payroll: "Payroll",
  communication: "Notices & Calendar",
  reports: "Reports",
  users: "Users & Logins",
  settings: "Settings",
  audit: "Audit Trail",
};

export default async function PermissionsPage() {
  await requirePermission("settings", "view");
  const viewer = await requireUser();
  const canEditMatrix = viewer.role === "SUPER_ADMIN";

  const perms = await db.rolePermission.findMany();
  const lookup = new Map(perms.map((p) => [`${p.role}:${p.module}`, p]));
  const roles = Object.values(Role).filter((r) => r !== "SUPER_ADMIN");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink-900">
          Roles &amp; Permissions
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed">
          What each role may do, per module. The Super Admin always has full access and
          isn&rsquo;t listed.{" "}
          {canEditMatrix
            ? "Click a cell to toggle it — changes apply immediately."
            : "Only the Super Admin can change this matrix."}
        </p>
      </div>

      <div className="card overflow-x-auto">
        <table className="table-admin">
          <thead>
            <tr>
              <th>Role / Module</th>
              {MODULES.map((m) => (
                <th key={m} className="text-center" colSpan={ACTIONS.length}>
                  {MODULE_LABELS[m] ?? m}
                </th>
              ))}
            </tr>
            <tr>
              <th />
              {MODULES.flatMap((m) =>
                ACTIONS.map((a) => (
                  <th key={`${m}:${a.key}`} className="!py-2 text-center !text-[9px]">
                    {a.label}
                  </th>
                )),
              )}
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role}>
                <td className="whitespace-nowrap font-semibold text-ink-900">{ROLE_LABELS[role]}</td>
                {MODULES.flatMap((module) => {
                  const p = lookup.get(`${role}:${module}`);
                  return ACTIONS.map(({ key }) => {
                    const on = p
                      ? { view: p.canView, create: p.canCreate, edit: p.canEdit, archive: p.canArchive }[key]
                      : false;
                    const cell = (
                      <span
                        className={`mx-auto flex h-6 w-6 items-center justify-center rounded-md border text-transparent ${
                          on
                            ? "border-leaf-600/30 bg-leaf-500/15 !text-leaf-600"
                            : "border-paper-300 bg-paper-100"
                        }`}
                      >
                        <CheckIcon className="h-3.5 w-3.5" />
                      </span>
                    );
                    return (
                      <td key={`${role}:${module}:${key}`} className="!px-1.5 text-center">
                        {canEditMatrix ? (
                          <form action={togglePermission}>
                            <input type="hidden" name="role" value={role} />
                            <input type="hidden" name="module" value={module} />
                            <input type="hidden" name="action" value={key} />
                            <input type="hidden" name="value" value={on ? "false" : "true"} />
                            <button
                              type="submit"
                              title={`${ROLE_LABELS[role]} · ${MODULE_LABELS[module] ?? module} · ${key}`}
                              aria-label={`Toggle ${key} on ${module} for ${ROLE_LABELS[role]}`}
                              className="cursor-pointer"
                            >
                              {cell}
                            </button>
                          </form>
                        ) : (
                          cell
                        )}
                      </td>
                    );
                  });
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
