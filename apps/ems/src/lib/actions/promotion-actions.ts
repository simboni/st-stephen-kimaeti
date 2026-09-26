"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/rbac";
import { studentBalance } from "@/lib/fees";
import { formatMoney } from "@/lib/money";

/**
 * Promotes every active pupil from the source session into the target
 * session: one class level up (or the same class when marked "repeat"),
 * graduating pupils in the top class. Optionally carries each pupil's
 * outstanding balance forward as a brought-forward adjustment.
 * Idempotent — pupils already enrolled in the target session are skipped.
 */
export async function runPromotion(formData: FormData) {
  const actor = await requirePermission("students", "edit");

  const sourceSessionId = String(formData.get("sourceSessionId") ?? "");
  const targetSessionId = String(formData.get("targetSessionId") ?? "");
  const carryForward = String(formData.get("carry") ?? "") === "on";

  const [source, target] = await Promise.all([
    db.academicSession.findUnique({ where: { id: sourceSessionId } }),
    db.academicSession.findUnique({ where: { id: targetSessionId } }),
  ]);
  if (!source || !target || source.id === target.id) return;

  const classes = await db.schoolClass.findMany({
    where: { archived: false },
    include: { streams: { where: { archived: false }, orderBy: { name: "asc" } } },
    orderBy: { level: "asc" },
  });
  const maxLevel = Math.max(...classes.map((c) => c.level));
  const classByLevel = new Map(classes.map((c) => [c.level, c]));

  const enrollments = await db.enrollment.findMany({
    where: { sessionId: source.id, student: { archived: false } },
    include: { student: true, stream: { include: { class: true } } },
    orderBy: { student: { lastName: "asc" } },
  });

  let promoted = 0;
  let repeated = 0;
  let graduated = 0;
  let skipped = 0;
  let carriedCents = 0;

  for (const e of enrollments) {
    const already = await db.enrollment.findUnique({
      where: { studentId_sessionId: { studentId: e.studentId, sessionId: target.id } },
    });
    if (already) {
      skipped += 1;
      continue;
    }

    const repeat = String(formData.get(`rp_${e.id}`) ?? "") === "on";
    const currentLevel = e.stream.class.level;

    // Top-class pupils who pass graduate out of the school.
    if (!repeat && currentLevel >= maxLevel) {
      const gradBalance = await studentBalance(e.studentId, source.id);
      await db.student.update({
        where: { id: e.studentId },
        data: {
          archived: true,
          archiveReason: `Graduated ${source.name}`,
          exitType: "GRADUATED",
          exitAt: new Date(),
          exitBalanceCents: gradBalance.balanceCents,
        },
      });
      graduated += 1;
      continue;
    }

    const targetClass = repeat ? e.stream.class : classByLevel.get(currentLevel + 1);
    if (!targetClass) {
      skipped += 1;
      continue;
    }
    const targetStreams = repeat
      ? [e.stream]
      : (classByLevel.get(currentLevel + 1)?.streams ?? []);
    let targetStream =
      targetStreams.find((s) => s.name === e.stream.name) ?? targetStreams[0];
    if (!targetStream) {
      targetStream = await db.stream.create({ data: { classId: targetClass.id, name: "A" } });
    }

    await db.enrollment.create({
      data: { studentId: e.studentId, sessionId: target.id, streamId: targetStream.id },
    });
    if (repeat) repeated += 1;
    else promoted += 1;

    if (carryForward) {
      const balance = await studentBalance(e.studentId, source.id);
      if (balance.balanceCents !== 0) {
        await db.feeAdjustment.create({
          data: {
            studentId: e.studentId,
            sessionId: target.id,
            label: `Balance b/f from ${source.name}`,
            amountCents: balance.balanceCents,
            createdBy: actor.username,
          },
        });
        carriedCents += balance.balanceCents;
      }
    }
  }

  await audit(
    actor,
    "students",
    "promotion_run",
    `${source.name} → ${target.name} · ${promoted} promoted, ${repeated} repeating, ${graduated} graduated, ${skipped} skipped${carryForward ? `, ${formatMoney(carriedCents)} carried forward` : ""}`,
  );
  revalidatePath("/students");
  redirect(
    `/students/promote?done=1&promoted=${promoted}&repeated=${repeated}&graduated=${graduated}&skipped=${skipped}&target=${encodeURIComponent(target.name)}`,
  );
}
