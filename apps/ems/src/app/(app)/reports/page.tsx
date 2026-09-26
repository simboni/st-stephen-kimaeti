import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/rbac";
import { getActiveSession } from "@/lib/school";
import { REPORT_CATALOG } from "@/lib/reports";
import { ScrollIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Reports" };

/** The reports catalog — grouped by category, each report opens its own
 *  filterable table view with CSV download. */
export default async function ReportsPage() {
  await requirePermission("reports", "view");
  const session = await getActiveSession();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink-900">Reports</h1>
        <p className="mt-1 text-sm">
          Pick a report to view it on screen with filters and pagination
          {session ? ` — ${session.name}` : ""}. Every report downloads as CSV for
          Excel.
        </p>
      </div>

      {REPORT_CATALOG.map((cat) => (
        <section key={cat.category} className="card p-6">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-ink-400">
            {cat.category}
          </h2>
          <ul className="grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
            {cat.reports.map((r) => (
              <li key={r.key}>
                <Link
                  href={`/reports/${r.key}`}
                  className="group flex items-start gap-2.5 rounded-lg px-2 py-2 hover:bg-paper-100"
                >
                  <ScrollIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                  <span>
                    <span className="block text-sm font-bold text-ink-900 group-hover:text-brand-600">
                      {r.label}
                    </span>
                    <span className="block text-xs text-ink-400">{r.description}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
