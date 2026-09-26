import "server-only";
import { db } from "@/lib/db";

/** All fee-structure lines that apply to a pupil in a session:
    matching class (or all-classes), matching boarding type (or both). */
export async function studentCharges(studentId: string, sessionId: string) {
  const enrollment = await db.enrollment.findUnique({
    where: { studentId_sessionId: { studentId, sessionId } },
    include: { stream: true, student: true },
  });
  if (!enrollment) return { items: [], totalCents: 0 };

  const items = await db.feeItem.findMany({
    where: {
      sessionId,
      archived: false,
      OR: [{ classId: null }, { classId: enrollment.stream.classId }],
      AND: [{ OR: [{ boarding: null }, { boarding: enrollment.student.boarding }] }],
    },
    include: { feeType: true, term: true },
    orderBy: [{ term: { number: "asc" } }, { createdAt: "asc" }],
  });

  return {
    items,
    totalCents: items.reduce((sum, i) => sum + i.amountCents, 0),
  };
}

export type StudentBalance = Awaited<ReturnType<typeof studentBalance>>;

/** Full financial picture for one pupil in one session. */
export async function studentBalance(studentId: string, sessionId: string) {
  const [charges, adjustments, payments] = await Promise.all([
    studentCharges(studentId, sessionId),
    db.feeAdjustment.findMany({
      where: { studentId, sessionId },
      include: { feeType: true },
      orderBy: { createdAt: "asc" },
    }),
    db.feePayment.findMany({
      where: { studentId, sessionId },
      include: { allocations: { include: { feeType: true } } },
      orderBy: { receivedAt: "asc" },
    }),
  ]);

  const adjustmentCents = adjustments.reduce((s, a) => s + a.amountCents, 0);
  const paidCents = payments.filter((p) => !p.voided).reduce((s, p) => s + p.amountCents, 0);
  const chargedCents = charges.totalCents + adjustmentCents;

  return {
    charges,
    adjustments,
    payments,
    chargedCents,
    paidCents,
    balanceCents: chargedCents - paidCents,
  };
}

export type VoteHeadRow = {
  feeTypeId: string;
  name: string;
  chargedCents: number;
  adjustmentCents: number;
  paidCents: number;
  balanceCents: number;
};

export type VoteHeadStatement = {
  rows: VoteHeadRow[];
  /** Adjustments not tied to any vote head. */
  generalAdjustmentCents: number;
  /** Payment money never allocated to a head (legacy/older receipts). */
  unallocatedPaidCents: number;
  totalBalanceCents: number;
};

/** The collection roadmap: per-vote-head charged / adjusted / paid / balance.
 *  Reconciles exactly with studentBalance — general adjustments and any
 *  unallocated payments are carried as their own lines. */
