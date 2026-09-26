import "server-only";
import { db } from "@/lib/db";

/** Weekdays (Mon–Fri) in an inclusive date range — how leave days are counted. */
export function weekdaysBetween(start: Date, end: Date): number {
  let count = 0;
  const d = new Date(start);
  while (d <= end) {
    const day = d.getUTCDay();
    if (day !== 0 && day !== 6) count += 1;
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return count;
}

export type LeaveBalance = {
  leaveTypeId: string;
  name: string;
  quota: number;
  used: number;
  pending: number;
  remaining: number;
};

/** Per-type leave balances for one staff member in a calendar year.
 *  Approved days consume the quota; pending days are shown but don't. */
export async function leaveBalances(staffId: string, year: number): Promise<LeaveBalance[]> {
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const yearEnd = new Date(Date.UTC(year + 1, 0, 1));

  const [types, applications] = await Promise.all([
    db.leaveType.findMany({ where: { archived: false }, orderBy: { name: "asc" } }),
    db.leaveApplication.findMany({
      where: {
        staffId,
        status: { in: ["APPROVED", "PENDING"] },
        startDate: { gte: yearStart, lt: yearEnd },
      },
    }),
  ]);

  return types.map((t) => {
    const mine = applications.filter((a) => a.leaveTypeId === t.id);
    const used = mine.filter((a) => a.status === "APPROVED").reduce((s, a) => s + a.days, 0);
    const pending = mine.filter((a) => a.status === "PENDING").reduce((s, a) => s + a.days, 0);
    return {
      leaveTypeId: t.id,
      name: t.name,
      quota: t.daysPerYear,
      used,
      pending,
      remaining: Math.max(0, t.daysPerYear - used),
    };
  });
}

/** Next sequential employee number, e.g. ST-007. */
export async function nextEmployeeNo(): Promise<string> {
  const last = await db.staffProfile.findFirst({
    where: { employeeNo: { startsWith: "ST-" } },
    orderBy: { employeeNo: "desc" },
    select: { employeeNo: true },
  });
  const n = last ? Number.parseInt(last.employeeNo.slice(3), 10) + 1 : 1;
  return `ST-${String(n).padStart(3, "0")}`;
}
