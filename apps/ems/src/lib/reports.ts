import "server-only";
import type { AcademicSession } from "@prisma/client";
import { db } from "@/lib/db";
import { studentBalance, termBreakdown } from "@/lib/fees";
import { streamResults } from "@/lib/exams";
import { cbcLevel } from "@/lib/cbc";
import { formatMoney } from "@/lib/money";

/** One data layer for every report — the on-screen table and the CSV
 *  export both render from this, so they can never disagree. Money cells
 *  are stored as integer cents and formatted per output. */

export type ReportColumn = { label: string; kind?: "money" | "num" | "text" };

export type ReportData = {
  columns: ReportColumn[];
  rows: (string | number | null)[][];
  summary: { label: string; value: string }[];
  error?: string;
};

export type ReportParams = {
  stream?: string;
  month?: string;
  from?: string;
  to?: string;
  exam?: string;
  run?: string;
  class?: string;
  gender?: string;
  boarding?: string;
  owing?: string;
  method?: string;
  feeType?: string;
  exitType?: string;
  leaveStatus?: string;
};

export type ReportFilter =
  | "stream"
  | "month"
  | "exam"
  | "range"
  | "run"
  | "class"
  | "gender"
  | "boarding"
  | "owing"
  | "method"
  | "feeType"
  | "exitType"
  | "leaveStatus";

export type ReportDef = {
  key: string;
  label: string;
  description: string;
  filters: ReportFilter[];
  /** Default span for "range" filters — how far back "from" starts. */
  rangeDefault?: "month" | "year";
};

/** The report catalog, grouped the way the office thinks about work. */
export const REPORT_CATALOG: { category: string; reports: ReportDef[] }[] = [
  {
    category: "Student Information",
    reports: [
      { key: "students", label: "Student Report", description: "Every active pupil with placement and guardian contact.", filters: ["class", "gender", "boarding"] },
      { key: "guardians", label: "Guardian Report", description: "Parents & guardians per pupil with phone, email and occupation.", filters: ["class"] },
      { key: "classes", label: "Class & Stream Report", description: "Enrollment per stream — boys, girls, boarders and class teacher.", filters: [] },
      { key: "admissions", label: "Admission Report", description: "Pupils admitted within a date range.", filters: ["range", "gender"], rangeDefault: "year" },
      { key: "exits", label: "Leavers Report", description: "Transfers, graduations and withdrawals with balance at exit.", filters: ["exitType"] },
    ],
  },
  {
    category: "Finance",
    reports: [
      { key: "dues", label: "Balance Fees Report", description: "Charged, paid, arrears and balance per pupil — the defaulters list.", filters: ["class", "boarding", "owing"] },
      { key: "collections", label: "Fees Collection Report", description: "Every receipt in a date range, with vote-head splits.", filters: ["range", "method", "feeType"], rangeDefault: "month" },
      { key: "daily", label: "Daily Collection Report", description: "Collections totalled per day for a date range.", filters: ["range"], rangeDefault: "month" },
      { key: "income", label: "Income Report", description: "Fee collections plus other income entries for a month.", filters: ["month"] },
      { key: "expenses", label: "Expense Report", description: "Expense ledger entries for a month.", filters: ["month"] },
      { key: "finance", label: "Income & Expense Summary", description: "The month's full ledger with fees, income, expenses and net.", filters: ["month"] },
      { key: "payroll", label: "Payroll Report", description: "One payroll run — basic, allowances, deductions and net pay.", filters: ["run"] },
    ],
  },
  {
    category: "Attendance",
    reports: [
      { key: "attendance", label: "Pupil Attendance Register", description: "P/A/L/H per pupil per day for one stream and month.", filters: ["stream", "month"] },
      { key: "staff-attendance", label: "Staff Attendance Report", description: "Present, absent, late and leave days per staff member for a month.", filters: ["month"] },
    ],
  },
  {
    category: "Examinations",
    reports: [
      { key: "results", label: "Exam Results Report", description: "Scores, totals, averages and positions for one exam and stream.", filters: ["stream", "exam"] },
    ],
  },
  {
    category: "Human Resource",
    reports: [
      { key: "staff", label: "Staff Report", description: "Active staff with designations, contacts and gross salary.", filters: [] },
      { key: "leave", label: "Leave Report", description: "Leave applications with dates, days and approval status.", filters: ["range", "leaveStatus"], rangeDefault: "year" },
    ],
  },
];

