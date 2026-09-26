"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Stage } from "@prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/rbac";
import { getActiveSession } from "@/lib/school";

export type ClassFormState = { error?: string; values?: Record<string, string> };

function formValues(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string" && !k.startsWith("$")) out[k] = v;
  }
  return out;
}

export async function createClass(
  _prev: ClassFormState,
  formData: FormData,
): Promise<ClassFormState> {
  const actor = await requirePermission("academics", "create");

  const name = String(formData.get("name") ?? "").trim();
  const stage = String(formData.get("stage") ?? "") as Stage;
  const level = parseInt(String(formData.get("level") ?? ""), 10);
  const firstStream = String(formData.get("firstStream") ?? "A").trim() || "A";

  if (!name) return { error: "Give the class a name.", values: formValues(formData) };
  if (!Object.values(Stage).includes(stage))
    return { error: "Choose the stage this class belongs to.", values: formValues(formData) };
  if (!Number.isInteger(level) || level < 0 || level > 30)
    return { error: "Level must be a number (it orders classes, 0 = youngest).", values: formValues(formData) };

  const clash = await db.schoolClass.findFirst({ where: { OR: [{ name }, { level }] } });
  if (clash)
    return {
      error:
        clash.name === name
          ? `A class called "${name}" already exists.`
          : `Level ${level} is already used by ${clash.name}.`,
      values: formValues(formData),
    };

  await db.schoolClass.create({
    data: { name, stage, level, streams: { create: { name: firstStream } } },
  });

  await audit(actor, "academics", "class_created", `${name} (${stage}, level ${level})`);
  revalidatePath("/academics/classes");
  redirect("/academics/classes");
}

export async function addStream(formData: FormData) {
  const actor = await requirePermission("academics", "create");
  const classId = String(formData.get("classId") ?? "");
  const name = String(formData.get("name") ?? "").trim().toUpperCase();

  if (!name || name.length > 12) return;
  const cls = await db.schoolClass.findUnique({ where: { id: classId } });
  if (!cls) return;
  const exists = await db.stream.findUnique({
    where: { classId_name: { classId, name } },
  });
  if (exists) return;

  await db.stream.create({ data: { classId, name } });
  await audit(actor, "academics", "stream_added", `${cls.name} ${name}`);
  revalidatePath("/academics/classes");
}

export async function setStreamArchived(formData: FormData) {
  const actor = await requirePermission("academics", "archive");
  const id = String(formData.get("id") ?? "");
  const archived = String(formData.get("archived") ?? "") === "true";

  const stream = await db.stream.findUnique({ where: { id }, include: { class: true } });
  if (!stream) return;

  await db.stream.update({ where: { id }, data: { archived } });
  await audit(
    actor,
    "academics",
    archived ? "stream_archived" : "stream_restored",
    `${stream.class.name} ${stream.name}`,
  );
  revalidatePath("/academics/classes");
}

export async function setClassArchived(formData: FormData) {
  const actor = await requirePermission("academics", "archive");
  const id = String(formData.get("id") ?? "");
  const archived = String(formData.get("archived") ?? "") === "true";

  const cls = await db.schoolClass.findUnique({ where: { id } });
  if (!cls) return;

  await db.schoolClass.update({ where: { id }, data: { archived } });
  await audit(actor, "academics", archived ? "class_archived" : "class_restored", cls.name);
  revalidatePath("/academics/classes");
}

/** Assigns (or clears, with empty teacherId) the class teacher of a stream
    for the active session. */
export async function assignClassTeacher(formData: FormData) {
  const actor = await requirePermission("academics", "edit");
  const streamId = String(formData.get("streamId") ?? "");
  const teacherId = String(formData.get("teacherId") ?? "");

  const [stream, session] = await Promise.all([
    db.stream.findUnique({ where: { id: streamId }, include: { class: true } }),
    getActiveSession(),
  ]);
  if (!stream || !session) return;

  if (!teacherId) {
    await db.classTeacher.deleteMany({ where: { streamId, sessionId: session.id } });
    await audit(actor, "academics", "class_teacher_cleared", `${stream.class.name} ${stream.name}`);
    revalidatePath("/academics/classes");
    return;
  }

  const teacher = await db.user.findUnique({ where: { id: teacherId } });
  if (!teacher || teacher.role !== "TEACHER" || !teacher.active) return;

  await db.classTeacher.upsert({
    where: { streamId_sessionId: { streamId, sessionId: session.id } },
    update: { teacherId },
    create: { streamId, sessionId: session.id, teacherId },
  });

  await audit(
    actor,
    "academics",
    "class_teacher_assigned",
    `${teacher.name} → ${stream.class.name} ${stream.name} (${session.name})`,
  );
  revalidatePath("/academics/classes");
}
