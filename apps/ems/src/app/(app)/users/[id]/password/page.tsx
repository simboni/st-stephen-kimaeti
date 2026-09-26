import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { ResetPasswordForm } from "@/components/user-forms";

export const metadata: Metadata = { title: "Reset password" };

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("users", "edit");
  const { id } = await params;
  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, name: true, username: true },
  });
  if (!user) notFound();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <h1 className="font-display text-2xl font-extrabold text-ink-900">Reset password</h1>
      <ResetPasswordForm user={user} />
    </div>
  );
}
