"use client";

import { useMemo, useState } from "react";
import { fees, money, payment } from "@/lib/site";
import { DownloadIcon, PrinterIcon } from "@/components/icons";

/**
 * "What will this actually cost me?" — answered on the page.
 *
 * A parent picks the class, says whether the child is joining new, and adds
 * uniform if they need it. The figures are the school's own 2026 sheet; nothing
 * here is estimated or marked up. Grade 4–6 has no published sheet, so it is
 * offered as a choice that says so rather than quietly guessing.
 *
 * Everything is computed in the browser from static data, so it works offline
 * and sends nothing anywhere.
 */

type Band = "eye" | "primary" | "junior";

const CLASSES: { label: string; group: string; row: number | null; band: Band }[] = [
  { label: "Playgroup", group: "Early Years", row: 0, band: "eye" },
  { label: "PP1", group: "Early Years", row: 0, band: "eye" },
  { label: "PP2", group: "Early Years", row: 0, band: "eye" },
  { label: "Grade 1", group: "Primary", row: 1, band: "primary" },
  { label: "Grade 2", group: "Primary", row: 1, band: "primary" },
  { label: "Grade 3", group: "Primary", row: 1, band: "primary" },
  { label: "Grade 4", group: "Primary", row: null, band: "primary" },
  { label: "Grade 5", group: "Primary", row: null, band: "primary" },
  { label: "Grade 6", group: "Primary", row: null, band: "primary" },
  { label: "Grade 7", group: "Junior", row: 2, band: "junior" },
  { label: "Grade 8", group: "Junior", row: 2, band: "junior" },
  { label: "Grade 9", group: "Junior", row: 2, band: "junior" },
];

const TERMS = ["Term 1", "Term 2", "Term 3"] as const;

