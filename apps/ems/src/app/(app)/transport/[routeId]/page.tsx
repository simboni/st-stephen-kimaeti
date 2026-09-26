import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { can, requirePermission } from "@/lib/rbac";
import { getActiveSession } from "@/lib/school";
import { formatMoney } from "@/lib/money";
import { ChevronLeftIcon, CloseIcon } from "@/components/icons";
import {
  addStage,
  assignPupil,
  removeRouteFee,
  removeStage,
  setRouteFee,
  unassignPupil,
} from "@/lib/actions/transport-actions";

export const metadata: Metadata = { title: "Route" };

const DIRECTION_LABEL: Record<string, string> = {
  BOTH: "Both ways",
  MORNING: "Morning only",
  EVENING: "Evening only",
};

export default async function RoutePage({
  params,
  searchParams,
}: {
  params: Promise<{ routeId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requirePermission("transport", "view");
  const { routeId } = await params;
  const sp = await searchParams;
  const session = await getActiveSession();

  const [route, mayEdit, maySetFees] = await Promise.all([
    db.transportRoute.findUnique({
      where: { id: routeId },
      include: {
        stages: { orderBy: { position: "asc" } },
        vehicles: { where: { archived: false } },
      },
    }),
    can(user.role, "transport", "edit"),
    can(user.role, "fees", "create"),
  ]);
  if (!route) notFound();

  const [riders, fees, terms, feeTypes, unassigned] = await Promise.all([
    session
      ? db.transportAssignment.findMany({
          where: { routeId, sessionId: session.id },
          include: {
            student: true,
            stage: true,
          },
          orderBy: { student: { lastName: "asc" } },
        })
      : [],
    session
      ? db.feeItem.findMany({
          where: { routeId, sessionId: session.id, archived: false },
          include: { feeType: true, term: true },
          orderBy: [{ term: { number: "asc" } }],
        })
      : [],
    session
      ? db.term.findMany({ where: { sessionId: session.id }, orderBy: { number: "asc" } })
      : [],
    db.feeType.findMany({ where: { archived: false }, orderBy: { name: "asc" } }),
    // Pupils enrolled this session who are not yet on any route.
    session
      ? db.enrollment.findMany({
          where: {
            sessionId: session.id,
            student: { archived: false, transport: { none: { sessionId: session.id } } },
          },
          include: { student: true, stream: { include: { class: true } } },
          orderBy: [{ stream: { class: { level: "asc" } } }, { student: { lastName: "asc" } }],
        })
      : [],
  ]);

  const capacity = route.vehicles.reduce((s, v) => s + v.capacity, 0);
  const yearly = fees.reduce((s, f) => s + f.amountCents, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Link
          href="/transport"
          className="mb-2 inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:underline"
        >
          <ChevronLeftIcon className="h-3.5 w-3.5" /> All routes
        </Link>
        <h1 className="font-display text-2xl font-extrabold text-ink-900">{route.name}</h1>
        <p className="mt-1 text-sm">
          {route.description ?? "No area description"}
          {session ? ` · ${session.name}` : ""}
        </p>
      </div>

      {sp.error && (
        <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800">
          {sp.error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <span className="chip bg-paper-200 text-ink-700">
          Riding: <b className="ml-1 text-ink-900">{riders.length}</b>
        </span>
        {capacity > 0 && (
          <span
            className={`chip ${
              riders.length > capacity ? "bg-danger-500/10 text-danger-500" : "bg-paper-200 text-ink-700"
            }`}
          >
            Seats: <b className="ml-1">{riders.length} of {capacity}</b>
          </span>
        )}
        <span className="chip bg-paper-200 text-ink-700">
          Fee per year: <b className="ml-1 text-ink-900">{yearly > 0 ? formatMoney(yearly) : "not set"}</b>
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Stages */}
        <section className="card p-6">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-ink-400">
            Stages, in travel order
          </h2>
          <ol className="space-y-2">
            {route.stages.length === 0 && (
              <li className="text-sm text-ink-400">No stages yet.</li>
            )}
            {route.stages.map((s, i) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-paper-100 px-4 py-2.5"
              >
                <span className="text-sm">
                  <span className="mr-2 font-mono text-xs text-ink-400">{i + 1}</span>
                  <span className="font-semibold text-ink-900">{s.name}</span>
                </span>
                {mayEdit && (
                  <form action={removeStage}>
                    <input type="hidden" name="id" value={s.id} />
                    <button
                      type="submit"
                      className="btn btn-danger !p-1.5"
                      aria-label={`Remove ${s.name}`}
                    >
                      <CloseIcon className="h-3 w-3" />
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ol>
          {mayEdit && (
            <form action={addStage} className="mt-4 flex gap-2">
              <input type="hidden" name="routeId" value={route.id} />
              <input
                name="name"
                placeholder="Add a stage"
                aria-label="Stage name"
                className="field !py-2 text-sm"
              />
              <button type="submit" className="btn btn-secondary !py-2 text-xs">
                Add
              </button>
            </form>
          )}
        </section>

        {/* Charges */}
        <section className="card p-6">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-ink-400">
            What riders are charged
          </h2>
          <table className="table-admin">
            <thead>
              <tr>
                <th>Vote head</th>
                <th>Term</th>
                <th className="text-right">Amount</th>
                {maySetFees && <th />}
              </tr>
            </thead>
            <tbody>
              {fees.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-ink-400">
                    No charge set — riders on this route are billed nothing.
                  </td>
                </tr>
              )}
              {fees.map((f) => (
                <tr key={f.id}>
                  <td className="font-semibold text-ink-900">{f.feeType.name}</td>
                  <td className="text-ink-500">{f.term?.name ?? "Whole year"}</td>
                  <td className="text-right font-semibold">{formatMoney(f.amountCents)}</td>
                  {maySetFees && (
                    <td className="text-right">
                      <form action={removeRouteFee}>
                        <input type="hidden" name="id" value={f.id} />
                        <button type="submit" className="btn btn-danger !p-1.5" aria-label="Remove charge">
                          <CloseIcon className="h-3 w-3" />
                        </button>
                      </form>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {maySetFees && session && (
            <form action={setRouteFee} className="mt-4 grid grid-cols-2 gap-2">
              <input type="hidden" name="routeId" value={route.id} />
              <select name="feeTypeId" aria-label="Vote head" className="field !py-2 text-sm">
                {feeTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <select name="termId" aria-label="Term" defaultValue="" className="field !py-2 text-sm">
                <option value="">Whole year</option>
                {terms.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <input
                name="amount"
                placeholder="2,500"
                aria-label="Amount"
                inputMode="decimal"
                className="field !py-2 text-sm"
              />
              <button type="submit" className="btn btn-secondary !py-2 text-xs">
                Set charge
              </button>
            </form>
          )}
          <p className="mt-3 text-xs text-ink-400">
            A charge here reaches only the pupils on this route, and appears on
            their fee statement from the moment they are assigned.
          </p>
        </section>
      </div>

      {/* Riders */}
      <section className="card p-6">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-ink-400">
          Pupils on this route
        </h2>
        <div className="overflow-x-auto">
          <table className="table-admin">
            <thead>
              <tr>
                <th>Admission No</th>
                <th>Pupil</th>
                <th>Stage</th>
                <th>Direction</th>
                {mayEdit && <th />}
              </tr>
            </thead>
            <tbody>
              {riders.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-ink-400">
                    Nobody assigned yet.
                  </td>
                </tr>
              )}
              {riders.map((a) => (
                <tr key={a.id}>
                  <td className="whitespace-nowrap font-mono text-xs">{a.student.admissionNo}</td>
                  <td className="font-semibold text-ink-900">
                    {a.student.lastName}, {a.student.firstName}
                  </td>
                  <td className="text-ink-500">{a.stage?.name ?? "—"}</td>
                  <td className="text-ink-500">{DIRECTION_LABEL[a.direction]}</td>
                  {mayEdit && (
                    <td className="text-right">
                      <form action={unassignPupil}>
                        <input type="hidden" name="id" value={a.id} />
                        <button type="submit" className="btn btn-secondary !px-3 !py-1.5 text-xs">
                          Remove
                        </button>
                      </form>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {mayEdit && session && (
          <form action={assignPupil} className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-4">
            <input type="hidden" name="routeId" value={route.id} />
            <select name="studentId" aria-label="Pupil" className="field !py-2 text-sm sm:col-span-2">
              <option value="">Choose a pupil…</option>
              {unassigned.map((e) => (
                <option key={e.studentId} value={e.studentId}>
                  {e.student.lastName}, {e.student.firstName} — {e.stream.class.name}
                </option>
              ))}
            </select>
            <select name="stageId" aria-label="Stage" defaultValue="" className="field !py-2 text-sm">
              <option value="">No stage</option>
              {route.stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select name="direction" aria-label="Direction" defaultValue="BOTH" className="field !py-2 text-sm">
              <option value="BOTH">Both ways</option>
              <option value="MORNING">Morning only</option>
              <option value="EVENING">Evening only</option>
            </select>
            <button type="submit" className="btn btn-primary !py-2 text-xs sm:col-span-4">
              Assign to this route
            </button>
          </form>
        )}
        {unassigned.length === 0 && mayEdit && (
          <p className="mt-3 text-xs text-ink-400">
            Every enrolled pupil is already on a route.
          </p>
        )}
      </section>
    </div>
  );
}