export function findReport(key: string) {
  for (const cat of REPORT_CATALOG) {
    const report = cat.reports.find((r) => r.key === key);
    if (report) return { category: cat.category, report, siblings: cat.reports };
  }
  return null;
}

const err = (message: string): ReportData => ({
  columns: [],
  rows: [],
  summary: [],
  error: message,
});

function monthBounds(month: string): [Date, Date] | null {
  if (!/^\d{4}-\d{2}$/.test(month)) return null;
  const [y, m] = month.split("-").map(Number);
  return [new Date(Date.UTC(y, m - 1, 1)), new Date(Date.UTC(y, m, 1))];
}

function rangeBounds(from?: string, to?: string): [Date, Date] | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from ?? "") || !/^\d{4}-\d{2}-\d{2}$/.test(to ?? ""))
    return null;
  return [new Date(`${from}T00:00:00Z`), new Date(`${to}T23:59:59Z`)];
}

const pupilName = (s: { lastName: string; firstName: string }) => `${s.lastName}, ${s.firstName}`;
const isoDate = (d: Date) => d.toISOString().slice(0, 10);

/** Narrowing clauses shared by the pupil-based reports. */
function pupilWhere(params: ReportParams) {
  return {
    ...(params.class ? { stream: { classId: params.class } } : {}),
    student: {
      archived: false,
      ...(params.gender === "MALE" || params.gender === "FEMALE"
        ? { gender: params.gender as "MALE" | "FEMALE" }
        : {}),
      ...(params.boarding === "DAY" || params.boarding === "BOARDER"
        ? { boarding: params.boarding as "DAY" | "BOARDER" }
        : {}),
    },
  };
}

