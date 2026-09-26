import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";

export const metadata: Metadata = { title: "Audit Trail" };

const PAGE_SIZE = 25;

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ module?: string; q?: string; page?: string }>;
}) {
  await requirePermission("audit", "view");
  const { module = "", q = "", page = "1" } = await searchParams;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);

  const where = {
    ...(module ? { module } : {}),
    ...(q
      ? {
          OR: [
            { username: { contains: q, mode: "insensitive" as const } },
            { action: { contains: q, mode: "insensitive" as const } },
            { detail: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [logs, total, modules] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.auditLog.count({ where }),
    db.auditLog.findMany({ distinct: ["module"], select: { module: true } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const query = (p: number) =>
    `?${new URLSearchParams({ ...(module ? { module } : {}), ...(q ? { q } : {}), page: String(p) })}`;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink-900">Audit Trail</h1>
        <p className="mt-1 text-sm">
          Every sign-in and administrative action, permanently recorded. {total} entries.
        </p>
      </div>

      <form className="card flex flex-wrap items-end gap-3 p-4" method="get">
        <div className="min-w-48 flex-1">
          <label htmlFor="q" className="mb-1 block text-xs font-bold text-ink-400">
            Search
          </label>
          <input id="q" name="q" defaultValue={q} placeholder="User, action or detail…" className="field" />
        </div>
        <div>
          <label htmlFor="module" className="mb-1 block text-xs font-bold text-ink-400">
            Module
          </label>
          <select id="module" name="module" defaultValue={module} className="field !w-44">
            <option value="">All modules</option>
            {modules.map((m) => (
              <option key={m.module} value={m.module}>
                {m.module}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-secondary">
          Filter
        </button>
      </form>

      <div className="card overflow-x-auto">
        <table className="table-admin">
          <thead>
            <tr>
              <th>When (EAT)</th>
              <th>Who</th>
              <th>Module</th>
              <th>Action</th>
              <th>Detail</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-ink-400">
                  No entries match this filter.
                </td>
              </tr>
            )}
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="whitespace-nowrap text-ink-400">
                  {log.createdAt.toLocaleString("en-KE", {
                    dateStyle: "medium",
                    timeStyle: "medium",
                    timeZone: "Africa/Nairobi",
                  })}
                </td>
                <td className="font-semibold text-ink-900">{log.username}</td>
                <td>
                  <span className="chip bg-paper-200 text-ink-700">{log.module}</span>
                </td>
                <td>{log.action}</td>
                <td className="max-w-md truncate text-ink-500" title={log.detail}>
                  {log.detail || "—"}
                </td>
                <td className="font-mono text-xs text-ink-400">{log.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-ink-400">
            Page {pageNum} of {pages}
          </p>
          <div className="flex gap-2">
            {pageNum > 1 && (
              <Link href={query(pageNum - 1)} className="btn btn-secondary">
                ← Newer
              </Link>
            )}
            {pageNum < pages && (
              <Link href={query(pageNum + 1)} className="btn btn-secondary">
                Older →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
