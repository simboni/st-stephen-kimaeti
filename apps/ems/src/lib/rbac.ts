import "server-only";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser, type SessionUser } from "@/lib/auth";

/** Modules that exist so far — later items append here and to the seed. */
export const MODULES = ["dashboard", "frontoffice", "academics", "students", "attendance", "exams", "homework", "fees", "finance", "transport", "boarding", "staff", "payroll", "communication", "reports", "users", "settings", "audit"] as const;
export type Module = (typeof MODULES)[number];

export type Action = "view" | "create" | "edit" | "archive";

const actionColumn: Record<Action, "canView" | "canCreate" | "canEdit" | "canArchive"> = {
  view: "canView",
  create: "canCreate",
  edit: "canEdit",
  archive: "canArchive",
};

export async function can(role: Role, module: Module, action: Action): Promise<boolean> {
  if (role === "SUPER_ADMIN") return true;
  const perm = await db.rolePermission.findUnique({
    where: { role_module: { role, module } },
  });
  return perm ? perm[actionColumn[action]] : false;
}

/** Page/action guard: signed in AND permitted, else redirected. */
export async function requirePermission(module: Module, action: Action): Promise<SessionUser> {
  const user = await requireUser();
  if (!(await can(user.role, module, action))) redirect("/denied");
  return user;
}

/** Which modules a role may see — drives the sidebar. */
export async function visibleModules(role: Role): Promise<Module[]> {
  if (role === "SUPER_ADMIN") return [...MODULES];
  const perms = await db.rolePermission.findMany({
    where: { role, canView: true },
    select: { module: true },
  });
  const set = new Set(perms.map((p) => p.module));
  return MODULES.filter((m) => set.has(m));
}
