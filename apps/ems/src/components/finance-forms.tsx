"use client";

import { useActionState } from "react";
import { addFinanceEntry, type FinanceFormState } from "@/lib/actions/finance-actions";

function ErrorNote({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p className="rounded-lg bg-brand-50 px-3.5 py-2.5 text-sm font-semibold text-brand-800">
      {error}
    </p>
  );
}

export function FinanceEntryForm({
  heads,
  today,
}: {
  heads: { id: string; name: string; kind: "INCOME" | "EXPENSE" }[];
  today: string;
}) {
  const [state, action, pending] = useActionState<FinanceFormState, FormData>(addFinanceEntry, {});
  const v = state.values ?? {};
  const income = heads.filter((h) => h.kind === "INCOME");
  const expense = heads.filter((h) => h.kind === "EXPENSE");

  return (
    <form action={action} className="card space-y-4 p-6">
      <h2 className="font-display text-base font-extrabold text-ink-900">Record a transaction</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label htmlFor="headId" className="mb-1 block text-xs font-bold text-ink-400">
            Head *
          </label>
          <select key={v.headId ?? "h"} id="headId" name="headId" defaultValue={v.headId ?? ""} className="field !py-2 text-sm">
            <option value="" disabled>
              Choose…
            </option>
            <optgroup label="Income">
              {income.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Expenses">
              {expense.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
        <div>
          <label htmlFor="description" className="mb-1 block text-xs font-bold text-ink-400">
            Description *
          </label>
          <input key={v.description ?? "d"} id="description" name="description" defaultValue={v.description ?? ""} placeholder="e.g. September salaries" className="field !py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="amount" className="mb-1 block text-xs font-bold text-ink-400">
            Amount (KES) *
          </label>
          <input key={v.amount ?? "a"} id="amount" name="amount" defaultValue={v.amount ?? ""} placeholder="12,000" className="field !py-2 text-sm" inputMode="decimal" />
        </div>
        <div>
          <label htmlFor="date" className="mb-1 block text-xs font-bold text-ink-400">
            Date *
          </label>
          <input key={v.date ?? "dt"} id="date" name="date" type="date" defaultValue={v.date ?? today} className="field !py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="reference" className="mb-1 block text-xs font-bold text-ink-400">
            Reference
          </label>
          <input key={v.reference ?? "r"} id="reference" name="reference" defaultValue={v.reference ?? ""} placeholder="Voucher / slip no." className="field !py-2 text-sm" />
        </div>
      </div>
      <ErrorNote error={state.error} />
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Recording…" : "Record transaction"}
      </button>
    </form>
  );
}
