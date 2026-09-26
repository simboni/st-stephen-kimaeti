import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { getActiveSession } from "@/lib/school";
import { buildReport, findReport, type ReportParams } from "@/lib/reports";
import { formatMoney } from "@/lib/money";
import { ChevronLeftIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Reports" };

const PAGE_SIZE = 20;

/** A labelled dropdown filter whose empty first option means "no filter". */
function Select({
  id,
  label,
  value,
  all,
  children,
}: {
  id: string;
  label: string;
  value: string | undefined;
  all: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-bold text-ink-400">
        {label}
      </label>
      <select id={id} name={id} defaultValue={value ?? ""} className="field !w-40 !py-1.5 text-sm">
        <option value="">{all}</option>
        {children}
      </select>
    </div>
  );
}

function nairobiToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** One report: filters on top, the data table below, paginated. */
export default async function ReportViewPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission("reports", "view");
  const { type } = await params;
  const found = findReport(type);
  if (!found) notFound();
  const { category, report, siblings } = found;
  const sp = await searchParams;
  const session = await getActiveSession();
  const pageNum = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  // Filter option lists, loaded only when this report uses them.
  const has = (f: string) => report.filters.includes(f as (typeof report.filters)[number]);
  const needsStream = has("stream");
  const needsExam = has("exam");
  const needsRun = has("run");
  const [classes, exams, runs, feeTypes] = await Promise.all([
    needsStream || has("class")
      ? db.schoolClass.findMany({
          where: { archived: false },
          include: { streams: { where: { archived: false }, orderBy: { name: "asc" } } },
          orderBy: { level: "asc" },
        })
      : [],
    needsExam && session
      ? db.exam.findMany({
          where: { sessionId: session.id, archived: false },
          include: { term: true },
          orderBy: { createdAt: "desc" },
        })
      : [],
    needsRun ? db.payrollRun.findMany({ orderBy: { month: "desc" } }) : [],
    has("feeType")
      ? db.feeType.findMany({ where: { archived: false }, orderBy: { name: "asc" } })
      : [],
  ]);
  const allStreams = classes.flatMap((c) =>
    c.streams.map((st) => ({ id: st.id, label: `${c.name} ${st.name}` })),
  );

  // Defaults so every report renders something sensible on first open.
  const today = nairobiToday();
  const month = today.slice(0, 7);
  const defaultFrom =
    report.rangeDefault === "year"
      ? `${Number(today.slice(0, 4)) - 1}-${today.slice(5)}`
      : `${month}-01`;
  const reportParams: ReportParams = {
    stream: sp.stream || allStreams[0]?.id,
    month: sp.month || month,
    from: sp.from || defaultFrom,
    to: sp.to || today,
    exam: sp.exam || exams[0]?.id,
    run: sp.run || runs[0]?.id,
    // Narrowing filters default to "everything" — an empty value means no filter.
    class: sp.class || undefined,
    gender: sp.gender || undefined,
    boarding: sp.boarding || undefined,
    owing: sp.owing || undefined,
    method: sp.method || undefined,
    feeType: sp.feeType || undefined,
    exitType: sp.exitType || undefined,
    leaveStatus: sp.leaveStatus || undefined,
  };

  const data = session ? await buildReport(type, reportParams, session) : null;
  const totalRows = data?.rows.length ?? 0;
  const pages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const page = Math.min(pageNum, pages);
  const pageRows = data?.rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) ?? [];

  const effective = new URLSearchParams();
  effective.set("type", type);
  for (const k of [
    "stream", "month", "from", "to", "exam", "run",
    "class", "gender", "boarding", "owing", "method", "feeType", "exitType", "leaveStatus",
  ] as const) {
    if (reportParams[k]) effective.set(k, reportParams[k]!);
  }
  const pageQuery = (p: number) => {
    const q = new URLSearchParams(effective);
    q.delete("type");
    q.set("page", String(p));
    return `?${q}`;
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Link
          href="/reports"
          className="mb-2 inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:underline"
        >
          <ChevronLeftIcon className="h-3.5 w-3.5" /> All reports
        </Link>
        <h1 className="font-display text-2xl font-extrabold text-ink-900">{report.label}</h1>
        <p className="mt-1 text-sm">
          {category} · {report.description}
          {session ? ` — ${session.name}` : ""}
        </p>
      </div>

      {/* Sibling reports in the same category */}
      <div className="flex flex-wrap gap-2">
        {siblings.map((r) => (
          <Link
            key={r.key}
            href={`/reports/${r.key}`}
            className={`chip cursor-pointer ${
              r.key === type
                ? "bg-brand-500 !text-white"
                : "bg-paper-200 text-ink-700 hover:bg-paper-300"
            }`}
          >
            {r.label}
          </Link>
        ))}
      </div>

      {/* Filters */}
      <form method="get" className="card flex flex-wrap items-end gap-3 p-4">
        {has("class") && (
          <Select id="class" label="Class / Grade" value={sp.class} all="All classes">
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        )}
        {has("gender") && (
          <Select id="gender" label="Gender" value={sp.gender} all="Boys & girls">
            <option value="MALE">Boys</option>
            <option value="FEMALE">Girls</option>
          </Select>
        )}
        {has("boarding") && (
          <Select id="boarding" label="Day / Boarding" value={sp.boarding} all="All pupils">
            <option value="DAY">Day scholars</option>
            <option value="BOARDER">Boarders</option>
          </Select>
        )}
        {has("owing") && (
          <Select id="owing" label="Fee status" value={sp.owing} all="All pupils">
            <option value="owing">Owing only</option>
            <option value="cleared">Cleared only</option>
          </Select>
        )}
        {has("method") && (
          <Select id="method" label="Payment method" value={sp.method} all="All methods">
            {["CASH", "MPESA", "BANK", "CHEQUE"].map((m) => (
              <option key={m} value={m}>
                {m.charAt(0) + m.slice(1).toLowerCase()}
              </option>
            ))}
          </Select>
        )}
        {has("feeType") && (
          <Select id="feeType" label="Vote head" value={sp.feeType} all="All vote heads">
            {feeTypes.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </Select>
        )}
        {has("exitType") && (
          <Select id="exitType" label="Exit type" value={sp.exitType} all="All leavers">
            <option value="TRANSFERRED">Transferred</option>
            <option value="GRADUATED">Graduated</option>
            <option value="WITHDRAWN">Withdrawn</option>
          </Select>
        )}
        {has("leaveStatus") && (
          <Select id="leaveStatus" label="Status" value={sp.leaveStatus} all="All statuses">
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </Select>
        )}
        {needsStream && (
          <div>
            <label htmlFor="stream" className="mb-1 block text-xs font-bold text-ink-400">
              Stream
            </label>
            <select id="stream" name="stream" defaultValue={reportParams.stream ?? ""} className="field !w-40 !py-1.5 text-sm">
              {allStreams.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        )}
        {needsExam && (
          <div>
            <label htmlFor="exam" className="mb-1 block text-xs font-bold text-ink-400">
              Exam
            </label>
            <select id="exam" name="exam" defaultValue={reportParams.exam ?? ""} className="field !w-48 !py-1.5 text-sm">
              {exams.length === 0 && <option value="">No exams yet</option>}
              {exams.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.term.name})
                </option>
              ))}
            </select>
          </div>
        )}
        {needsRun && (
          <div>
            <label htmlFor="run" className="mb-1 block text-xs font-bold text-ink-400">
              Payroll run
            </label>
            <select id="run" name="run" defaultValue={reportParams.run ?? ""} className="field !w-44 !py-1.5 text-sm">
              {runs.length === 0 && <option value="">No runs yet</option>}
              {runs.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.month} ({r.status})
                </option>
              ))}
            </select>
          </div>
        )}
        {report.filters.includes("month") && (
          <div>
            <label htmlFor="month" className="mb-1 block text-xs font-bold text-ink-400">
              Month
            </label>
            <input id="month" name="month" type="month" defaultValue={reportParams.month} className="field !w-40 !py-1.5 text-sm" />
          </div>
        )}
        {report.filters.includes("range") && (
          <>
            <div>
              <label htmlFor="from" className="mb-1 block text-xs font-bold text-ink-400">
                From
              </label>
              <input id="from" name="from" type="date" defaultValue={reportParams.from} className="field !py-1.5 text-sm" />
            </div>
            <div>
              <label htmlFor="to" className="mb-1 block text-xs font-bold text-ink-400">
                To
              </label>
              <input id="to" name="to" type="date" defaultValue={reportParams.to} className="field !py-1.5 text-sm" />
            </div>
          </>
        )}

        {report.filters.length > 0 && (
          <button type="submit" className="btn btn-primary !py-1.5 text-xs">
            View report
          </button>
        )}
        <a href={`/reports/export?${effective}`} className="btn btn-secondary !py-1.5 text-xs">
          Download CSV
        </a>
      </form>

      {!session ? (
        <p className="card p-6 text-sm">No active session — set one in Settings first.</p>
      ) : data?.error ? (
        <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800">
          {data.error}
        </p>
      ) : (
        <>
          {/* Summary chips */}
          {data && data.summary.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.summary.map((s) => (
                <span key={s.label} className="chip bg-paper-200 text-ink-700">
                  {s.label}: <b className="ml-1 text-ink-900">{s.value}</b>
                </span>
              ))}
            </div>
          )}

          {/* Data table */}
          <div className="card overflow-x-auto">
            <table className="table-admin">
              <thead>
                <tr>
                  {data?.columns.map((c, i) => (
                    <th key={`${c.label}-${i}`} className={c.kind === "money" || c.kind === "num" ? "text-right" : ""}>
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 && (
                  <tr>
                    <td colSpan={data?.columns.length ?? 1} className="text-center text-ink-400">
                      No rows for these filters.
                    </td>
                  </tr>
                )}
                {pageRows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => {
                      const col = data!.columns[ci];
                      if (col.kind === "money" && typeof cell === "number") {
                        return (
                          <td key={ci} className={`text-right font-semibold ${cell > 0 ? "text-ink-900" : cell < 0 ? "text-leaf-600" : "text-ink-400"}`}>
                            {formatMoney(cell)}
                          </td>
                        );
                      }
                      return (
                        <td
                          key={ci}
                          className={
                            col.kind === "num"
                              ? "text-right"
                              : ci === 0
                                ? "whitespace-nowrap font-mono text-xs"
                                : ci === 1
                                  ? "font-semibold text-ink-900"
                                  : "text-ink-500"
                          }
                        >
                          {cell === null || cell === "" ? <span className="text-ink-300">—</span> : String(cell)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalRows > PAGE_SIZE && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-ink-400">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalRows)} of{" "}
                {totalRows} rows
              </p>
              <div className="flex items-center gap-1.5">
                <Link
                  href={pageQuery(Math.max(1, page - 1))}
                  aria-disabled={page === 1}
                  className={`btn btn-secondary !px-3 !py-1.5 text-xs ${page === 1 ? "pointer-events-none opacity-40" : ""}`}
                >
                  ← Prev
                </Link>
                <span className="px-2 text-xs font-bold text-ink-700">
                  Page {page} of {pages}
                </span>
                <Link
                  href={pageQuery(Math.min(pages, page + 1))}
                  aria-disabled={page === pages}
                  className={`btn btn-secondary !px-3 !py-1.5 text-xs ${page === pages ? "pointer-events-none opacity-40" : ""}`}
                >
                  Next →
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
