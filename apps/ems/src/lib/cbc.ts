/**
 * CBC performance levels (Kenya Competency-Based Curriculum).
 * Marks are converted to a percentage of the exam's max marks, then mapped:
 *   EE ≥ 80 · ME 60–79 · AE 40–59 · BE < 40
 */
export type CbcLevel = {
  code: "EE" | "ME" | "AE" | "BE";
  label: string;
  remark: string;
  /** Tailwind text colour class used wherever the level is shown. */
  color: string;
};

export const CBC_LEVELS: CbcLevel[] = [
  {
    code: "EE",
    label: "Exceeding Expectation",
    remark: "Excellent mastery of the learning outcomes. Keep it up!",
    color: "text-leaf-600",
  },
  {
    code: "ME",
    label: "Meeting Expectation",
    remark: "Good grasp of the learning outcomes. Aim even higher.",
    color: "text-brand-600",
  },
  {
    code: "AE",
    label: "Approaching Expectation",
    remark: "Fair progress — more practice will close the gap.",
    color: "text-sun-500",
  },
  {
    code: "BE",
    label: "Below Expectation",
    remark: "Needs close support and revision in this area.",
    color: "text-danger-500",
  },
];

export function cbcLevel(score: number, maxMarks: number): CbcLevel {
  const pct = maxMarks > 0 ? (score / maxMarks) * 100 : 0;
  if (pct >= 80) return CBC_LEVELS[0];
  if (pct >= 60) return CBC_LEVELS[1];
  if (pct >= 40) return CBC_LEVELS[2];
  return CBC_LEVELS[3];
}
