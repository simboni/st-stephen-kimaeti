"use client";

import { useActionState, useState } from "react";
import { formatMoney } from "@/lib/money";
import {
  addAdjustment,
  createFeeItem,
  recordPayment,
  type FeeFormState,
} from "@/lib/actions/fees-actions";

function ErrorNote({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p className="rounded-lg bg-brand-50 px-3.5 py-2.5 text-sm font-semibold text-brand-800">
      {error}
    </p>
  );
}

export type VoteHeadOption = { feeTypeId: string; name: string; balanceCents: number };

/** Payment split across vote heads — enter a full or partial amount
 *  against each head; the receipt total is the sum of the lines. */
export function PaymentForm({
  studentId,
  heads,
}: {
  studentId: string;
  heads: VoteHeadOption[];
}) {
  const [state, action, pending] = useActionState<FeeFormState, FormData>(recordPayment, {});
  const v = state.values ?? {};
  const [totalCents, setTotalCents] = useState(0);

  const recomputeTotal = (form: HTMLFormElement | null) => {
    if (!form) return;
    let cents = 0;
    for (const input of form.querySelectorAll<HTMLInputElement>("input[name^='alloc_']")) {
      const cleaned = input.value.replace(/[^\d.]/g, "");
      if (!cleaned || !/^\d+(\.\d{1,2})?$/.test(cleaned)) continue;
      const [whole, frac = ""] = cleaned.split(".");
      cents += parseInt(whole, 10) * 100 + parseInt(frac.padEnd(2, "0") || "0", 10);
    }
    setTotalCents(cents);
  };

  return (
    <form
      action={action}
      onInput={(e) => recomputeTotal(e.currentTarget)}
      className="space-y-4"
    >
      <input type="hidden" name="studentId" value={studentId} />

      <div className="overflow-x-auto">
      <table className="table-admin">
        <thead>
          <tr>
            <th>Vote head</th>
            <th className="text-right">Outstanding</th>
            <th className="text-right">Pay now (KES)</th>
          </tr>
        </thead>
        <tbody>
          {heads.map((h) => (
            <tr key={h.feeTypeId}>
              <td className="font-semibold text-ink-900">{h.name}</td>
              <td className={`text-right ${h.balanceCents > 0 ? "text-danger-500" : "text-ink-400"}`}>
                {formatMoney(h.balanceCents)}
              </td>
              <td className="text-right">
                <input
                  key={v[`alloc_${h.feeTypeId}`] ?? h.feeTypeId}
                  name={`alloc_${h.feeTypeId}`}
                  defaultValue={v[`alloc_${h.feeTypeId}`] ?? ""}
                  placeholder="0"
                  inputMode="decimal"
                  className="field !w-28 !py-1.5 text-right text-sm"
                  aria-label={`Amount toward ${h.name}`}
                />
              </td>
            </tr>
          ))}
          <tr className="font-bold">
            <td className="text-ink-900">This receipt</td>
            <td />
            <td className="text-right font-display text-base font-extrabold text-brand-600">
              {formatMoney(totalCents)}
            </td>
          </tr>
        </tbody>
      </table>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-secondary !py-1.5 text-xs"
          onClick={(e) => {
            const form = e.currentTarget.closest("form");
            if (!form) return;
            for (const h of heads) {
              const input = form.querySelector<HTMLInputElement>(`input[name='alloc_${h.feeTypeId}']`);
              if (input) input.value = h.balanceCents > 0 ? String(h.balanceCents / 100) : "";
            }
            recomputeTotal(form);
          }}
        >
          Fill all outstanding
        </button>
        <button
          type="button"
          className="btn btn-secondary !py-1.5 text-xs"
          onClick={(e) => {
            const form = e.currentTarget.closest("form");
            if (!form) return;
            for (const input of form.querySelectorAll<HTMLInputElement>("input[name^='alloc_']")) {
              input.value = "";
            }
            recomputeTotal(form);
          }}
        >
          Clear
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="method" className="mb-1 block text-xs font-bold text-ink-400">
            Method *
          </label>
          <select key={v.method ?? "m"} id="method" name="method" defaultValue={v.method ?? "CASH"} className="field !py-2 text-sm">
            <option value="CASH">Cash</option>
            <option value="MPESA">M-PESA (manual)</option>
            <option value="BANK">Bank slip</option>
            <option value="CHEQUE">Cheque</option>
          </select>
        </div>
        <div>
          <label htmlFor="reference" className="mb-1 block text-xs font-bold text-ink-400">
            Reference <span className="font-normal">(required unless cash)</span>
          </label>
          <input key={v.reference ?? "r"} id="reference" name="reference" defaultValue={v.reference ?? ""} placeholder="Slip / M-PESA code" className="field !py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="note" className="mb-1 block text-xs font-bold text-ink-400">
            Note
          </label>
          <input key={v.note ?? "n"} id="note" name="note" defaultValue={v.note ?? ""} placeholder="Optional" className="field !py-2 text-sm" />
        </div>
      </div>
      <ErrorNote error={state.error} />
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Recording…" : "Record payment & print receipt"}
      </button>
    </form>
  );
}

