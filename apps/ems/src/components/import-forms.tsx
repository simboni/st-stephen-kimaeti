"use client";

import { useActionState, useRef } from "react";
import { importStudents, type ImportState } from "@/lib/actions/import-actions";

export function StudentImportForm() {
  const [state, action, pending] = useActionState<ImportState, FormData>(importStudents, {});
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div className="space-y-5">
      <form action={action} className="card space-y-4 p-6">
        <div>
          <label htmlFor="csvfile" className="mb-1 block text-xs font-bold text-ink-400">
            Choose a CSV file (KNEC progression export saved as CSV works)
          </label>
          <input
            id="csvfile"
            type="file"
            accept=".csv,text/csv"
            className="block text-sm text-ink-500 file:mr-3 file:rounded-full file:border-0 file:bg-brand-500 file:px-4 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-brand-600"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file || !textareaRef.current) return;
              const reader = new FileReader();
              reader.onload = () => {
                if (textareaRef.current) textareaRef.current.value = String(reader.result ?? "");
              };
              reader.readAsText(file);
            }}
          />
        </div>
        <div>
          <label htmlFor="csv" className="mb-1 block text-xs font-bold text-ink-400">
            …or paste the rows here (first row must be the headers)
          </label>
          <textarea
            ref={textareaRef}
            id="csv"
            name="csv"
            rows={7}
            defaultValue={state.csvText ?? ""}
            placeholder={"Admission No,Learner Name,Gender,Grade,Guardian Name,Phone\nHC-260101,WEKESA JOHN,M,Grade 4,Mary Wekesa,0712000000"}
            className="field font-mono !text-xs"
            spellCheck={false}
          />
        </div>
        {state.error && (
          <p className="rounded-lg bg-brand-50 px-3.5 py-2.5 text-sm font-semibold text-brand-800">
            {state.error}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={pending} className="btn btn-secondary">
            {pending ? "Checking…" : "Preview import"}
          </button>
          {state.preview && state.preview.readyCount > 0 && (
            <button
              type="submit"
              name="commit"
              value="1"
              disabled={pending}
              className="btn btn-primary"
            >
              {pending ? "Importing…" : `Import ${state.preview.readyCount} pupil${state.preview.readyCount === 1 ? "" : "s"}`}
            </button>
          )}
          <p className="text-xs text-ink-400">
            Nothing is saved until you confirm — the preview shows exactly what will happen.
          </p>
        </div>
      </form>

      {state.preview && (
        <div className="card overflow-x-auto">
          <div className="flex items-center justify-between px-6 pt-4">
            <p className="font-display text-sm font-extrabold text-ink-900">
              Preview — {state.preview.readyCount} of {state.preview.rows.length} rows will be
              admitted
            </p>
          </div>
          <table className="table-admin mt-2">
            <thead>
              <tr>
                <th>Row</th>
                <th>Adm No.</th>
                <th>Pupil</th>
                <th>Gender</th>
                <th>Class</th>
                <th>Guardian</th>
                <th>Outcome</th>
              </tr>
            </thead>
            <tbody>
              {state.preview.rows.map((r) => (
                <tr key={r.line} className={r.status === "skip" ? "opacity-60" : ""}>
                  <td className="text-ink-400">{r.line}</td>
                  <td className="font-mono text-xs">{r.admissionNo}</td>
                  <td className="font-semibold text-ink-900">{r.name || "—"}</td>
                  <td>{r.gender}</td>
                  <td>{r.classLabel}</td>
                  <td className="max-w-40 truncate text-ink-500">{r.guardian}</td>
                  <td>
                    <span className={`chip ${r.status === "ready" ? "bg-leaf-500/10 text-leaf-600" : "bg-sun-400/15 text-sun-500"}`}>
                      {r.note}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
