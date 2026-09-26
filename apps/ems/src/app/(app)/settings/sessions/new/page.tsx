import type { Metadata } from "next";
import { requirePermission } from "@/lib/rbac";
import { CreateSessionForm } from "@/components/settings-forms";

export const metadata: Metadata = { title: "New session" };

export default async function NewSessionPage() {
  await requirePermission("settings", "create");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink-900">New academic session</h1>
        <p className="mt-1 text-sm">
          Name the session and set the three term dates. You can adjust dates later; make it
          active when the school switches to it.
        </p>
      </div>
      <CreateSessionForm />
    </div>
  );
}
