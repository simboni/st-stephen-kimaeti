import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { EditUserForm } from "@/components/user-forms";
import { roleOptions } from "@/components/role-chip";

export const metadata: Metadata = { title: "Edit user" };

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requirePermission("users", "edit");
  const { id } = await params;
  const user = await db.user.findUnique({ where: { id } });
  if (!user) notFound();

  const roles =
    actor.role === "SUPER_ADMIN"
      ? Object.values(Role)
      : Object.values(Role).filter((r) => r !== "SUPER_ADMIN" && r !== "ADMIN");
  // keep the current role selectable even if the actor couldn't normally assign it
  if (!roles.includes(user.role)) roles.push(user.role);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink-900">Edit user</h1>
        <p className="mt-1 text-sm">Update details or change the role.</p>
      </div>
      <EditUserForm
        user={{
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: user.role,
        }}
        roles={roleOptions(roles)}
      />
    </div>
  );
}
