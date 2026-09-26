import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { can, requirePermission } from "@/lib/rbac";
import { getActiveSession } from "@/lib/school";
import { ChevronLeftIcon, CloseIcon } from "@/components/icons";
import {
  addRoom,
  allocateBed,
  releaseBed,
  removeRoom,
  setWarden,
} from "@/lib/actions/boarding-actions";

export const metadata: Metadata = { title: "Dormitory" };

export default async function HostelPage({
  params,
  searchParams,
}: {
  params: Promise<{ hostelId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requirePermission("boarding", "view");
  const { hostelId } = await params;
  const sp = await searchParams;
  const session = await getActiveSession();
  const mayEdit = await can(user.role, "boarding", "edit");

  const hostel = await db.hostel.findUnique({
    where: { id: hostelId },
    include: {
      warden: true,
      rooms: {
        include: {
          // Always the same shape: with no active session the filter simply
          // matches nothing, rather than changing the returned type.
          allocations: {
            where: { sessionId: session?.id ?? "__none__" },
            include: { student: true },
            orderBy: { bedNumber: "asc" },
          },
        },
        orderBy: { name: "asc" },
      },
    },
  });
  if (!hostel) notFound();

  // Boarders of the right sex who have no bed this session.
  const [waiting, staff] = await Promise.all([
    session
      ? db.enrollment.findMany({
          where: {
            sessionId: session.id,
            student: {
              archived: false,
              boarding: "BOARDER",
              gender: hostel.gender,
              bed: { none: { sessionId: session.id } },
            },
          },
          include: { student: true, stream: { include: { class: true } } },
          orderBy: [{ stream: { class: { level: "asc" } } }, { student: { lastName: "asc" } }],
        })
      : [],
    db.staffProfile.findMany({ where: { archived: false }, orderBy: { lastName: "asc" } }),
  ]);

  const beds = hostel.rooms.reduce((s, r) => s + r.beds, 0);
  const taken = hostel.rooms.reduce((s, r) => s + r.allocations.length, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Link
          href="/boarding"
          className="mb-2 inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:underline"
        >
          <ChevronLeftIcon className="h-3.5 w-3.5" /> All dormitories
        </Link>
        <h1 className="font-display text-2xl font-extrabold text-ink-900">{hostel.name}</h1>
        <p className="mt-1 text-sm">
          {hostel.gender === "MALE" ? "Boys" : "Girls"} dormitory
          {session ? ` · ${session.name}` : ""}
        </p>
      </div>

      {sp.error && (
        <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800">
          {sp.error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="chip bg-paper-200 text-ink-700">
          Beds: <b className="ml-1 text-ink-900">{taken} of {beds} taken</b>
        </span>
        <span className="chip bg-paper-200 text-ink-700">
          Rooms: <b className="ml-1 text-ink-900">{hostel.rooms.length}</b>
        </span>
        {waiting.length > 0 && (
          <span className="chip bg-brand-50 text-brand-800">
            {waiting.length} {hostel.gender === "MALE" ? "boy" : "girl"}
            {waiting.length === 1 ? "" : "s"} still without a bed
          </span>
        )}
      </div>

      {/* Warden */}
      {mayEdit && (
        <form action={setWarden} className="card flex flex-wrap items-end gap-3 p-4">
          <input type="hidden" name="id" value={hostel.id} />
          <div>
            <label htmlFor="wardenId" className="mb-1 block text-xs font-bold text-ink-400">
              Matron / master in charge
            </label>
            <select
              id="wardenId"
              name="wardenId"
              defaultValue={hostel.wardenId ?? ""}
              className="field !w-64 !py-1.5 text-sm"
            >
              <option value="">Nobody assigned</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.lastName}, {s.firstName} — {s.designation}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-secondary !py-1.5 text-xs">
            Save
          </button>
        </form>
      )}

      {/* Rooms and their beds */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {hostel.rooms.length === 0 && (
          <p className="card p-6 text-sm text-ink-400">
            No rooms yet — add the first one below.
          </p>
        )}
        {hostel.rooms.map((room) => {
          const occupants = room.allocations;
          const free = room.beds - occupants.length;
          return (
            <section key={room.id} className="card p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="font-display text-base font-extrabold text-ink-900">
                  {room.name}
                  <span className="ml-2 text-xs font-normal text-ink-400">
                    {occupants.length} of {room.beds}
                  </span>
                </h2>
                {mayEdit && occupants.length === 0 && (
                  <form action={removeRoom}>
                    <input type="hidden" name="id" value={room.id} />
                    <button type="submit" className="btn btn-danger !p-1.5" aria-label={`Remove ${room.name}`}>
                      <CloseIcon className="h-3 w-3" />
                    </button>
                  </form>
                )}
              </div>

              <ul className="space-y-1.5">
                {occupants.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-paper-100 px-3 py-2"
                  >
                    <span className="text-sm">
                      <span className="mr-2 font-mono text-xs text-ink-400">
                        bed {a.bedNumber}
                      </span>
                      <span className="font-semibold text-ink-900">
                        {a.student.lastName}, {a.student.firstName}
                      </span>
                    </span>
                    {mayEdit && (
                      <form action={releaseBed}>
                        <input type="hidden" name="id" value={a.id} />
                        <button type="submit" className="text-xs font-bold text-brand-600 hover:underline">
                          Move out
                        </button>
                      </form>
                    )}
                  </li>
                ))}
                {free > 0 && (
                  <li className="rounded-lg border border-dashed border-paper-300 px-3 py-2 text-xs text-ink-400">
                    {free} bed{free === 1 ? "" : "s"} free
                  </li>
                )}
              </ul>

              {mayEdit && free > 0 && session && waiting.length > 0 && (
                <form action={allocateBed} className="mt-3 flex gap-2">
                  <input type="hidden" name="roomId" value={room.id} />
                  <input type="hidden" name="hostelId" value={hostel.id} />
                  <select
                    name="studentId"
                    aria-label={`Place a pupil in ${room.name}`}
                    className="field !py-1.5 text-xs"
                  >
                    <option value="">Place a pupil…</option>
                    {waiting.map((e) => (
                      <option key={e.studentId} value={e.studentId}>
                        {e.student.lastName}, {e.student.firstName} — {e.stream.class.name}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="btn btn-secondary !py-1.5 text-xs">
                    Place
                  </button>
                </form>
              )}
            </section>
          );
        })}
      </div>

      {mayEdit && (
        <form action={addRoom} className="card flex flex-wrap items-end gap-3 p-4">
          <input type="hidden" name="hostelId" value={hostel.id} />
          <div>
            <label htmlFor="roomName" className="mb-1 block text-xs font-bold text-ink-400">
              Room name
            </label>
            <input id="roomName" name="name" placeholder="e.g. Room 1" className="field !w-40 !py-1.5 text-sm" />
          </div>
          <div>
            <label htmlFor="beds" className="mb-1 block text-xs font-bold text-ink-400">
              Beds
            </label>
            <input id="beds" name="beds" inputMode="numeric" placeholder="12" className="field !w-24 !py-1.5 text-sm" />
          </div>
          <button type="submit" className="btn btn-secondary !py-1.5 text-xs">
            Add room
          </button>
        </form>
      )}
    </div>
  );
}