export function AdjustmentForm({
  studentId,
  heads,
}: {
  studentId: string;
  heads: { feeTypeId: string; name: string }[];
}) {
  const [state, action, pending] = useActionState<FeeFormState, FormData>(addAdjustment, {});
  const v = state.values ?? {};

  return (
    <form action={action} className="mt-5 space-y-3 border-t border-paper-200 pt-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-400">
        Add discount / extra charge
      </p>
      <input type="hidden" name="studentId" value={studentId} />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <input key={v.label ?? "l"} name="label" defaultValue={v.label ?? ""} placeholder="e.g. Sibling discount" className="field col-span-2 !py-2 text-sm" aria-label="Adjustment label" />
        <select key={v.kind ?? "k"} name="kind" defaultValue={v.kind ?? "discount"} className="field !py-2 text-sm" aria-label="Adjustment kind">
          <option value="discount">Discount (−)</option>
          <option value="charge">Extra charge (+)</option>
        </select>
        <select key={v.feeTypeId ?? "f"} name="feeTypeId" defaultValue={v.feeTypeId ?? ""} className="field !py-2 text-sm" aria-label="Adjustment vote head">
          <option value="">General (all heads)</option>
          {heads.map((h) => (
            <option key={h.feeTypeId} value={h.feeTypeId}>
              {h.name}
            </option>
          ))}
        </select>
        <input key={v.amount ?? "am"} name="amount" defaultValue={v.amount ?? ""} placeholder="Amount" className="field !py-2 text-sm" inputMode="decimal" aria-label="Adjustment amount" />
      </div>
      <ErrorNote error={state.error} />
      <button type="submit" disabled={pending} className="btn btn-secondary !py-2 text-xs">
        {pending ? "Adding…" : "Add adjustment"}
      </button>
    </form>
  );
}

export function FeeItemForm({
  feeTypes,
  terms,
  classes,
}: {
  feeTypes: { id: string; name: string }[];
  terms: { id: string; name: string }[];
  classes: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState<FeeFormState, FormData>(createFeeItem, {});
  const v = state.values ?? {};

  return (
    <form action={action} className="card space-y-4 p-6">
      <h2 className="font-display text-base font-extrabold text-ink-900">
        Add a fee line (active session)
      </h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <div>
          <label htmlFor="feeTypeId" className="mb-1 block text-xs font-bold text-ink-400">
            Fee type *
          </label>
          <select key={v.feeTypeId ?? "f"} id="feeTypeId" name="feeTypeId" defaultValue={v.feeTypeId ?? ""} className="field !py-2 text-sm">
            <option value="" disabled>
              Choose…
            </option>
            {feeTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="termId" className="mb-1 block text-xs font-bold text-ink-400">
            Term
          </label>
          <select key={v.termId ?? "t"} id="termId" name="termId" defaultValue={v.termId ?? ""} className="field !py-2 text-sm">
            <option value="">Whole session</option>
            {terms.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="classId" className="mb-1 block text-xs font-bold text-ink-400">
            Class
          </label>
          <select key={v.classId ?? "c"} id="classId" name="classId" defaultValue={v.classId ?? ""} className="field !py-2 text-sm">
            <option value="">All classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="boarding" className="mb-1 block text-xs font-bold text-ink-400">
            Applies to
          </label>
          <select key={v.boarding ?? "b"} id="boarding" name="boarding" defaultValue={v.boarding ?? ""} className="field !py-2 text-sm">
            <option value="">Day &amp; boarders</option>
            <option value="DAY">Day scholars only</option>
            <option value="BOARDER">Boarders only</option>
          </select>
        </div>
        <div>
          <label htmlFor="amount" className="mb-1 block text-xs font-bold text-ink-400">
            Amount (KES) *
          </label>
          <input key={v.amount ?? "a"} id="amount" name="amount" defaultValue={v.amount ?? ""} placeholder="12,000" className="field !py-2 text-sm" inputMode="decimal" />
        </div>
        <div className="flex items-end">
          <button type="submit" disabled={pending} className="btn btn-primary w-full !py-2">
            {pending ? "Adding…" : "Add"}
          </button>
        </div>
      </div>
      <ErrorNote error={state.error} />
    </form>
  );
}

export function PrintButton({ label = "Print receipt" }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="btn btn-primary print:hidden">
      {label}
    </button>
  );
}
