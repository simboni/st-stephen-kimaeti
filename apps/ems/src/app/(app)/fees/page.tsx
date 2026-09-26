import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { getActiveSession } from "@/lib/school";
import { streamBalances, termBreakdown } from "@/lib/fees";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = { title: "Fees Collection" };

export default async function FeesPage({
  searchParams,
}: {
  searchParams: Promise<{ stream?: string; q?: string }>;
}) {
  await requirePermission("fees", "view");
  const { stream: streamParam = "", q = "" } = await searchParams;

  const [classes, session] = await Promise.all([
    db.schoolClass.findMany({
      where: { archived: false },
      include: { streams: { where: { archived: false }, orderBy: { name: "asc" } } },
      orderBy: { level: "asc" },
    }),
    getActiveSession(),
  ]);
  const allStreams = classes.flatMap((c) =>
    c.streams.map((st) => ({ id: st.id, label: `${c.name} ${st.name}` })),
  );
  const selectedStream = allStreams.find((s) => s.id === streamParam) ?? allStreams[0];

  const matches = q
    ? await db.student.findMany({
        where: {
          archived: false,
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { admissionNo: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 8,
        orderBy: { lastName: "asc" },
      })
    : [];

  const base =
    session && selectedStream && !q ? await streamBalances(selectedStream.id, session.id) : [];
  const rows = await Promise.all(
    base.map(async (r) => ({
      ...r,
      breakdown: await termBreakdown(r.student.id, session!.id),
    })),
  );
  const totals = rows.reduce(
    (acc, r) => ({
      charged: acc.charged + r.balance.chargedCents,
      paid: acc.paid + r.balance.paidCents,
      due: acc.due + Math.max(0, r.balance.balanceCents),
      arrears: acc.arrears + r.breakdown.arrearsCents,
    }),
    { charged: 0, paid: 0, due: 0, arrears: 0 },
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink-900">Fees Collection</h1>
          <p className="mt-1 text-sm">
            Find a pupil to collect, or review a class&rsquo;s balances
            {session ? ` — ${session.name}` : ""}.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <form method="get">
            <label htmlFor="q" className="mb-1 block text-xs font-bold text-ink-400">
              Find pupil
            </label>
            <input id="q" name="q" defaultValue={q} placeholder="Name or admission no…" className="field !w-56 !py-1.5 text-sm" />
          </form>
          <form method="get" className="flex items-end gap-2">
            <div>
              <label htmlFor="stream" className="mb-1 block text-xs font-bold text-ink-400">
                Class balances
              </label>
              <select id="stream" name="stream" defaultValue={selectedStream?.id ?? ""} className="field !w-40 !py-1.5 text-sm">
                {allStreams.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-secondary !px-4 !py-1.5 text-xs">
              View
            </button>
          </form>
        </div>
      </div>

      {q && (
        <div className="card overflow-x-auto">
          <table className="table-admin">
            <thead>
              <tr>
                <th>Adm No.</th>
                <th>Pupil</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {matches.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center text-ink-400">
                    No pupils match &ldquo;{q}&rdquo;.
                  </td>
                </tr>
              )}
              {matches.map((s) => (
                <tr key={s.id}>
                  <td className="font-mono text-xs">{s.admissionNo}</td>
                  <td className="font-semibold text-ink-900">
                    {s.lastName}, {s.firstName}
                  </td>
                  <td className="text-right">
                    <Link href={`/fees/${s.id}`} className="btn btn-primary !px-4 !py-1.5 text-xs">
                      Open account
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!q && session && selectedStream && (
        <>
          <div className="flex flex-wrap gap-2">
            <span className="chip bg-paper-200 text-ink-700">Charged: {formatMoney(totals.charged)}</span>
            <span className="chip bg-leaf-500/15 text-leaf-600">Collected: {formatMoney(totals.paid)}</span>
            <span className="chip bg-danger-500/10 text-danger-500">Outstanding: {formatMoney(totals.due)}</span>
            <span className="chip bg-danger-500/10 text-danger-500">
              of which arrears: {formatMoney(totals.arrears)}
            </span>
          </div>
          <div className="card overflow-x-auto">
            <table className="table-admin">
              <thead>
                <tr>
                  <th>Adm No.</th>
                  <th>Pupil</th>
                  <th className="text-right">Charged</th>
                  <th className="text-right">Paid</th>
                  <th className="text-right">Arrears</th>
                  <th className="text-right">Balance</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map(({ student, balance, breakdown }) => (
                  <tr key={student.id}>
                    <td className="font-mono text-xs">{student.admissionNo}</td>
                    <td className="font-semibold text-ink-900">
                      {student.lastName}, {student.firstName}
                    </td>
                    <td className="text-right">{formatMoney(balance.chargedCents)}</td>
                    <td className="text-right">{formatMoney(balance.paidCents)}</td>
                    <td className={`text-right ${breakdown.arrearsCents > 0 ? "font-bold text-danger-500" : "text-ink-300"}`}>
                      {breakdown.arrearsCents > 0 ? formatMoney(breakdown.arrearsCents) : "—"}
                    </td>
                    <td className={`text-right font-bold ${balance.balanceCents > 0 ? "text-danger-500" : "text-leaf-600"}`}>
                      {formatMoney(balance.balanceCents)}
                    </td>
                    <td className="text-right">
                      <Link href={`/fees/${student.id}`} className="btn btn-secondary !px-3 !py-1.5 text-xs">
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
