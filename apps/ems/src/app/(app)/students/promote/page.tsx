import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { getActiveSession } from "@/lib/school";
import { runPromotion } from "@/lib/actions/promotion-actions";

export const metadata: Metadata = { title: "Promotions" };

export default async function PromotePage({
  searchParams,
}: {
  searchParams: Promise<{
    done?: string;
    promoted?: string;
    repeated?: string;
    graduated?: string;
    skipped?: string;
    target?: string;
  }>;
}) {
  await requirePermission("students", "edit");
  const sp = await searchParams;

  const [source, sessions, classes] = await Promise.all([
    getActiveSession(),
    db.academicSession.findMany({ orderBy: { startDate: "desc" } }),
    db.schoolClass.findMany({
      where: { archived: false },
      include: { streams: { where: { archived: false }, orderBy: { name: "asc" } } },
      orderBy: { level: "asc" },
    }),
  ]);
  if (!source)
    return <p className="card p-6 text-sm">No active session — set one in Settings first.</p>;

  const targets = sessions.filter((s) => s.id !== source.id);
  const maxLevel = Math.max(...classes.map((c) => c.level));
  const classByLevel = new Map(classes.map((c) => [c.level, c]));

  const enrollments = await db.enrollment.findMany({
    where: { sessionId: source.id, student: { archived: false } },
    include: { student: true, stream: { include: { class: true } } },
    orderBy: [{ stream: { class: { level: "asc" } } }, { student: { lastName: "asc" } }],
  });

  const groups = classes
    .map((cls) => ({
      cls,
      next: cls.level >= maxLevel ? null : (classByLevel.get(cls.level + 1) ?? null),
      pupils: enrollments.filter((e) => e.stream.classId === cls.id),
    }))
    .filter((g) => g.pupils.length > 0);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-400">
          <Link href="/students" className="hover:text-brand-600">Students</Link>
        </p>
        <h1 className="font-display text-2xl font-extrabold text-ink-900">
          Promotions — end of {source.name}
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed">
          Every pupil moves one class up in the target session; tick <b>Repeat</b> to keep
          a pupil in their current class instead. Pupils in{" "}
          {classByLevel.get(maxLevel)?.name ?? "the top class"} graduate and are archived
          as leavers. Enrollment history stays intact per session.
        </p>
      </div>

      {sp.done && (
        <p className="rounded-xl bg-leaf-500/10 px-4 py-3 text-sm font-semibold text-leaf-600">
          Promotion into {sp.target} complete — {sp.promoted} promoted, {sp.repeated}{" "}
          repeating, {sp.graduated} graduated, {sp.skipped} already placed/skipped. Activate{" "}
          {sp.target} under Settings → Sessions when the new year starts.
        </p>
      )}

      {targets.length === 0 ? (
        <div className="card p-6">
          <p className="text-sm">
            Create the next academic session first (e.g. 2026-2027) under{" "}
            <Link href="/settings/sessions/new" className="font-bold text-brand-600 hover:text-brand-700">
              Settings → Sessions & Terms
            </Link>
            , then come back here.
          </p>
        </div>
      ) : enrollments.length === 0 ? (
        <p className="card p-6 text-sm text-ink-400">
          No active pupils are enrolled in {source.name}.
        </p>
      ) : (
        <form action={runPromotion} className="space-y-5">
          <input type="hidden" name="sourceSessionId" value={source.id} />

          <div className="card flex flex-wrap items-end gap-4 p-5">
            <div>
              <label htmlFor="targetSessionId" className="mb-1 block text-xs font-bold text-ink-400">
                Promote into session *
              </label>
              <select id="targetSessionId" name="targetSessionId" defaultValue={targets[0].id} className="field !py-2 text-sm">
                {targets.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 pb-2 text-sm font-semibold text-ink-700">
              <input type="checkbox" name="carry" defaultChecked className="h-4 w-4 accent-brand-600" />
              Carry outstanding fee balances forward
            </label>
          </div>

          {groups.map(({ cls, next, pupils }) => (
            <div key={cls.id} className="card overflow-x-auto">
              <div className="flex items-center justify-between px-6 pt-4">
                <p className="font-display text-sm font-extrabold text-ink-900">
                  {cls.name}{" "}
                  <span className="text-ink-400">
                    → {next ? next.name : "Graduate (leavers)"}
                  </span>
                </p>
                <span className="chip bg-paper-200 text-ink-700">{pupils.length} pupils</span>
              </div>
              <table className="table-admin mt-2">
                <thead>
                  <tr>
                    <th>Adm No.</th>
                    <th>Pupil</th>
                    <th>Stream</th>
                    <th className="text-right">Repeat {cls.name}</th>
                  </tr>
                </thead>
                <tbody>
                  {pupils.map((e) => (
                    <tr key={e.id}>
                      <td className="font-mono text-xs">{e.student.admissionNo}</td>
                      <td className="font-semibold text-ink-900">
                        {e.student.lastName}, {e.student.firstName}
                      </td>
                      <td>
                        {e.stream.class.name} {e.stream.name}
                      </td>
                      <td className="text-right">
                        <input
                          type="checkbox"
                          name={`rp_${e.id}`}
                          className="h-4 w-4 accent-brand-600"
                          aria-label={`Repeat for ${e.student.firstName} ${e.student.lastName}`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          <div className="card flex flex-wrap items-center justify-between gap-3 p-5">
            <p className="max-w-md text-xs leading-relaxed text-ink-400">
              This runs once per pupil — anyone already placed in the target session is
              skipped, so it&rsquo;s safe to re-run. Graduating pupils keep their records
              and can be found under Students → Show archived.
            </p>
            <button type="submit" className="btn btn-primary">
              Run promotion
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
