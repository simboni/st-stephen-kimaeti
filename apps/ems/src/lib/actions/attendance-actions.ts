"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AttendanceStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/rbac";
import { getActiveSession } from "@/lib/school";

function parseDay(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Saves a whole stream's register for one day in a single submit. */
export async function saveRegister(formData: FormData) {
  const actor = await requirePermission("attendance", "create");

  const streamId = String(formData.get("streamId") ?? "");
  const dateStr = String(formData.get("date") ?? "");
  const date = parseDay(dateStr);
  const session = await getActiveSession();
  if (!date || !session) return;

  const stream = await db.stream.findUnique({ where: { id: streamId }, include: { class: true } });
  if (!stream) return;

  const enrollments = await db.enrollment.findMany({
    where: { streamId, sessionId: session.id, student: { archived: false } },
    select: { id: true },
  });

  const counts: Record<string, number> = {};
  const statuses = Object.values(AttendanceStatus) as string[];

  for (const e of enrollments) {
    const raw = String(formData.get(`st_${e.id}`) ?? "");
    if (!statuses.includes(raw)) continue;
    const status = raw as AttendanceStatus;
    counts[status] = (counts[status] ?? 0) + 1;
    await db.attendanceRecord.upsert({
      where: { enrollmentId_date: { enrollmentId: e.id, date } },
      update: { status, markedBy: actor.username },
      create: { enrollmentId: e.id, date, status, markedBy: actor.username },
    });
  }

  await audit(
    actor,
    "attendance",
    "register_saved",
    `${stream.class.name} ${stream.name} · ${dateStr} · ${Object.entries(counts)
      .map(([k, v]) => `${v} ${k.toLowerCase()}`)
      .join(", ")}`,
  );
  revalidatePath("/attendance");
  redirect(`/attendance?stream=${streamId}&date=${dateStr}&saved=1`);
}