export async function buildReport(
  type: string,
  params: ReportParams,
  session: AcademicSession,
): Promise<ReportData> {
  if (type === "students") {
    const enrollments = await db.enrollment.findMany({
      where: { sessionId: session.id, ...pupilWhere(params) },
      include: {
        student: { include: { guardians: { take: 1 } } },
        stream: { include: { class: true } },
      },
      orderBy: [{ stream: { class: { level: "asc" } } }, { student: { lastName: "asc" } }],
    });
    const boys = enrollments.filter((e) => e.student.gender === "MALE").length;
    const boarders = enrollments.filter((e) => e.student.boarding === "BOARDER").length;
    return {
      columns: [
        { label: "Admission No" },
        { label: "Pupil" },
        { label: "Gender" },
        { label: "Day/Boarder" },
        { label: "Class" },
        { label: "Guardian" },
        { label: "Guardian Phone" },
      ],
      rows: enrollments.map((e) => [
        e.student.admissionNo,
        pupilName(e.student),
        e.student.gender === "MALE" ? "Boy" : "Girl",
        e.student.boarding === "BOARDER" ? "Boarder" : "Day",
        `${e.stream.class.name} ${e.stream.name}`,
        e.student.guardians[0]?.name ?? "—",
        e.student.guardians[0]?.phone ?? "—",
      ]),
      summary: [
        { label: "Pupils", value: String(enrollments.length) },
        { label: "Boys · Girls", value: `${boys} · ${enrollments.length - boys}` },
        { label: "Boarders", value: String(boarders) },
      ],
    };
  }

  if (type === "guardians") {
    const enrollments = await db.enrollment.findMany({
      where: { sessionId: session.id, ...pupilWhere(params) },
      include: {
        student: { include: { guardians: true } },
        stream: { include: { class: true } },
      },
      orderBy: [{ stream: { class: { level: "asc" } } }, { student: { lastName: "asc" } }],
    });
    const rows = enrollments.flatMap((e) =>
      e.student.guardians.map((g) => [
        e.student.admissionNo,
        pupilName(e.student),
        `${e.stream.class.name} ${e.stream.name}`,
        g.name,
        g.relation,
        g.phone ?? "—",
        g.email ?? "—",
        g.occupation ?? "—",
      ]),
    );
    const orphans = enrollments.filter((e) => e.student.guardians.length === 0).length;
    return {
      columns: [
        { label: "Admission No" },
        { label: "Pupil" },
        { label: "Class" },
        { label: "Guardian" },
        { label: "Relation" },
        { label: "Phone" },
        { label: "Email" },
        { label: "Occupation" },
      ],
      rows,
      summary: [
        { label: "Guardians", value: String(rows.length) },
        { label: "Pupils", value: String(enrollments.length) },
        { label: "No guardian on file", value: String(orphans) },
      ],
    };
  }

  if (type === "classes") {
    const [classes, enrollments] = await Promise.all([
      db.schoolClass.findMany({
        where: { archived: false },
        include: {
          streams: {
            where: { archived: false },
            include: {
              classTeachers: {
                where: { sessionId: session.id },
                include: { teacher: { select: { name: true } } },
              },
            },
            orderBy: { name: "asc" },
          },
        },
        orderBy: { level: "asc" },
      }),
      db.enrollment.findMany({
        where: { sessionId: session.id, student: { archived: false } },
        select: { streamId: true, student: { select: { gender: true, boarding: true } } },
      }),
    ]);
    const byStream = new Map<string, { boys: number; girls: number; boarders: number }>();
    for (const e of enrollments) {
      const t = byStream.get(e.streamId) ?? { boys: 0, girls: 0, boarders: 0 };
      if (e.student.gender === "MALE") t.boys += 1;
      else t.girls += 1;
      if (e.student.boarding === "BOARDER") t.boarders += 1;
      byStream.set(e.streamId, t);
    }
    const rows: (string | number)[][] = [];
    let streams = 0;
    for (const c of classes) {
      for (const st of c.streams) {
        streams += 1;
        const t = byStream.get(st.id) ?? { boys: 0, girls: 0, boarders: 0 };
        rows.push([
          c.name,
          st.name,
          st.classTeachers[0]?.teacher.name ?? "—",
          t.boys,
          t.girls,
          t.boarders,
          t.boys + t.girls,
        ]);
      }
    }
    const boys = enrollments.filter((e) => e.student.gender === "MALE").length;
    return {
      columns: [
        { label: "Class" },
        { label: "Stream" },
        { label: "Class Teacher" },
        { label: "Boys", kind: "num" },
        { label: "Girls", kind: "num" },
        { label: "Boarders", kind: "num" },
        { label: "Total", kind: "num" },
      ],
      rows,
      summary: [
        { label: "Streams", value: String(streams) },
        { label: "Pupils", value: String(enrollments.length) },
        { label: "Boys · Girls", value: `${boys} · ${enrollments.length - boys}` },
      ],
    };
  }

  if (type === "admissions") {
    const bounds = rangeBounds(params.from, params.to);
    if (!bounds) return err("Pick a from and to date.");
    const students = await db.student.findMany({
      where: {
        admittedAt: { gte: bounds[0], lt: bounds[1] },
        ...(params.gender === "MALE" || params.gender === "FEMALE"
          ? { gender: params.gender as "MALE" | "FEMALE" }
          : {}),
      },
      include: {
        guardians: { take: 1 },
        enrollments: {
          where: { sessionId: session.id },
          include: { stream: { include: { class: true } } },
        },
      },
      orderBy: { admittedAt: "asc" },
    });
    const boys = students.filter((s) => s.gender === "MALE").length;
    return {
      columns: [
        { label: "Admission No" },
        { label: "Pupil" },
        { label: "Admitted" },
        { label: "Gender" },
        { label: "Class" },
        { label: "Guardian Phone" },
        { label: "Status" },
      ],
      rows: students.map((s) => {
        const e = s.enrollments[0];
        return [
          s.admissionNo,
          pupilName(s),
          isoDate(s.admittedAt),
          s.gender === "MALE" ? "Boy" : "Girl",
          e ? `${e.stream.class.name} ${e.stream.name}` : "—",
          s.guardians[0]?.phone ?? "—",
          s.archived ? "Exited" : "Active",
        ];
      }),
      summary: [
        { label: "Admitted", value: String(students.length) },
        { label: "Boys · Girls", value: `${boys} · ${students.length - boys}` },
      ],
    };
  }

  if (type === "exits") {
    const exitFilter = ["TRANSFERRED", "GRADUATED", "WITHDRAWN"].includes(params.exitType ?? "")
      ? (params.exitType as "TRANSFERRED" | "GRADUATED" | "WITHDRAWN")
      : null;
    const students = await db.student.findMany({
      where: { archived: true, exitType: exitFilter ? exitFilter : { not: null } },
      orderBy: { exitAt: "desc" },
    });
    const labels: Record<string, string> = {
      TRANSFERRED: "Transferred",
      GRADUATED: "Graduated",
      WITHDRAWN: "Withdrawn",
    };
    const owed = students.reduce((s, x) => s + Math.max(0, x.exitBalanceCents ?? 0), 0);
    return {
      columns: [
        { label: "Admission No" },
        { label: "Pupil" },
        { label: "Exit type" },
        { label: "Date" },
        { label: "Destination" },
        { label: "Balance at exit", kind: "money" },
      ],
      rows: students.map((s) => [
        s.admissionNo,
        pupilName(s),
        labels[s.exitType ?? ""] ?? s.exitType,
        s.exitAt ? isoDate(s.exitAt) : "—",
        s.exitDestination ?? "—",
        s.exitBalanceCents ?? 0,
      ]),
      summary: [
        { label: "Leavers", value: String(students.length) },
        {
          label: "Transferred · Graduated · Withdrawn",
          value: ["TRANSFERRED", "GRADUATED", "WITHDRAWN"]
            .map((t) => students.filter((s) => s.exitType === t).length)
            .join(" · "),
        },
        { label: "Unpaid balances", value: formatMoney(owed) },
      ],
    };
  }

  if (type === "dues") {
    const enrollments = await db.enrollment.findMany({
      where: { sessionId: session.id, ...pupilWhere(params) },
      include: { student: true, stream: { include: { class: true } } },
      orderBy: [{ stream: { class: { level: "asc" } } }, { student: { lastName: "asc" } }],
    });
    const rows: (string | number)[][] = [];
    let charged = 0;
    let paid = 0;
    let due = 0;
    let arrears = 0;
    let defaulters = 0;
    let listed = 0;
    for (const e of enrollments) {
      const b = await studentBalance(e.studentId, session.id);
      const t = await termBreakdown(e.studentId, session.id);
      // Owing filter: totals describe exactly the pupils listed in the table.
      if (params.owing === "owing" && b.balanceCents <= 0) continue;
      if (params.owing === "cleared" && b.balanceCents > 0) continue;
      listed += 1;
      charged += b.chargedCents;
      paid += b.paidCents;
      due += Math.max(0, b.balanceCents);
      arrears += t.arrearsCents;
      if (b.balanceCents > 0) defaulters += 1;
      rows.push([
        e.student.admissionNo,
        pupilName(e.student),
        `${e.stream.class.name} ${e.stream.name}`,
        b.chargedCents,
        b.paidCents,
        t.arrearsCents,
        b.balanceCents,
      ]);
    }
    return {
      columns: [
        { label: "Admission No" },
        { label: "Pupil" },
        { label: "Class" },
        { label: "Charged", kind: "money" },
        { label: "Paid", kind: "money" },
        { label: "Arrears", kind: "money" },
        { label: "Balance", kind: "money" },
      ],
      rows,
      summary: [
        { label: "Charged", value: formatMoney(charged) },
        { label: "Collected", value: formatMoney(paid) },
        { label: "Outstanding", value: formatMoney(due) },
        { label: "of which arrears", value: formatMoney(arrears) },
        { label: "Pupils owing", value: `${defaulters} of ${listed}` },
      ],
    };
  }

  if (type === "collections") {
    const bounds = rangeBounds(params.from, params.to);
    if (!bounds) return err("Pick a from and to date.");
    const method = ["CASH", "BANK", "CHEQUE", "MPESA"].includes(params.method ?? "")
      ? (params.method as "CASH" | "BANK" | "CHEQUE" | "MPESA")
      : null;
    const [payments, head] = await Promise.all([
      db.feePayment.findMany({
        where: {
          receivedAt: { gte: bounds[0], lt: bounds[1] },
          ...(method ? { method } : {}),
          ...(params.feeType ? { allocations: { some: { feeTypeId: params.feeType } } } : {}),
        },
        include: { student: true, allocations: { include: { feeType: true } } },
        orderBy: { receivedAt: "asc" },
      }),
      params.feeType ? db.feeType.findUnique({ where: { id: params.feeType } }) : null,
    ]);
    const total = payments.filter((p) => !p.voided).reduce((s, p) => s + p.amountCents, 0);
    const voided = payments.filter((p) => p.voided).length;
    const headCents = head
      ? payments
          .filter((p) => !p.voided)
          .flatMap((p) => p.allocations)
          .filter((a) => a.feeTypeId === head.id)
          .reduce((s, a) => s + a.amountCents, 0)
      : 0;
    return {
      columns: [
        { label: "Receipt" },
        { label: "Date" },
        { label: "Pupil" },
        { label: "Method" },
        { label: "Vote heads" },
        { label: "Amount", kind: "money" },
        { label: "Received by" },
        { label: "Voided" },
      ],
      rows: payments.map((p) => [
        p.receiptNo,
        isoDate(p.receivedAt),
        `${pupilName(p.student)} (${p.student.admissionNo})`,
        p.method,
        [...p.allocations]
          .sort((a, b) => a.feeType.name.localeCompare(b.feeType.name))
          .map((a) => `${a.feeType.name} ${(a.amountCents / 100).toLocaleString("en-KE")}`)
          .join(" + ") || "—",
        p.amountCents,
        p.receivedBy,
        p.voided ? "YES" : "",
      ]),
      summary: [
        { label: "Receipts", value: String(payments.length) },
        { label: "Collected (excl. voided)", value: formatMoney(total) },
        ...(head ? [{ label: `Allocated to ${head.name}`, value: formatMoney(headCents) }] : []),
        { label: "Voided", value: String(voided) },
      ],
    };
  }

  if (type === "daily") {
    const bounds = rangeBounds(params.from, params.to);
    if (!bounds) return err("Pick a from and to date.");
    const payments = await db.feePayment.findMany({
      where: { receivedAt: { gte: bounds[0], lt: bounds[1] } },
      orderBy: { receivedAt: "asc" },
    });
    const byDay = new Map<string, { receipts: number; voided: number; cents: number }>();
    for (const p of payments) {
      const day = isoDate(p.receivedAt);
      const t = byDay.get(day) ?? { receipts: 0, voided: 0, cents: 0 };
      t.receipts += 1;
      if (p.voided) t.voided += 1;
      else t.cents += p.amountCents;
      byDay.set(day, t);
    }
    const total = [...byDay.values()].reduce((s, t) => s + t.cents, 0);
    return {
      columns: [
        { label: "Date" },
        { label: "Receipts", kind: "num" },
        { label: "Voided", kind: "num" },
        { label: "Collected", kind: "money" },
      ],
      rows: [...byDay.entries()].map(([day, t]) => [day, t.receipts, t.voided, t.cents]),
      summary: [
        { label: "Days with collections", value: String(byDay.size) },
        { label: "Receipts", value: String(payments.length) },
        { label: "Collected (excl. voided)", value: formatMoney(total) },
      ],
    };
  }

  if (type === "income" || type === "expenses") {
    const bounds = monthBounds(params.month ?? "");
    if (!bounds) return err("Pick a month.");
    const kind = type === "income" ? "INCOME" : "EXPENSE";
    const [entries, feesAgg] = await Promise.all([
      db.financeEntry.findMany({
        where: { date: { gte: bounds[0], lt: bounds[1] }, head: { kind } },
        include: { head: true },
        orderBy: { date: "asc" },
      }),
      type === "income"
        ? db.feePayment.aggregate({
            _sum: { amountCents: true },
            where: { voided: false, receivedAt: { gte: bounds[0], lt: bounds[1] } },
          })
        : Promise.resolve(null),
    ]);
    const live = entries.filter((e) => !e.voided);
    const entryTotal = live.reduce((s, e) => s + e.amountCents, 0);
    const fees = feesAgg?._sum.amountCents ?? 0;
    const rows: (string | number)[][] = entries.map((e) => [
      isoDate(e.date),
      e.head.name,
      e.description,
      e.amountCents,
      e.recordedBy,
      e.voided ? "YES" : "",
    ]);
    if (type === "income")
      rows.unshift(["", "Fees collected (Fees module)", `Total receipts ${params.month}`, fees, "", ""]);
    return {
      columns: [
        { label: "Date" },
        { label: "Head" },
        { label: "Description" },
        { label: "Amount", kind: "money" },
        { label: "Recorded by" },
        { label: "Voided" },
      ],
      rows,
      summary:
        type === "income"
          ? [
              { label: "Fees collected", value: formatMoney(fees) },
              { label: "Other income", value: formatMoney(entryTotal) },
              { label: "Total income", value: formatMoney(fees + entryTotal) },
            ]
          : [
              { label: "Entries", value: String(entries.length) },
              { label: "Total expenses (excl. voided)", value: formatMoney(entryTotal) },
            ],
    };
  }

  if (type === "finance") {
    const bounds = monthBounds(params.month ?? "");
    if (!bounds) return err("Pick a month.");
    const [entries, feesAgg] = await Promise.all([
      db.financeEntry.findMany({
        where: { date: { gte: bounds[0], lt: bounds[1] } },
        include: { head: true },
        orderBy: { date: "asc" },
      }),
      db.feePayment.aggregate({
        _sum: { amountCents: true },
        where: { voided: false, receivedAt: { gte: bounds[0], lt: bounds[1] } },
      }),
    ]);
    const live = entries.filter((e) => !e.voided);
    const income = live.filter((e) => e.head.kind === "INCOME").reduce((s, e) => s + e.amountCents, 0);
    const expense = live.filter((e) => e.head.kind === "EXPENSE").reduce((s, e) => s + e.amountCents, 0);
    const fees = feesAgg._sum.amountCents ?? 0;
    return {
      columns: [
        { label: "Date" },
        { label: "Head" },
        { label: "Kind" },
        { label: "Description" },
        { label: "Amount", kind: "money" },
        { label: "Recorded by" },
        { label: "Voided" },
      ],
      rows: [
        ["", "Fees collected (Fees module)", "INCOME", `Total receipts ${params.month}`, fees, "", ""],
        ...entries.map((e) => [
          isoDate(e.date),
          e.head.name,
          e.head.kind,
          e.description,
          e.amountCents,
          e.recordedBy,
          e.voided ? "YES" : "",
        ]),
      ],
      summary: [
        { label: "Fees collected", value: formatMoney(fees) },
        { label: "Other income", value: formatMoney(income) },
        { label: "Expenses", value: formatMoney(expense) },
        { label: "Net", value: formatMoney(fees + income - expense) },
      ],
    };
  }

  if (type === "payroll") {
    const run = params.run
      ? await db.payrollRun.findUnique({
          where: { id: params.run },
          include: {
            items: { include: { staff: true }, orderBy: { staff: { employeeNo: "asc" } } },
          },
        })
      : null;
    if (!run) return err("Pick a payroll run — generate one under Payroll first.");
    const gross = run.items.reduce((s, i) => s + i.grossCents, 0);
    const net = run.items.reduce((s, i) => s + i.netCents, 0);
    return {
      columns: [
        { label: "Employee No" },
        { label: "Staff" },
        { label: "Basic", kind: "money" },
        { label: "Allowances", kind: "money" },
        { label: "Gross", kind: "money" },
        { label: "NSSF", kind: "money" },
        { label: "SHIF", kind: "money" },
        { label: "PAYE", kind: "money" },
        { label: "Other ded.", kind: "money" },
        { label: "Net pay", kind: "money" },
      ],
      rows: run.items.map((i) => [
        i.staff.employeeNo,
        pupilName(i.staff),
        i.basicCents,
        i.allowancesCents,
        i.grossCents,
        i.nssfCents,
        i.shifCents,
        i.payeCents,
        i.otherDeductCents,
        i.netCents,
      ]),
      summary: [
        { label: "Month", value: run.month },
        { label: "Status", value: run.status },
        { label: "Staff", value: String(run.items.length) },
        { label: "Gross total", value: formatMoney(gross) },
        { label: "Net total", value: formatMoney(net) },
      ],
    };
  }

  if (type === "attendance") {
    const { stream = "", month = "" } = params;
    const bounds = monthBounds(month);
    if (!stream || !bounds) return err("Pick a stream and month.");
    const [y, m] = month.split("-").map(Number);
    const enrollments = await db.enrollment.findMany({
      where: { streamId: stream, sessionId: session.id, student: { archived: false } },
      include: { student: true, attendance: { where: { date: { gte: bounds[0], lt: bounds[1] } } } },
      orderBy: { student: { lastName: "asc" } },
    });
    const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const code: Record<string, string> = { PRESENT: "P", ABSENT: "A", LATE: "L", HALF_DAY: "H" };
    let presentTotal = 0;
    let markedTotal = 0;
    const rows = enrollments.map((e) => {
      const byDay = new Map(e.attendance.map((a) => [a.date.getUTCDate(), a.status]));
      const present = e.attendance.filter((a) => a.status !== "ABSENT").length;
      presentTotal += present;
      markedTotal += e.attendance.length;
      return [
        e.student.admissionNo,
        pupilName(e.student),
        ...Array.from({ length: daysInMonth }, (_, i) => code[byDay.get(i + 1) ?? ""] ?? ""),
        present,
        e.attendance.length,
      ];
    });
    return {
      columns: [
        { label: "Admission No" },
        { label: "Pupil" },
        ...Array.from({ length: daysInMonth }, (_, i) => ({ label: String(i + 1), kind: "num" as const })),
        { label: "Present", kind: "num" },
        { label: "Marked", kind: "num" },
      ],
      rows,
      summary: [
        { label: "Pupils", value: String(enrollments.length) },
        {
          label: "Attendance",
          value: markedTotal > 0 ? `${Math.round((presentTotal / markedTotal) * 100)}%` : "—",
        },
      ],
    };
  }

  if (type === "staff-attendance") {
    const bounds = monthBounds(params.month ?? "");
    if (!bounds) return err("Pick a month.");
    const staff = await db.staffProfile.findMany({
      where: { archived: false },
      include: { attendance: { where: { date: { gte: bounds[0], lt: bounds[1] } } } },
      orderBy: { employeeNo: "asc" },
    });
    let presentTotal = 0;
    let markedTotal = 0;
    const count = (records: { status: string }[], status: string) =>
      records.filter((r) => r.status === status).length;
    const rows = staff.map((s) => {
      const present = s.attendance.filter((a) => a.status !== "ABSENT").length;
      presentTotal += present;
      markedTotal += s.attendance.length;
      return [
        s.employeeNo,
        pupilName(s),
        s.designation,
        count(s.attendance, "PRESENT"),
        count(s.attendance, "LATE"),
        count(s.attendance, "HALF_DAY"),
        count(s.attendance, "ON_LEAVE"),
        count(s.attendance, "ABSENT"),
        s.attendance.length,
      ];
    });
    return {
      columns: [
        { label: "Employee No" },
        { label: "Staff" },
        { label: "Designation" },
        { label: "Present", kind: "num" },
        { label: "Late", kind: "num" },
        { label: "Half day", kind: "num" },
        { label: "On leave", kind: "num" },
        { label: "Absent", kind: "num" },
        { label: "Marked", kind: "num" },
      ],
      rows,
      summary: [
        { label: "Staff", value: String(staff.length) },
        {
          label: "Attendance",
          value: markedTotal > 0 ? `${Math.round((presentTotal / markedTotal) * 100)}%` : "—",
        },
      ],
    };
  }

  if (type === "results") {
    const { exam = "", stream = "" } = params;
    const results = exam && stream ? await streamResults(exam, stream) : null;
    if (!results) return err("Pick an exam and a stream.");
    const marked = results.rows.filter((r) => r.subjectsMarked > 0);
    const classAvg =
      marked.length > 0 ? marked.reduce((s, r) => s + r.averagePct, 0) / marked.length : 0;
    return {
      columns: [
        { label: "Pos", kind: "num" },
        { label: "Admission No" },
        { label: "Pupil" },
        ...results.subjects.map((s) => ({ label: s.code ?? s.name, kind: "num" as const })),
        { label: "Total", kind: "num" },
        { label: "Avg %", kind: "num" },
        { label: "Level" },
      ],
      rows: [...results.rows]
        .sort((a, b) => a.position - b.position)
        .map((r) => [
          r.subjectsMarked > 0 ? r.position : "",
          r.admissionNo,
          r.name,
          ...results.subjects.map((s) =>
            r.scores.has(s.id) ? (r.scores.get(s.id) ?? "ABS") : "",
          ),
          r.subjectsMarked > 0 ? r.totalScore : "",
          r.subjectsMarked > 0 ? r.averagePct.toFixed(1) : "",
          r.subjectsMarked > 0 ? cbcLevel(r.averagePct, 100).code : "",
        ]),
      summary: [
        { label: "Exam", value: `${results.exam.name} · out of ${results.exam.maxMarks}` },
        { label: "Pupils marked", value: `${marked.length} of ${results.rows.length}` },
        { label: "Class average", value: `${classAvg.toFixed(1)}%` },
      ],
    };
  }

  if (type === "staff") {
    const staff = await db.staffProfile.findMany({
      where: { archived: false },
      include: { user: true, salary: true },
      orderBy: { employeeNo: "asc" },
    });
    return {
      columns: [
        { label: "Employee No" },
        { label: "Name" },
        { label: "Designation" },
        { label: "Department" },
        { label: "Phone" },
        { label: "Login" },
        { label: "Gross salary", kind: "money" },
      ],
      rows: staff.map((s) => [
        s.employeeNo,
        pupilName(s),
        s.designation,
        s.department ?? "—",
        s.phone ?? "—",
        s.user?.username ?? "—",
        s.salary ? s.salary.basicCents + s.salary.allowancesCents : null,
      ]),
      summary: [{ label: "Active staff", value: String(staff.length) }],
    };
  }

  if (type === "leave") {
    const bounds = rangeBounds(params.from, params.to);
    if (!bounds) return err("Pick a from and to date.");
    const leaveStatus = ["PENDING", "APPROVED", "REJECTED"].includes(params.leaveStatus ?? "")
      ? (params.leaveStatus as "PENDING" | "APPROVED" | "REJECTED")
      : null;
    const leaves = await db.leaveApplication.findMany({
      where: {
        startDate: { gte: bounds[0], lt: bounds[1] },
        ...(leaveStatus ? { status: leaveStatus } : {}),
      },
      include: { staff: true, leaveType: true },
      orderBy: { startDate: "asc" },
    });
    const approved = leaves.filter((l) => l.status === "APPROVED");
    return {
      columns: [
        { label: "Employee No" },
        { label: "Staff" },
        { label: "Leave type" },
        { label: "From" },
        { label: "To" },
        { label: "Days", kind: "num" },
        { label: "Status" },
        { label: "Reason" },
      ],
      rows: leaves.map((l) => [
        l.staff.employeeNo,
        pupilName(l.staff),
        l.leaveType.name,
        isoDate(l.startDate),
        isoDate(l.endDate),
        l.days,
        l.status,
        l.reason,
      ]),
      summary: [
        { label: "Applications", value: String(leaves.length) },
        { label: "Approved", value: String(approved.length) },
        { label: "Pending", value: String(leaves.filter((l) => l.status === "PENDING").length) },
        { label: "Days approved", value: String(approved.reduce((s, l) => s + l.days, 0)) },
      ],
    };
  }

  return err("Unknown report type.");
}
