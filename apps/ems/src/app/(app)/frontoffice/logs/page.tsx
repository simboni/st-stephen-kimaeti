import type { Metadata } from "next";
import { db } from "@/lib/db";
import { can, requirePermission } from "@/lib/rbac";
import {
  addCall,
  addPostal,
  addVisitor,
  signOutVisitor,
} from "@/lib/actions/frontoffice-actions";

export const metadata: Metadata = { title: "Office Logs" };

function nairobiToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

const timeFmt = { timeStyle: "short" as const, timeZone: "Africa/Nairobi" };
const dateFmt = { day: "numeric" as const, month: "short" as const, timeZone: "Africa/Nairobi" };

export default async function OfficeLogsPage() {
  const user = await requirePermission("frontoffice", "view");

  const [mayCreate, mayEdit, visitors, calls, postal] = await Promise.all([
    can(user.role, "frontoffice", "create"),
    can(user.role, "frontoffice", "edit"),
    db.visitorLog.findMany({ orderBy: { inAt: "desc" }, take: 25 }),
    db.callLog.findMany({ orderBy: { at: "desc" }, take: 25 }),
    db.postalLog.findMany({ orderBy: { date: "desc" }, take: 25 }),
  ]);

  const inBuilding = visitors.filter((v) => !v.outAt).length;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink-900">Office Logs</h1>
        <p className="mt-1 text-sm">
          Visitor book, phone calls and the postal register — {inBuilding} visitor
          {inBuilding === 1 ? "" : "s"} currently in.
        </p>
      </div>

      {/* Visitor book */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-ink-400">
          Visitor book
        </h2>
        {mayCreate && (
          <form action={addVisitor} className="card flex flex-wrap items-end gap-3 p-4">
            <input name="name" placeholder="Visitor name *" className="field !w-44 !py-2 text-sm" aria-label="Visitor name" />
            <input name="phone" placeholder="Phone" className="field !w-36 !py-2 text-sm" aria-label="Visitor phone" />
            <input name="purpose" placeholder="Purpose *" className="field !w-44 !py-2 text-sm" aria-label="Visit purpose" />
            <input name="whomToSee" placeholder="Whom to see" className="field !w-40 !py-2 text-sm" aria-label="Whom to see" />
            <button type="submit" className="btn btn-primary !py-2 text-xs">
              Sign in visitor
            </button>
          </form>
        )}
        <div className="card overflow-x-auto">
          <table className="table-admin">
            <thead>
              <tr>
                <th>Visitor</th>
                <th>Purpose</th>
                <th>In</th>
                <th>Out</th>
                {mayEdit && <th className="text-right">Sign out</th>}
              </tr>
            </thead>
            <tbody>
              {visitors.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-ink-400">
                    No visitors logged yet.
                  </td>
                </tr>
              )}
              {visitors.map((v) => (
                <tr key={v.id}>
                  <td>
                    <p className="font-semibold text-ink-900">{v.name}</p>
                    <p className="text-xs text-ink-400">{v.phone ?? "—"}</p>
                  </td>
                  <td className="text-ink-500">
                    {v.purpose}
                    {v.whomToSee ? ` → ${v.whomToSee}` : ""}
                  </td>
                  <td className="whitespace-nowrap text-ink-400">
                    {v.inAt.toLocaleDateString("en-KE", dateFmt)}{" "}
                    {v.inAt.toLocaleTimeString("en-KE", timeFmt)}
                  </td>
                  <td className="whitespace-nowrap">
                    {v.outAt ? (
                      <span className="text-ink-400">{v.outAt.toLocaleTimeString("en-KE", timeFmt)}</span>
                    ) : (
                      <span className="chip bg-leaf-500/10 text-leaf-600">In</span>
                    )}
                  </td>
                  {mayEdit && (
                    <td className="text-right">
                      {!v.outAt && (
                        <form action={signOutVisitor} className="inline">
                          <input type="hidden" name="id" value={v.id} />
                          <button type="submit" className="btn btn-secondary !px-3 !py-1.5 text-xs">
                            Sign out
                          </button>
                        </form>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Phone calls */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-ink-400">
          Phone-call log
        </h2>
        {mayCreate && (
          <form action={addCall} className="card flex flex-wrap items-end gap-3 p-4">
            <select name="direction" defaultValue="INCOMING" className="field !w-32 !py-2 text-sm" aria-label="Call direction">
              <option value="INCOMING">Incoming</option>
              <option value="OUTGOING">Outgoing</option>
            </select>
            <input name="name" placeholder="Caller name" className="field !w-40 !py-2 text-sm" aria-label="Caller name" />
            <input name="phone" placeholder="Phone *" className="field !w-36 !py-2 text-sm" aria-label="Caller phone" />
            <input name="note" placeholder="What was it about? *" className="field !w-56 !py-2 text-sm" aria-label="Call note" />
            <button type="submit" className="btn btn-primary !py-2 text-xs">
              Log call
            </button>
          </form>
        )}
        <div className="card overflow-x-auto">
          <table className="table-admin">
            <thead>
              <tr>
                <th>When</th>
                <th>Direction</th>
                <th>Caller</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {calls.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-ink-400">
                    No calls logged yet.
                  </td>
                </tr>
              )}
              {calls.map((c) => (
                <tr key={c.id}>
                  <td className="whitespace-nowrap text-ink-400">
                    {c.at.toLocaleDateString("en-KE", dateFmt)} {c.at.toLocaleTimeString("en-KE", timeFmt)}
                  </td>
                  <td>
                    <span className={`chip ${c.direction === "INCOMING" ? "bg-brand-50 text-brand-700" : "bg-paper-200 text-ink-700"}`}>
                      {c.direction.toLowerCase()}
                    </span>
                  </td>
                  <td className="font-semibold text-ink-900">
                    {c.name ?? "—"}
                    <span className="ml-2 font-mono text-xs font-normal text-ink-400">{c.phone}</span>
                  </td>
                  <td className="max-w-sm truncate text-ink-500">{c.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Postal register */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-ink-400">
          Postal dispatch / receive
        </h2>
        {mayCreate && (
          <form action={addPostal} className="card flex flex-wrap items-end gap-3 p-4">
            <select name="direction" defaultValue="RECEIVED" className="field !w-32 !py-2 text-sm" aria-label="Postal direction">
              <option value="RECEIVED">Received</option>
              <option value="DISPATCHED">Dispatched</option>
            </select>
            <input name="item" placeholder="Item *" className="field !w-44 !py-2 text-sm" aria-label="Postal item" />
            <input name="party" placeholder="From / to *" className="field !w-40 !py-2 text-sm" aria-label="Postal party" />
            <input name="refNo" placeholder="Ref no." className="field !w-28 !py-2 text-sm" aria-label="Postal reference" />
            <input name="date" type="date" defaultValue={nairobiToday()} className="field !py-2 text-sm" aria-label="Postal date" />
            <button type="submit" className="btn btn-primary !py-2 text-xs">
              Log item
            </button>
          </form>
        )}
        <div className="card overflow-x-auto">
          <table className="table-admin">
            <thead>
              <tr>
                <th>Date</th>
                <th>Direction</th>
                <th>Item</th>
                <th>From / to</th>
                <th>Ref</th>
              </tr>
            </thead>
            <tbody>
              {postal.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-ink-400">
                    Nothing in the register yet.
                  </td>
                </tr>
              )}
              {postal.map((p) => (
                <tr key={p.id}>
                  <td className="whitespace-nowrap text-ink-400">
                    {p.date.toLocaleDateString("en-KE", { day: "numeric", month: "short", timeZone: "UTC" })}
                  </td>
                  <td>
                    <span className={`chip ${p.direction === "RECEIVED" ? "bg-leaf-500/10 text-leaf-600" : "bg-paper-200 text-ink-700"}`}>
                      {p.direction.toLowerCase()}
                    </span>
                  </td>
                  <td className="font-semibold text-ink-900">{p.item}</td>
                  <td className="text-ink-500">{p.party}</td>
                  <td className="font-mono text-xs">{p.refNo ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
