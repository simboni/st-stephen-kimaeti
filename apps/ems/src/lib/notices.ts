import "server-only";
import type { NoticeAudience, Role } from "@prisma/client";
import { db } from "@/lib/db";

/** Which notice audiences a role belongs to. */
export function audiencesForRole(role: Role): NoticeAudience[] {
  if (role === "PARENT") return ["ALL", "PARENTS"];
  if (role === "STUDENT") return ["ALL", "STUDENTS"];
  return ["ALL", "STAFF"];
}

/** Live notices for a role — newest first. */
export async function currentNotices(role: Role, take = 5) {
  return db.notice.findMany({
    where: {
      archived: false,
      audience: { in: audiencesForRole(role) },
      OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
    },
    orderBy: { createdAt: "desc" },
    take,
  });
}

/** Upcoming calendar entries for a role — soonest first. */
export async function upcomingEvents(role: Role, take = 5) {
  const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z");
  return db.calendarEvent.findMany({
    where: {
      archived: false,
      audience: { in: audiencesForRole(role) },
      OR: [{ date: { gte: today } }, { endDate: { gte: today } }],
    },
    orderBy: { date: "asc" },
    take,
  });
}
