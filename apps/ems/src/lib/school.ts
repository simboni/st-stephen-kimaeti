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
      name: "Holy Cross Junior & Infant Schools",
      shortName: "Holy Cross Bulimbo",
      motto: "Learners Today, Leaders Tomorrow",
      email: "info@holycrossbulimbo.com",
      phone: "0714 103 761",
      address: "P.O. Box 134 – 50109, Bulimbo, Kakamega",
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
