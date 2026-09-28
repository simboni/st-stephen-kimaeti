import "server-only";
import { db } from "@/lib/db";

/** The singleton school profile, created with defaults on first read.
    The logo bytes are omitted — fetch them only in the logo route. */
export async function getSchoolSettings() {
  return db.schoolSetting.upsert({
    where: { id: "school" },
    update: {},
    create: {
      id: "school",
      name: "St Stephen Mixed Day and Boarding Primary School, Junior School & Early Years of Education Centre",
      shortName: "St Stephen's Kimaeti",
      motto: "Ora et Labora — Pray and Work",
      email: "ststephenprimarykimaeti@gmail.com",
      phone: "0714 118 611 / 0724 570 171",
      address: "P.O. Box 93 – 50200, Bungoma",
      admissionPrefix: "SSK",
    },
    omit: { logo: true },
  });
}

/** The next free admission number, e.g. SSK-260041.
 *
 *  The prefix is a school setting rather than a constant: this platform is
 *  meant to run more than one school, and a pupil at St Stephen's should not
 *  be issued a number that begins with another school's initials.
 *
 *  Counting rows gives the serial, which can collide if a number was typed in
 *  by hand, so the caller walks forward until the number is free. */
export async function nextAdmissionNo(): Promise<string> {
  const [settings, count] = await Promise.all([
    getSchoolSettings(),
    db.student.count(),
  ]);
  const year = new Date().getFullYear().toString().slice(-2);
  let serial = count + 1;
  let candidate = `${settings.admissionPrefix}-${year}${String(serial).padStart(4, "0")}`;
  while (await db.student.findUnique({ where: { admissionNo: candidate }, select: { id: true } })) {
    serial += 1;
    candidate = `${settings.admissionPrefix}-${year}${String(serial).padStart(4, "0")}`;
  }
  return candidate;
}

/** URL of the school logo — the uploaded one when present (cache-busted on
    change), else the bundled default. */
export function logoSrc(settings: { logoType: string | null; updatedAt: Date }) {
  return settings.logoType
    ? `/api/school/logo?v=${settings.updatedAt.getTime()}`
    : "/logo.png";
}

/** The currently active academic session (with terms), or null before setup. */
export async function getActiveSession() {
  return db.academicSession.findFirst({
    where: { active: true },
    include: { terms: { orderBy: { number: "asc" } } },
  });
}
