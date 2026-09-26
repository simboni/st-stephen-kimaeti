import type { Metadata } from "next";
import { requirePermission } from "@/lib/rbac";
import { CreateSubjectForm } from "@/components/subject-forms";

export const metadata: Metadata = { title: "New subject" };

export default async function NewSubjectPage() {
  await requirePermission("academics", "create");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink-900">New subject</h1>
        <p className="mt-1 text-sm">
          Add a learning area, then tick the classes that take it in the matrix.
        </p>
      </div>
      <CreateSubjectForm />
    </div>
  );
}
