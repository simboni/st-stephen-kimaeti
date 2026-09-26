"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { getActiveSession } from "@/lib/school";
import { parseMoney } from "@/lib/money";

export type TransportFormState = { error?: string; values?: Record<string, string> };

const str = (fd: FormData, k: string) => (fd.get(k) as string | null)?.trim() ?? "";
const vals = (fd: FormData, keys: string[]) =>
  Object.fromEntries(keys.map((k) => [k, str(fd, k)]));

/* ----------------------------------------------------------------- routes -- */

export async function createRoute(
  _prev: TransportFormState,
  formData: FormData,
): Promise<TransportFormState> {
  const user = await requirePermission("transport", "create");
  const keys = ["name", "description"];
  const name = str(formData, "name");
  const description = str(formData, "description");

  if (!name) return { error: "Give the route a name.", values: vals(formData, keys) };
  if (await db.transportRoute.findUnique({ where: { name } }))
    return { error: `There is already a route called ${name}.`, values: vals(formData, keys) };

  const route = await db.transportRoute.create({
    data: { name, description: description || null },
  });
  await audit(user, "transport", "transport_route_created", name);
  redirect(`/transport/${route.id}`);
}

export async function setRouteArchived(formData: FormData) {
  const user = await requirePermission("transport", "archive");
  const id = str(formData, "id");
  const archived = str(formData, "archived") === "true";

  // Archiving a route in use would silently stop billing the pupils on it.
  if (archived) {
    const riders = await db.transportAssignment.count({ where: { routeId: id } });
    if (riders > 0) {
      const route = await db.transportRoute.findUnique({ where: { id } });
      redirect(`/transport/${id}?error=${encodeURIComponent(
        `${route?.name ?? "This route"} still carries ${riders} pupil${riders === 1 ? "" : "s"}. Move them to another route first.`,
      )}`);
    }
  }

  const route = await db.transportRoute.update({ where: { id }, data: { archived } });
  await audit(
    user,
    "transport",
    archived ? "transport_route_archived" : "transport_route_restored",
    route.name,
  );
  revalidatePath("/transport");
}

/* ----------------------------------------------------------------- stages -- */

export async function addStage(formData: FormData) {
  const user = await requirePermission("transport", "edit");
  const routeId = str(formData, "routeId");
  const name = str(formData, "name");
  if (!name) redirect(`/transport/${routeId}?error=${encodeURIComponent("Name the stage.")}`);

  const exists = await db.routeStage.findUnique({ where: { routeId_name: { routeId, name } } });
  if (exists)
    redirect(`/transport/${routeId}?error=${encodeURIComponent(`${name} is already a stage on this route.`)}`);

  // New stages go on the end; order is edited by moving them.
  const last = await db.routeStage.findFirst({
    where: { routeId },
    orderBy: { position: "desc" },
  });
  await db.routeStage.create({
    data: { routeId, name, position: (last?.position ?? 0) + 1 },
  });
  await audit(user, "transport", "transport_stage_added", name);
  revalidatePath(`/transport/${routeId}`);
}

export async function removeStage(formData: FormData) {
  const user = await requirePermission("transport", "edit");
  const id = str(formData, "id");
  const stage = await db.routeStage.findUnique({ where: { id } });
  if (!stage) return;
  await db.routeStage.delete({ where: { id } });
  await audit(user, "transport", "transport_stage_removed", stage.name);
  revalidatePath(`/transport/${stage.routeId}`);
}

/* --------------------------------------------------------------- vehicles -- */

export async function saveVehicle(
  _prev: TransportFormState,
  formData: FormData,
): Promise<TransportFormState> {
  const user = await requirePermission("transport", "create");
  const keys = [
    "id", "registration", "make", "capacity", "routeId",
    "driverName", "driverPhone", "driverLicence", "insuranceExpiry", "inspectionExpiry",
  ];
  const id = str(formData, "id");
  const registration = str(formData, "registration").toUpperCase();
  const capacityRaw = str(formData, "capacity");
  const capacity = parseInt(capacityRaw, 10);

  if (!registration)
    return { error: "Enter the vehicle registration.", values: vals(formData, keys) };
  if (!Number.isFinite(capacity) || capacity <= 0)
    return { error: "Capacity must be a whole number of seats.", values: vals(formData, keys) };

  const clash = await db.vehicle.findUnique({ where: { registration } });
  if (clash && clash.id !== id)
    return { error: `${registration} is already on the list.`, values: vals(formData, keys) };

  const data = {
    registration,
    make: str(formData, "make") || null,
    capacity,
    routeId: str(formData, "routeId") || null,
    driverName: str(formData, "driverName") || null,
    driverPhone: str(formData, "driverPhone") || null,
    driverLicence: str(formData, "driverLicence") || null,
    insuranceExpiry: str(formData, "insuranceExpiry")
      ? new Date(`${str(formData, "insuranceExpiry")}T00:00:00Z`)
      : null,
    inspectionExpiry: str(formData, "inspectionExpiry")
      ? new Date(`${str(formData, "inspectionExpiry")}T00:00:00Z`)
      : null,
  };

  if (id) {
    await db.vehicle.update({ where: { id }, data });
    await audit(user, "transport", "transport_vehicle_updated", registration);
  } else {
    await db.vehicle.create({ data });
    await audit(user, "transport", "transport_vehicle_added", registration);
  }
  redirect("/transport/vehicles?saved=1");
}

