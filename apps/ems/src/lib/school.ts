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
      motto: "Learners Today, Leaders Tomorrow",
      email: "ststephenprimarykimaeti@gmail.com",
      phone: "0714 118 611 / 0724 570 171",
      address: "P.O. Box 93 – 50200, Bungoma",
    },
    omit: { logo: true },
  });
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