export function FeeCalculator() {
  const [className, setClassName] = useState("Grade 1");
  const [term, setTerm] = useState(0);
  const [isNew, setIsNew] = useState(true);
  const [needsUniform, setNeedsUniform] = useState(true);

  const chosen = CLASSES.find((c) => c.label === className)!;
  const known = chosen.row !== null;

  const uniformTotal = useMemo(
    () => fees.uniform.reduce((sum, u) => sum + (u[chosen.band] ?? 0), 0),
    [chosen.band],
  );

  const result = useMemo(() => {
    if (!known) return null;
    const r = fees.rows[chosen.row!];
    const termFee = [r.t1, r.t2, r.t3][term];
    const oneOff = isNew ? fees.oneOff.reduce((s, o) => s + o.amount, 0) : 0;
    const uniform = needsUniform ? uniformTotal : 0;
    return {
      level: r.level,
      termFee,
      oneOff,
      uniform,
      dueNow: termFee + oneOff + uniform,
      year: r.total,
    };
  }, [known, chosen.row, term, isNew, needsUniform, uniformTotal]);

  const lines = result
    ? [
        { label: `${TERMS[term]} fees — ${result.level}`, amount: result.termFee },
        ...(result.oneOff
          ? [{ label: "Registration and placement assessment (once)", amount: result.oneOff }]
          : []),
        ...(result.uniform
          ? [{ label: "Full uniform, sweater, games kit and tracksuit", amount: result.uniform }]
          : []),
      ]
    : [];

  /** A plain-text summary the parent can keep, print, or send on WhatsApp. */
  function download() {
    if (!result) return;
    const text = [
      `St Stephen’s, Kimaeti — estimated fees ${fees.year}`,
      "",
      `Class:  ${className}`,
      `Term:   ${TERMS[term]}`,
      "",
      ...lines.map((l) => `${l.label.padEnd(56)} ${money(l.amount)}`),
      "".padEnd(70, "-"),
      `${"Due at the start of this term".padEnd(56)} ${money(result.dueNow)}`,
      "",
      `Whole year for this level: ${money(result.year)}`,
      "",
      `Pay by M-PESA paybill ${payment.mpesa.paybill}, account ${payment.accountFormat}`,
      `followed by the child’s name with no spaces, e.g. ${payment.accountExample}.`,
      `Or ${payment.bank.name} account ${payment.bank.account}, ${payment.bank.holder}.`,
      "",
      "These are the school’s own published figures. Boarding places and",
      "school-bus routes are quoted by the office. Bursary and sibling",
      "considerations are handled case by case — please ask.",
    ].join("\n");

    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `ststephen-fees-${className.toLowerCase().replace(/\s+/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const groups = [...new Set(CLASSES.map((c) => c.group))];

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
      {/* Controls */}
      <form className="lg:col-span-5" onSubmit={(e) => e.preventDefault()}>
        <fieldset>
          <legend className="eyebrow" id="fee-class-label">Your child&rsquo;s class</legend>
          <select
            id="fee-class"
            aria-label="Your child’s class"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            className="mt-3 w-full rounded-lg border border-line bg-surface-3 px-4 py-3 font-display text-lg text-text"
          >
            {groups.map((g) => (
              <optgroup key={g} label={g}>
                {CLASSES.filter((c) => c.group === g).map((c) => (
                  <option key={c.label} value={c.label}>
                    {c.label}
                    {c.row === null ? " — sheet not published" : ""}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </fieldset>

        <fieldset className="mt-8">
          <legend className="eyebrow">Which term</legend>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {TERMS.map((t, i) => (
              <button
                key={t}
                type="button"
                onClick={() => setTerm(i)}
                aria-pressed={term === i}
                className={`rounded-lg border px-3 py-3 text-sm font-semibold transition-colors ${
                  term === i
                    ? "border-accent bg-accent text-on-accent"
                    : "border-line bg-surface-3 text-text-2 hover:border-line-strong"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-8">
          <legend className="eyebrow">Anything else</legend>
          <div className="mt-3 space-y-3">
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-surface-3 p-4">
              <input
                type="checkbox"
                checked={isNew}
                onChange={(e) => setIsNew(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
              />
              <span>
                <span className="block font-semibold text-text">Joining the school</span>
                <span className="text-sm text-text-3">
                  Adds registration and the placement assessment, paid once.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-surface-3 p-4">
              <input
                type="checkbox"
                checked={needsUniform}
                onChange={(e) => setNeedsUniform(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
              />
              <span>
                <span className="block font-semibold text-text">Needs a full uniform</span>
                <span className="text-sm text-text-3">
                  Uniform, sweater, games kit and tracksuit — {money(uniformTotal)} for this
                  section.
                </span>
              </span>
            </label>
          </div>
        </fieldset>
      </form>

      {/* Result */}
      <div className="lg:col-span-7">
        <div className="rounded-lg border border-line bg-surface-3 p-7 md:p-9">
          {!known ? (
            <div>
              <p className="eyebrow">No published sheet</p>
              <p className="display mt-4 text-2xl">
                The school has not yet published a fee structure for Grade 4 to Grade 6.
              </p>
              <p className="mt-4 leading-relaxed">
                We have the Early Years, Grade 1–3 and Junior School sheets, and those are
                the figures on this page. Rather than estimate the middle grades, we would
                rather you rang the office and got the real sheet.
              </p>
              <a href={`tel:${payment.mpesa.paybill}`} className="sr-only">
                placeholder
              </a>
            </div>
          ) : (
            <>
              <p className="eyebrow">
                {className} · {TERMS[term]}
              </p>

              <dl className="mt-6 divide-y divide-line border-y border-line">
                {lines.map((l) => (
                  <div
                    key={l.label}
                    className="flex items-baseline justify-between gap-6 py-4"
                  >
                    <dt className="leading-snug">{l.label}</dt>
                    <dd className="shrink-0 font-display text-lg tabular-nums text-text">
                      {money(l.amount)}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-7 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="eyebrow eyebrow-plain">Due at the start of this term</p>
                  <p className="numeral mt-2 text-4xl md:text-5xl">
                    {money(result!.dueNow)}
                  </p>
                </div>
                <p className="text-sm text-text-3">
                  Whole year for this level
                  <br />
                  <span className="font-display text-base text-text">
                    {money(result!.year)}
                  </span>
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-3 no-print">
                <button type="button" onClick={download} className="btn btn-primary">
                  <DownloadIcon className="h-4 w-4" />
                  Save this estimate
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn btn-outline"
                >
                  <PrinterIcon className="h-4 w-4" />
                  Print
                </button>
              </div>

              <p className="mt-6 text-sm leading-relaxed text-text-3">
                These are the school&rsquo;s own published figures, not an estimate we made
                up. Boarding places and school-bus routes are quoted by the office. Bursary
                and sibling considerations are handled case by case — please ask.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