export async function setVehicleArchived(formData: FormData) {
  const user = await requirePermission("transport", "archive");
  const id = str(formData, "id");
  const archived = str(formData, "archived") === "true";
  const v = await db.vehicle.update({ where: { id }, data: { archived } });
  await audit(
    user,
    "transport",
    archived ? "transport_vehicle_retired" : "transport_vehicle_returned",
    v.registration,
  );
  revalidatePath("/transport/vehicles");
}

/* ------------------------------------------------------------ assignments -- */

export async function assignPupil(formData: FormData) {
  const user = await requirePermission("transport", "edit");
  const session = await getActiveSession();
  const routeId = str(formData, "routeId");
  const studentId = str(formData, "studentId");
  const stageId = str(formData, "stageId");
  const direction = str(formData, "direction") || "BOTH";
  const back = `/transport/${routeId}`;

  if (!session) redirect(`${back}?error=${encodeURIComponent("No active session.")}`);
  if (!studentId) redirect(`${back}?error=${encodeURIComponent("Choose a pupil.")}`);

  const student = await db.student.findUnique({ where: { id: studentId } });
  if (!student) redirect(`${back}?error=${encodeURIComponent("Pupil not found.")}`);

  // One route per pupil per session: moving them is an update, not a second row.
  await db.transportAssignment.upsert({
    where: { studentId_sessionId: { studentId, sessionId: session.id } },
    update: { routeId, stageId: stageId || null, direction: direction as "BOTH" },
    create: {
      studentId,
      sessionId: session.id,
      routeId,
      stageId: stageId || null,
      direction: direction as "BOTH",
    },
  });
  await audit(user, "transport", "transport_pupil_assigned", `${student.lastName}, ${student.firstName} → route`);
  revalidatePath(back);
  revalidatePath(`/fees/${studentId}`);
}

export async function unassignPupil(formData: FormData) {
  const user = await requirePermission("transport", "edit");
  const id = str(formData, "id");
  const assignment = await db.transportAssignment.findUnique({
    where: { id },
    include: { student: true },
  });
  if (!assignment) return;
  await db.transportAssignment.delete({ where: { id } });
  await audit(user, "transport", "transport_pupil_removed", `${assignment.student.lastName}, ${assignment.student.firstName}`);
  revalidatePath(`/transport/${assignment.routeId}`);
  revalidatePath(`/fees/${assignment.studentId}`);
}

/* ---------------------------------------------------------- route charges -- */

export async function setRouteFee(formData: FormData) {
  const user = await requirePermission("fees", "create");
  const session = await getActiveSession();
  const routeId = str(formData, "routeId");
  const termId = str(formData, "termId");
  const feeTypeId = str(formData, "feeTypeId");
  const amount = parseMoney(str(formData, "amount"));
  const back = `/transport/${routeId}`;

  if (!session) redirect(`${back}?error=${encodeURIComponent("No active session.")}`);
  if (!feeTypeId) redirect(`${back}?error=${encodeURIComponent("Choose a vote head.")}`);
  if (amount == null)
    redirect(`${back}?error=${encodeURIComponent("Enter the amount, e.g. 2,500.")}`);

  await db.feeItem.create({
    data: {
      feeTypeId,
      sessionId: session.id,
      termId: termId || null,
      routeId,
      amountCents: amount,
    },
  });
  const route = await db.transportRoute.findUnique({ where: { id: routeId } });
  await audit(user, "fees", "transport_fee_set", `${route?.name ?? "route"} — ${(amount / 100).toLocaleString("en-KE")}`);
  revalidatePath(back);
}

export async function removeRouteFee(formData: FormData) {
  const user = await requirePermission("fees", "archive");
  const id = str(formData, "id");
  const item = await db.feeItem.findUnique({ where: { id } });
  if (!item?.routeId) return;
  await db.feeItem.update({ where: { id }, data: { archived: true } });
  await audit(user, "fees", "transport_fee_removed", "route charge");
  revalidatePath(`/transport/${item.routeId}`);
}
