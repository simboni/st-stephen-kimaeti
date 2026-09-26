import Image from "next/image";
import type { Subject } from "@prisma/client";
import { cbcLevel, type CbcLevel } from "@/lib/cbc";
import type { ResultRow } from "@/lib/exams";

type SchoolInfo = {
  name: string;
  motto: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
};

export type ReportCardProps = {
  school: SchoolInfo;
  logoSrc: string;
  examName: string;
  termName: string;
  sessionName: string;
  maxMarks: number;
  streamLabel: string;
  classSize: number;
  row: ResultRow;
  subjects: Subject[];
  attendance: { present: number; total: number };
  classTeacherName: string | null;
  nextTermStart: Date | null;
  /** Hand-written remarks — fall back to the auto CBC remark when absent. */
  teacherRemark?: string | null;
  headRemark?: string | null;
};

/** A printable CBC report card — used singly and in class batches. */
export function ReportCard(props: ReportCardProps) {
  const { school, row, subjects, attendance } = props;
  const overall: CbcLevel | null =
    row.subjectsMarked > 0 ? cbcLevel(row.averagePct, 100) : null;

  return (
    <div className="report-card card mx-auto max-w-2xl break-after-page p-8 print:max-w-none print:rounded-none print:border-0 print:shadow-none">
      {/* School header */}
      <div className="flex items-center gap-4 border-b-2 border-ink-900 pb-4">
        <Image
          src={props.logoSrc}
          alt=""
          width={64}
          height={64}
          unoptimized
          className="h-16 w-16 rounded-full bg-white object-contain"
        />
        <div>
          <h1 className="font-display text-lg font-extrabold uppercase text-ink-900">
            {school.name}
          </h1>
          <p className="text-xs text-ink-500">
            {school.address} · {school.phone} · {school.email}
          </p>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-brand-600">
            CBC Assessment Report — {props.examName} · {props.termName} · {props.sessionName}
          </p>
        </div>
      </div>

      {/* Pupil block */}
      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-4">
        {[
          ["Name", row.name],
          ["Adm No.", row.admissionNo],
          ["Class", props.streamLabel],
          ["Position", row.subjectsMarked > 0 ? `${row.position} of ${props.classSize}` : "—"],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{label}</dt>
            <dd className="font-semibold text-ink-900">{value}</dd>
          </div>
        ))}
      </dl>

      {/* Subjects */}
      <table className="table-admin mt-5">
        <thead>
          <tr>
            <th>Learning area</th>
            <th className="text-center">Score / {props.maxMarks}</th>
            <th className="text-center">Level</th>
            <th>Remark</th>
          </tr>
        </thead>
        <tbody>
          {subjects.map((s) => {
            const has = row.scores.has(s.id);
            const score = has ? row.scores.get(s.id) : undefined;
            const level = score !== undefined && score !== null ? cbcLevel(score, props.maxMarks) : null;
            return (
              <tr key={s.id}>
                <td className="font-semibold text-ink-900">{s.name}</td>
                <td className="text-center">
                  {score === undefined ? "—" : score === null ? "Absent" : score}
                </td>
                <td className="text-center">
                  {level ? <b className={level.color}>{level.code}</b> : "—"}
                </td>
                <td className="text-ink-500">{level ? level.remark : score === null ? "Was absent for this paper." : "Not assessed."}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Totals */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Total", row.subjectsMarked > 0 ? `${row.totalScore} / ${row.subjectsMarked * props.maxMarks}` : "—"],
          ["Average", row.subjectsMarked > 0 ? `${row.averagePct.toFixed(1)}%` : "—"],
          ["Overall level", overall ? `${overall.code} — ${overall.label}` : "—"],
          [
            "Attendance",
            attendance.total > 0
              ? `${attendance.present}/${attendance.total} days (${Math.round((attendance.present / attendance.total) * 100)}%)`
              : "Not yet marked",
          ],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg bg-paper-100 px-3 py-2 print:border print:border-paper-300">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{label}</p>
            <p className="text-sm font-bold text-ink-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Remarks */}
      <div className="mt-5 space-y-3 text-sm">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">
            Class teacher&rsquo;s remark
            {props.classTeacherName ? ` — ${props.classTeacherName}` : ""}
          </p>
          <p className="mt-0.5 border-b border-dotted border-ink-300 pb-1 text-ink-700">
            {props.teacherRemark ?? (overall ? overall.remark : "Assessment pending.")}
          </p>
        </div>
        {props.headRemark && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">
              Head teacher&rsquo;s remark
            </p>
            <p className="mt-0.5 border-b border-dotted border-ink-300 pb-1 text-ink-700">
              {props.headRemark}
            </p>
          </div>
        )}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-48 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">
              Head teacher&rsquo;s signature
            </p>
            <p className="mt-6 border-b border-dotted border-ink-300" />
          </div>
          <div className="text-right text-xs text-ink-500">
            {props.nextTermStart && (
              <p>
                Next term begins{" "}
                <b className="text-ink-900">
                  {props.nextTermStart.toLocaleDateString("en-KE", {
                    dateStyle: "long",
                    timeZone: "Africa/Nairobi",
                  })}
                </b>
              </p>
            )}
          </div>
        </div>
      </div>

      <p className="mt-6 border-t border-paper-300 pt-3 text-center text-xs text-ink-400">
        {school.motto} · This report is system-generated and valid without a stamp.
      </p>
    </div>
  );
}
