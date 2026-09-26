import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { can, requirePermission } from "@/lib/rbac";
import { PlusIcon, SearchIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Staff Directory" };

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; archived?: string }>;
}) {
  const user = await requirePermission("staff", "view");
  const { q = "", archived = "" } = await searchParams;
  const showArchived = archived === "1";

  const [staff, mayCreate] = await Promise.all([
    db.staffProfile.findMany({
      where: {
        archived: showArchived,
        ...(q
          ? {
              OR: [
                { firstName: { contains: q, mode: "insensitive" } },
                { lastName: { contains: q, mode: "insensitive" } },
                { employeeNo: { contains: q, mode: "insensitive" } },
                { designation: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { user: true },
      orderBy: { employeeNo: "asc" },
    }),
    can(user.role, "staff", "create"),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink-900">Staff Directory</h1>
          <p className="mt-1 text-sm">
            {staff.length} {showArchived ? "archived" : "active"} staff member
            {staff.length === 1 ? "" : "s"}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <form method="get" className="flex items-center gap-2">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
              <input
                name="q"
                defaultValue={q}
                placeholder="Search name, no., role…"
                className="field !w-56 !py-2 !pl-9 text-sm"
                aria-label="Search staff"
              />
            </div>
            {showArchived && <input type="hidden" name="archived" value="1" />}
            <button type="submit" className="btn btn-secondary !py-2 text-xs">
              Search
            </button>
          </form>
          <Link
            href={showArchived ? "/staff" : "/staff?archived=1"}
            className="btn btn-secondary !py-2 text-xs"
          >
            {showArchived ? "Show active" : "Show archived"}
          </Link>
          {mayCreate && (
            <Link href="/staff/new" className="btn btn-primary !py-2 text-xs">
              <PlusIcon className="h-3.5 w-3.5" /> New staff
            </Link>
          )}
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="table-admin">
          <thead>
            <tr>
              <th>Emp No.</th>
              <th>Name</th>
              <th>Designation</th>
              <th>Department</th>
              <th>Phone</th>
              <th>Login</th>
              <th className="text-right">Profile</th>
            </tr>
          </thead>
          <tbody>
            {staff.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-ink-400">
                  {q ? `No staff match “${q}”.` : "No staff records yet."}
                </td>
              </tr>
            )}
            {staff.map((s) => (
              <tr key={s.id}>
                <td className="font-mono text-xs">{s.employeeNo}</td>
                <td className="font-semibold text-ink-900">
                  {s.lastName}, {s.firstName}
                </td>
                <td>{s.designation}</td>
                <td className="text-ink-500">{s.department ?? "—"}</td>
                <td className="text-ink-500">{s.phone ?? "—"}</td>
                <td>
                  {s.user ? (
                    <span className="chip bg-leaf-500/10 text-leaf-600">{s.user.username}</span>
                  ) : (
                    <span className="chip bg-paper-200 text-ink-400">none</span>
                  )}
                </td>
                <td className="text-right">
                  <Link href={`/staff/${s.id}`} className="text-xs font-bold text-brand-600 hover:text-brand-700">
                    Open →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
