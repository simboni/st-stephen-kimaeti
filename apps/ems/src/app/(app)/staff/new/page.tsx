import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/rbac";
import { StaffForm } from "@/components/staff-forms";

export const metadata: Metadata = { title: "New Staff Member" };

export default async function NewStaffPage() {
  await requirePermission("staff", "create");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-400">
          <Link href="/staff" className="hover:text-brand-600">Staff Directory</Link>
        </p>
        <h1 className="font-display text-2xl font-extrabold text-ink-900">New staff member</h1>
        <p className="mt-1 text-sm">
          The employee number is assigned automatically. A login can be linked from the
          profile afterwards.
        </p>
      </div>
      <StaffForm />
    </div>
  );
}