export async function voteHeadStatement(
  studentId: string,
  sessionId: string,
): Promise<VoteHeadStatement> {
  const balance = await studentBalance(studentId, sessionId);

  const rowsByType = new Map<string, VoteHeadRow>();
  const row = (feeTypeId: string, name: string): VoteHeadRow => {
    if (!rowsByType.has(feeTypeId))
      rowsByType.set(feeTypeId, {
        feeTypeId,
        name,
        chargedCents: 0,
        adjustmentCents: 0,
        paidCents: 0,
        balanceCents: 0,
      });
    return rowsByType.get(feeTypeId)!;
  };

  for (const item of balance.charges.items) {
    row(item.feeTypeId, item.feeType.name).chargedCents += item.amountCents;
  }

  let generalAdjustmentCents = 0;
  for (const a of balance.adjustments) {
    if (a.feeTypeId && a.feeType) row(a.feeTypeId, a.feeType.name).adjustmentCents += a.amountCents;
    else generalAdjustmentCents += a.amountCents;
  }

  let allocatedCents = 0;
  for (const p of balance.payments) {
    if (p.voided) continue;
    for (const alloc of p.allocations) {
      row(alloc.feeTypeId, alloc.feeType.name).paidCents += alloc.amountCents;
      allocatedCents += alloc.amountCents;
    }
  }
  const unallocatedPaidCents = balance.paidCents - allocatedCents;

  // Vote heads with no activity yet still appear — they guide collection.
  const allHeads = await db.feeType.findMany({
    where: { archived: false },
    orderBy: { name: "asc" },
  });
  for (const head of allHeads) row(head.id, head.name);

  const rows = [...rowsByType.values()]
    .map((r) => ({ ...r, balanceCents: r.chargedCents + r.adjustmentCents - r.paidCents }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    rows,
    generalAdjustmentCents,
    unallocatedPaidCents,
    totalBalanceCents: balance.balanceCents,
  };
}

/** Balances for every active pupil in a stream (dues list). */
export async function streamBalances(streamId: string, sessionId: string) {
  const enrollments = await db.enrollment.findMany({
    where: { streamId, sessionId, student: { archived: false } },
    include: { student: true },
    orderBy: { student: { lastName: "asc" } },
  });
  return Promise.all(
    enrollments.map(async (e) => ({
      student: e.student,
      balance: await studentBalance(e.studentId, sessionId),
    })),
  );
}

export type TermBucket = {
  key: string;
  name: string;
  /** Charges falling due in this bucket (incl. adjustments for the first). */
  chargedCents: number;
  /** How much of it the payments have settled (oldest bucket first). */
  settledCents: number;
  outstandingCents: number;
  isPast: boolean;
  isCurrent: boolean;
};

export type TermBreakdown = {
  buckets: TermBucket[];
  /** Unpaid money from buckets already behind us — last term's debt. */
  arrearsCents: number;
  /** The current bucket's unpaid portion. */
  currentDueCents: number;
};

/**
 * Arrears view: charges grouped per term (session-wide charges, adjustments
 * and brought-forward balances fall due immediately), settled oldest-first
 * from everything paid. Whatever is unpaid in past buckets is arrears —
 * it stays owed and is collected alongside the current term's bill.
 */
export async function termBreakdown(studentId: string, sessionId: string): Promise<TermBreakdown> {
  const [balance, terms] = await Promise.all([
    studentBalance(studentId, sessionId),
    db.term.findMany({ where: { sessionId }, orderBy: { number: "asc" } }),
  ]);

  const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z");
  // The current term is the first one that hasn't ended; earlier ones are past.
  const currentTerm = terms.find((t) => t.endDate >= today) ?? terms[terms.length - 1] ?? null;

  const buckets: TermBucket[] = [
    {
      key: "immediate",
      name: "On admission (session-wide & b/f)",
      chargedCents: balance.adjustments.reduce((s, a) => s + a.amountCents, 0),
      settledCents: 0,
      outstandingCents: 0,
      isPast: true,
      isCurrent: false,
    },
    ...terms.map((t) => ({
      key: t.id,
      name: t.name,
      chargedCents: 0,
      settledCents: 0,
      outstandingCents: 0,
      isPast: currentTerm ? t.number < currentTerm.number : true,
      isCurrent: currentTerm ? t.id === currentTerm.id : false,
    })),
  ];
  const byKey = new Map(buckets.map((b) => [b.key, b]));

  for (const item of balance.charges.items) {
    const bucket = (item.termId && byKey.get(item.termId)) || byKey.get("immediate")!;
    bucket.chargedCents += item.amountCents;
  }

  // Settle oldest-first; a negative bucket (e.g. big discount) credits the pool.
  let pool = balance.paidCents;
  for (const b of buckets) {
    if (b.chargedCents <= 0) {
      pool += -b.chargedCents;
      b.outstandingCents = 0;
      continue;
    }
    b.settledCents = Math.min(pool, b.chargedCents);
    pool -= b.settledCents;
    b.outstandingCents = b.chargedCents - b.settledCents;
  }

  const arrearsCents = buckets
    .filter((b) => b.isPast && !b.isCurrent)
    .reduce((s, b) => s + b.outstandingCents, 0);
  const currentDueCents = buckets
    .filter((b) => b.isCurrent)
    .reduce((s, b) => s + b.outstandingCents, 0);

  return { buckets, arrearsCents, currentDueCents };
}

/** Next receipt number, e.g. RCT-260001. */
export async function nextReceiptNo(): Promise<string> {
  const year = new Date().getFullYear().toString().slice(-2);
  const count = await db.feePayment.count();
  return `RCT-${year}${String(count + 1).padStart(4, "0")}`;
}
