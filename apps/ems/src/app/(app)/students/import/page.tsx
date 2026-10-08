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
          admission numbers are assigned automatically. A pupil already on the roll is
          skipped — matched on admission number, on UPI, or on the same name in the same
          class — so re-running a file admits nobody twice.
        </p>

        {/* The office should never have to guess the columns. This file is
            generated from the same column list the importer matches on —
            tools/make-import-template.py. */}
        <a
          href="/pupil-import-template.xlsx"
          download
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-4 py-2.5 text-sm font-bold text-ink-900 transition-colors hover:border-brand-400 hover:text-brand-700"
        >
          <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
            <path d="M10 2a1 1 0 0 1 1 1v7.586l2.293-2.293a1 1 0 1 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4a1 1 0 1 1 1.414-1.414L9 10.586V3a1 1 0 0 1 1-1Z" />
            <path d="M3 14a1 1 0 0 1 1 1v1h12v-1a1 1 0 1 1 2 0v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1a1 1 0 0 1 1-1Z" />
          </svg>
          Download the spreadsheet template
        </a>
        <p className="mt-2 text-xs text-ink-500">
          Excel file with the right columns, dropdowns for class, gender and boarding, and a
          sheet explaining what each one is for.
        </p>
      </div>

      <StudentImportForm />
    </div>
  );
}
