import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { CreateClassForm } from "@/components/academics-forms";

export const metadata: Metadata = { title: "New class" };

export default async function NewClassPage() {
  await requirePermission("academics", "create");
  const top = await db.schoolClass.findFirst({ orderBy: { level: "desc" } });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink-900">New class</h1>
        <p className="mt-1 text-sm">
          Add a grade level to the school. Streams (A, B, …) can be added afterwards from
          the classes list.
        </p>
      </div>
      <CreateClassForm suggestedLevel={(top?.level ?? -1) + 1} />
    </div>
  );
}
