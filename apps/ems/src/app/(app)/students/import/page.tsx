import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/rbac";
import { getActiveSession } from "@/lib/school";
import { StudentImportForm } from "@/components/import-forms";

export const metadata: Metadata = { title: "Import Pupils" };

export default async function ImportStudentsPage() {
  await requirePermission("students", "create");
  const session = await getActiveSession();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-400">
          <Link href="/students" className="hover:text-brand-600">Students</Link>
        </p>
        <h1 className="font-display text-2xl font-extrabold text-ink-900">
          Import pupils from a spreadsheet
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed">
          Bring your whole register in at once{session ? ` — pupils are enrolled into ${session.name}` : ""}.
          Save your Excel/KNEC progression file as <b>CSV</b> first (File → Save As → CSV).
          Columns are matched by name: admission no., UPI, learner name (or first name +
          surname), gender, grade/class, stream, boarding, guardian name, phone. Single
          &ldquo;learner name&rdquo; columns are split surname-first, KNEC style. Missing
          admission numbers are assigned automatically; pupils already in the system are
          skipped, so re-running an import is safe.
        </p>
      </div>

      <StudentImportForm />
    </div>
  );
}
