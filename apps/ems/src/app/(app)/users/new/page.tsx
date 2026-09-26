import type { Metadata } from "next";
import { Role } from "@prisma/client";
import { requirePermission } from "@/lib/rbac";
import { CreateUserForm } from "@/components/user-forms";
import { roleOptions } from "@/components/role-chip";

export const metadata: Metadata = { title: "New user" };

export default async function NewUserPage() {
  const actor = await requirePermission("users", "create");
  const roles =
    actor.role === "SUPER_ADMIN"
      ? Object.values(Role)
      : Object.values(Role).filter((r) => r !== "SUPER_ADMIN" && r !== "ADMIN");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink-900">New user</h1>
        <p className="mt-1 text-sm">
          The person signs in with this username and temporary password, then sets their own.
        </p>
      </div>
      <CreateUserForm roles={roleOptions(roles)} />
    </div>
  );
}
