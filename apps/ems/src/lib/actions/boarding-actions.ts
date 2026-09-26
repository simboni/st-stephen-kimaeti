"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { getActiveSession } from "@/lib/school";

export type BoardingFormState = { error?: string; values?: Record<string, string> };

const str = (fd: FormData, k: string) => (fd.get(k) as string | null)?.trim() ?? "";
const vals = (fd: FormData, keys: string[]) =>
  Object.fromEntries(keys.map((k) => [k, str(fd, k)]));

/* ---------------------------------------------------------------- hostels -- */

export async function createHostel(
  _prev: BoardingFormState,
  formData: FormData,
): Promise<BoardingFormState> {
  const user = await requirePermission("boarding", "create");
  const keys = ["name", "gender", "wardenId"];
  const name = str(formData, "name");
  const gender = str(formData, "gender");

  if (!name) return { error: "Give the dormitory a name.", values: vals(formData, keys) };
  if (gender !== "MALE" && gender !== "FEMALE")
    return { error: "Say whether it houses boys or girls.", values: vals(formData, keys) };
  if (await db.hostel.findUnique({ where: { name } }))
    return { error: `There is already a dormitory called ${name}.`, values: vals(formData, keys) };

  const hostel = await db.hostel.create({
    data: { name, gender, wardenId: str(formData, "wardenId") || null },
  });
  await audit(user, "boarding", "hostel_created", `${name} (${gender === "MALE" ? "boys" : "girls"})`);
  redirect(`/boarding/${hostel.id}`);
}

export async function setHostelArchived(formData: FormData) {
  const user = await requirePermission("boarding", "archive");
  const id = str(formData, "id");
  const archived = str(formData, "archived") === "true";
  const session = await getActiveSession();

  if (archived && session) {
    const occupied = await db.bedAllocation.count({
      where: { sessionId: session.id, room: { hostelId: id } },
    });
    if (occupied > 0) {
      redirect(`/boarding?error=${encodeURIComponent(
        `That dormitory still sleeps ${occupied} pupil${occupied === 1 ? "" : "s"}. Move them out first.`,
      )}`);
    }
  }

  const hostel = await db.hostel.update({ where: { id }, data: { archived } });
  await audit(user, "boarding", archived ? "hostel_archived" : "hostel_restored", hostel.name);
  revalidatePath("/boarding");
}

export async function setWarden(formData: FormData) {
  const user = await requirePermission("boarding", "edit");
  const id = str(formData, "id");
  const wardenId = str(formData, "wardenId") || null;
  const hostel = await db.hostel.update({
    where: { id },
    data: { wardenId },
    include: { warden: true },
  });
  await audit(
    user,
    "boarding",
    "hostel_warden_set",
    `${hostel.name} → ${hostel.warden ? `${hostel.warden.firstName} ${hostel.warden.lastName}` : "nobody"}`,
  );
  revalidatePath(`/boarding/${id}`);
}

/* ------------------------------------------------------------------ rooms -- */

export async function addRoom(formData: FormData) {
  const user = await requirePermission("boarding", "edit");
  const hostelId = str(formData, "hostelId");
  const name = str(formData, "name");
  const beds = parseInt(str(formData, "beds"), 10);
  const back = `/boarding/${hostelId}`;

  if (!name) redirect(`${back}?error=${encodeURIComponent("Name the room.")}`);
  if (!Number.isFinite(beds) || beds <= 0)
    redirect(`${back}?error=${encodeURIComponent("How many beds does it hold?")}`);
  if (await db.hostelRoom.findUnique({ where: { hostelId_name: { hostelId, name } } }))
    redirect(`${back}?error=${encodeURIComponent(`${name} already exists in this dormitory.`)}`);

  await db.hostelRoom.create({ data: { hostelId, name, beds } });
  await audit(user, "boarding", "room_added", `${name} (${beds} beds)`);
  revalidatePath(back);
}

export async function removeRoom(formData: FormData) {
  const user = await requirePermission("boarding", "edit");
  const id = str(formData, "id");
  const room = await db.hostelRoom.findUnique({
    where: { id },
    include: { _count: { select: { allocations: true } } },
  });
  if (!room) return;
  if (room._count.allocations > 0) {
    redirect(`/boarding/${room.hostelId}?error=${encodeURIComponent(
      `${room.name} still has pupils in it. Move them out before removing the room.`,
    )}`);
  }
  await db.hostelRoom.delete({ where: { id } });
  await audit(user, "boarding", "room_removed", room.name);
  revalidatePath(`/boarding/${room.hostelId}`);
}

/* ------------------------------------------------------------ allocations -- */

export async function allocateBed(formData: FormData) {
  const user = await requirePermission("boarding", "edit");
  const session = await getActiveSession();
  const roomId = str(formData, "roomId");
  const studentId = str(formData, "studentId");
  const hostelId = str(formData, "hostelId");
  const back = `/boarding/${hostelId}`;
  const fail = (m: string) => redirect(`${back}?error=${encodeURIComponent(m)}`);

  if (!session) fail("No active session.");
  if (!studentId) fail("Choose a pupil.");

  const [room, student] = await Promise.all([
    db.hostelRoom.findUnique({
      where: { id: roomId },
      include: {
        hostel: true,
        allocations: { where: { sessionId: session!.id }, select: { bedNumber: true } },
      },
    }),
    db.student.findUnique({ where: { id: studentId } }),
  ]);
  if (!room) fail("Room not found.");
  if (!student) fail("Pupil not found.");

  // A boys' dormitory holds boys. Getting this wrong is not a rounding error.
  if (room!.hostel.gender !== student!.gender) {
    fail(
      `${room!.hostel.name} is a ${room!.hostel.gender === "MALE" ? "boys" : "girls"} dormitory — ` +
        `${student!.firstName} ${student!.lastName} cannot be placed there.`,
    );
  }
  if (student!.boarding !== "BOARDER") {
    fail(`${student!.firstName} ${student!.lastName} is a day scholar. Change that on their profile first.`);
  }

  const taken = new Set(room!.allocations.map((a) => a.bedNumber));
  if (taken.size >= room!.beds) fail(`${room!.name} is full — all ${room!.beds} beds are taken.`);

  // Lowest free bed number, so beds fill in order rather than scattering.
  let bedNumber = 1;
  while (taken.has(bedNumber)) bedNumber += 1;

  await db.bedAllocation.upsert({
    where: { studentId_sessionId: { studentId, sessionId: session!.id } },
    update: { roomId, bedNumber },
    create: { studentId, sessionId: session!.id, roomId, bedNumber },
  });
  await audit(
    user,
    "boarding",
    "bed_allocated",
    `${student!.lastName}, ${student!.firstName} → ${room!.hostel.name} ${room!.name} bed ${bedNumber}`,
  );
  revalidatePath(back);
}

export async function releaseBed(formData: FormData) {
  const user = await requirePermission("boarding", "edit");
  const id = str(formData, "id");
  const allocation = await db.bedAllocation.findUnique({
    where: { id },
    include: { student: true, room: { include: { hostel: true } } },
  });
  if (!allocation) return;
  await db.bedAllocation.delete({ where: { id } });
  await audit(
    user,
    "boarding",
    "bed_released",
    `${allocation.student.lastName}, ${allocation.student.firstName} from ${allocation.room.hostel.name} ${allocation.room.name}`,
  );
  revalidatePath(`/boarding/${allocation.room.hostelId}`);
}
