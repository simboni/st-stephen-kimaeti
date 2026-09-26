"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/rbac";
import { getActiveSession } from "@/lib/school";

const DAY_NAMES = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export type TimetableFormState = { error?: string; added?: string };

export async function addLesson(
  _prev: TimetableFormState,
  formData: FormData,
): Promise<TimetableFormState> {
  const actor = await requirePermission("academics", "edit");

  const streamId = String(formData.get("streamId") ?? "");
  const day = parseInt(String(formData.get("day") ?? ""), 10);
  const period = parseInt(String(formData.get("period") ?? ""), 10);
  const subjectId = String(formData.get("subjectId") ?? "");
  const teacherId = String(formData.get("teacherId") ?? "") || null;
  const room = String(formData.get("room") ?? "").trim() || null;

  const session = await getActiveSession();
  if (!session) return { error: "No active session — set one in Settings first." };
  if (!Number.isInteger(day) || day < 1 || day > 5) return { error: "Pick a day." };
  if (!Number.isInteger(period) || period < 1 || period > 10)
    return { error: "Period must be 1–10." };
  if (!subjectId) return { error: "Pick a subject." };

  const stream = await db.stream.findUnique({
    where: { id: streamId },
    include: { class: true },
  });
  if (!stream) return { error: "Stream not found." };

  // subject must be one the class takes
  const takes = await db.classSubject.findUnique({
    where: { classId_subjectId: { classId: stream.classId, subjectId } },
  });
  if (!takes)
    return { error: `${stream.class.name} does not take that subject (tick it under Subjects first).` };

  // the slot must be free
  const occupied = await db.timetableSlot.findUnique({
    where: {
      streamId_sessionId_day_period: { streamId, sessionId: session.id, day, period },
    },
    include: { subject: true },
  });
  if (occupied)
    return {
      error: `${DAY_NAMES[day]} period ${period} already has ${occupied.subject.name} — remove it first.`,
    };

  // teacher clash: same teacher, same day+period, another stream
  if (teacherId) {
    const clash = await db.timetableSlot.findFirst({
      where: { teacherId, sessionId: session.id, day, period },
      include: { stream: { include: { class: true } }, subject: true },
    });
    if (clash)
      return {
        error: `Teacher clash: they already teach ${clash.subject.name} in ${clash.stream.class.name} ${clash.stream.name} on ${DAY_NAMES[day]} period ${period}.`,
      };
  }

  const subject = await db.subject.findUnique({ where: { id: subjectId } });
  await db.timetableSlot.create({
    data: { streamId, sessionId: session.id, day, period, subjectId, teacherId, room },
  });

  await audit(
    actor,
    "academics",
    "lesson_added",
    `${subject?.name} · ${stream.class.name} ${stream.name} · ${DAY_NAMES[day]} P${period}`,
  );
  revalidatePath("/academics/timetable");
  return { added: `${subject?.name} added to ${DAY_NAMES[day]} period ${period}.` };
}

export async function removeLesson(formData: FormData) {
  const actor = await requirePermission("academics", "edit");
  const id = String(formData.get("id") ?? "");

  const slot = await db.timetableSlot.findUnique({
    where: { id },
    include: { subject: true, stream: { include: { class: true } } },
  });
  if (!slot) return;

  await db.timetableSlot.delete({ where: { id } });
  await audit(
    actor,
    "academics",
    "lesson_removed",
    `${slot.subject.name} · ${slot.stream.class.name} ${slot.stream.name} · ${DAY_NAMES[slot.day]} P${slot.period}`,
  );
  revalidatePath("/academics/timetable");
}
