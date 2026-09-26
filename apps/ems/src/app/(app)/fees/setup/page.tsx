import type { Metadata } from "next";
import { db } from "@/lib/db";
import { can, requirePermission } from "@/lib/rbac";
import { getActiveSession } from "@/lib/school";
import { formatMoney } from "@/lib/money";
import { createFeeType, setFeeItemArchived } from "@/lib/actions/fees-actions";
import { FeeItemForm } from "@/components/fees-forms";
import { BanIcon, CheckIcon, PlusIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Fees Setup" };

export default async function FeesSetupPage() {
  const user = await requirePermission("fees", "view");

  const [session, feeTypes, classes, mayCreate, mayArchive] = await Promise.all([
    getActiveSession(),
    db.feeType.findMany({ where: { archived: false }, orderBy: { name: "asc" } }),
    db.schoolClass.findMany({ where: { archived: false }, orderBy: { level: "asc" } }),
    can(user.role, "fees", "create"),
    can(user.role, "fees", "archive"),
  ]);

  const items = session
    ? await db.feeItem.findMany({
        where: { sessionId: session.id },
        include: { feeType: true, term: true, class: true },
        orderBy: [{ archived: "asc" }, { createdAt: "desc" }],
      })
    : [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink-900">Fees Setup</h1>
        <p className="mt-1 text-sm">
          The fee structure for {session?.name ?? "the active session"} — every pupil&rsquo;s
          charges are computed from these lines by class and day/boarder type.
        </p>
      </div>

      {mayCreate && (
        <>
          <form action={createFeeType} className="card flex flex-wrap items-end gap-3 p-4">
            <div className="min-w-56">
              <label htmlFor="name" className="mb-1 block text-xs font-bold text-ink-400">
                New vote head (Tuition, Examinations, Lunch…)
              </label>
              <input id="name" name="name" placeholder="e.g. Examinations" className="field !py-2 text-sm" />
            </div>
            <button type="submit" className="btn btn-secondary !py-2 text-xs">
              <PlusIcon className="h-3.5 w-3.5" /> Add vote head
            </button>
            <p className="text-xs text-ink-400">
              Vote heads: {feeTypes.map((t) => t.name).join(" · ") || "none yet"} — payments
              are collected against these.
            </p>
          </form>

          {session && (
            <FeeItemForm
              feeTypes={feeTypes.map((t) => ({ id: t.id, name: t.name }))}
              terms={session.terms.map((t) => ({ id: t.id, name: t.name }))}
              classes={classes.map((c) => ({ id: c.id, name: c.name }))}
            />
          )}
        </>
      )}

      <div className="card overflow-x-auto">
        <table className="table-admin">
          <thead>
            <tr>
              <th>Fee type</th>
              <th>Term</th>
              <th>Class</th>
              <th>Applies to</th>
              <th className="text-right">Amount</th>
              {mayArchive && <th className="text-right">Archive</th>}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-ink-400">
                  No fee lines yet — add the first one above.
                </td>
              </tr>
            )}
            {items.map((item) => (
              <tr key={item.id} className={item.archived ? "opacity-50" : ""}>
                <td className="font-semibold text-ink-900">
                  {item.feeType.name}
                  {item.archived && <span className="chip ml-2 bg-danger-500/10 text-danger-500">Archived</span>}
                </td>
                <td>{item.term?.name ?? "Whole session"}</td>
                <td>{item.class?.name ?? "All classes"}</td>
                <td>{item.boarding ? (item.boarding === "BOARDER" ? "Boarders" : "Day scholars") : "Everyone"}</td>
                <td className="text-right font-bold text-ink-900">{formatMoney(item.amountCents)}</td>
                {mayArchive && (
                  <td>
                    <form action={setFeeItemArchived} className="flex justify-end">
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="archived" value={item.archived ? "false" : "true"} />
                      <button
                        type="submit"
                        className={item.archived ? "btn btn-secondary !p-2 !text-leaf-600" : "btn btn-danger !p-2"}
                        title={item.archived ? "Restore line" : "Archive line"}
                        aria-label={`${item.archived ? "Restore" : "Archive"} ${item.feeType.name} line`}
                      >
                        {item.archived ? <CheckIcon className="h-3.5 w-3.5" /> : <BanIcon className="h-3.5 w-3.5" />}
                      </button>
                    </form>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
