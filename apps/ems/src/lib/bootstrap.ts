import "server-only";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

/**
 * Self-healing first-run setup: if the database has no users at all (fresh
 * database, or the deploy-time seed never ran), create the first account and
 * the default permission matrix. Mirrors prisma/seed.mjs — keep the two in sync.
 * Runs only when the User table is completely empty, so it can never touch
 * real data.
 *
 * Two modes:
 *   demo       — the shared-password role logins plus sample pupils, fees,
 *                staff and payments that make a fresh deploy explorable.
 *   production — real structure only (permission matrix, school settings,
 *                classes, CBC subjects, vote heads, finance heads, leave
 *                types) and ONE superadmin whose password comes from
 *                ADMIN_PASSWORD — never the password published in the README.
 *
 * Demo mode is the default OUTSIDE production. Under NODE_ENV=production it is
 * off unless SEED_DEMO=true is set explicitly, so an internet-facing install
 * can never come up holding real pupil records behind a publicly known
 * administrator password.
 */
const DEMO_PASSWORD = "ststephen2026";

function demoDataWanted(): boolean {
  const flag = process.env.SEED_DEMO;
  if (flag != null) return flag !== "false" && flag !== "0";
  return process.env.NODE_ENV !== "production";
}

const USERS = [
  { username: "superadmin", name: "System Owner", role: "SUPER_ADMIN", email: "superadmin@ststephenkimaeti.ac.ke" },
  { username: "admin", name: "School Administrator", role: "ADMIN", email: "admin@ststephenkimaeti.ac.ke" },
  { username: "accountant", name: "School Accountant", role: "ACCOUNTANT", email: "accounts@ststephenkimaeti.ac.ke" },
  { username: "teacher", name: "Demo Teacher", role: "TEACHER", email: "teacher@ststephenkimaeti.ac.ke" },
  { username: "reception", name: "Front Office", role: "RECEPTIONIST", email: "frontoffice@ststephenkimaeti.ac.ke" },
  { username: "librarian", name: "School Librarian", role: "LIBRARIAN", email: "library@ststephenkimaeti.ac.ke" },
  { username: "parent", name: "Demo Parent", role: "PARENT", email: "parent@example.com" },
  { username: "student", name: "Demo Student", role: "STUDENT", email: "student@example.com" },
] as const;

const MATRIX: Record<string, Record<string, [number, number, number, number]>> = {
  dashboard: {
    ADMIN: [1, 0, 0, 0], ACCOUNTANT: [1, 0, 0, 0], TEACHER: [1, 0, 0, 0],
    RECEPTIONIST: [1, 0, 0, 0], LIBRARIAN: [1, 0, 0, 0], PARENT: [1, 0, 0, 0], STUDENT: [1, 0, 0, 0],
  },
  academics: { ADMIN: [1, 1, 1, 1], TEACHER: [1, 0, 0, 0] },
  students: { ADMIN: [1, 1, 1, 1], TEACHER: [1, 0, 0, 0], RECEPTIONIST: [1, 1, 0, 0], ACCOUNTANT: [1, 0, 0, 0] },
  attendance: { ADMIN: [1, 1, 1, 1], TEACHER: [1, 1, 1, 0], RECEPTIONIST: [1, 0, 0, 0] },
  exams: { ADMIN: [1, 1, 1, 1], TEACHER: [1, 1, 0, 0] },
  fees: { ADMIN: [1, 1, 1, 1], ACCOUNTANT: [1, 1, 1, 1], RECEPTIONIST: [1, 0, 0, 0] },
  finance: { ADMIN: [1, 1, 1, 1], ACCOUNTANT: [1, 1, 1, 1] },
  transport: { ADMIN: [1, 1, 1, 1], ACCOUNTANT: [1, 0, 0, 0], RECEPTIONIST: [1, 0, 0, 0] },
  boarding: { ADMIN: [1, 1, 1, 1], RECEPTIONIST: [1, 0, 0, 0], TEACHER: [1, 0, 0, 0] },
  staff: { ADMIN: [1, 1, 1, 1], ACCOUNTANT: [1, 0, 0, 0] },
  payroll: { ADMIN: [1, 1, 1, 1], ACCOUNTANT: [1, 1, 1, 1] },
  communication: { ADMIN: [1, 1, 1, 1], RECEPTIONIST: [1, 1, 0, 0], TEACHER: [1, 0, 0, 0] },
  frontoffice: { ADMIN: [1, 1, 1, 1], RECEPTIONIST: [1, 1, 1, 1] },
  reports: { ADMIN: [1, 0, 0, 0], ACCOUNTANT: [1, 0, 0, 0] },
  homework: { ADMIN: [1, 1, 1, 1], TEACHER: [1, 1, 1, 1] },
  users: { ADMIN: [1, 1, 1, 1] },
  settings: { ADMIN: [1, 0, 1, 0] },
  audit: { ADMIN: [1, 0, 0, 0] },
};

export async function bootstrapIfEmpty(): Promise<boolean> {
  const count = await db.user.count();
  if (count > 0) return false;

  const demo = demoDataWanted();
  const password = process.env.ADMIN_PASSWORD ?? (demo ? DEMO_PASSWORD : null);
  if (!password) {
    // Creating nothing is the safe failure: no account exists, so nobody can
    // sign in, rather than everybody being able to with a known password.
    console.error(
      "[bootstrap] Database is empty and ADMIN_PASSWORD is not set — refusing to " +
        "create an administrator. Set ADMIN_PASSWORD in the service environment " +
        "and restart (or SEED_DEMO=true for a throwaway demo install).",
    );
    return false;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const users = demo ? USERS : USERS.filter((u) => u.username === "superadmin");
  for (const u of users) {
    await db.user.upsert({
      where: { username: u.username },
      update: {},
      create: { ...u, passwordHash },
    });
  }
  for (const [module, roles] of Object.entries(MATRIX)) {
    for (const [role, [v, c, e, a]] of Object.entries(roles)) {
      await db.rolePermission.upsert({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        where: { role_module: { role: role as any, module } },
        update: {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        create: { role: role as any, module, canView: !!v, canCreate: !!c, canEdit: !!e, canArchive: !!a },
      });
    }
  }
  await db.schoolSetting.upsert({
    where: { id: "school" },
    update: {},
    create: {
      id: "school",
      name: "St Stephen’s Brothers’ School",
      shortName: "St Stephen's Kimaeti",
      motto: "Pray and Work",
      email: "ststephenprimarykimaeti@gmail.com",
      phone: "0728 836 150",
      address: "P.O. Box 93 – 50200, Bungoma",
      // Without this the row takes the schema default "ADM" and every pupil
      // is admitted as ADM-26xxxx. The "SSK" in lib/school.ts never applies,
      // because that upsert only creates the row if this one has not already.
      admissionPrefix: "SSK",
    },
  });

  // A real install creates its own session with the school's real term dates
  // (Settings → Sessions & Terms) — sample dates would quietly mis-bill fees.
  const session = demo ? await db.academicSession.findUnique({ where: { name: "2025-2026" } }) : true;
  if (!session) {
    await db.academicSession.create({
      data: {
        name: "2025-2026",
        startDate: new Date("2025-09-01T00:00:00Z"),
        endDate: new Date("2026-08-07T00:00:00Z"),
        active: true,
        terms: {
          create: [
            { number: 1, name: "Term 1", startDate: new Date("2025-09-01T00:00:00Z"), endDate: new Date("2025-11-21T00:00:00Z") },
            { number: 2, name: "Term 2", startDate: new Date("2026-01-05T00:00:00Z"), endDate: new Date("2026-04-03T00:00:00Z") },
            { number: 3, name: "Term 3", startDate: new Date("2026-05-04T00:00:00Z"), endDate: new Date("2026-08-07T00:00:00Z") },
          ],
        },
      },
    });
  }


  // The school's class structure — Infant through Junior (CBC).
  const classList: [string, number, "INFANT" | "PRIMARY" | "JUNIOR"][] = [
    ["Playgroup", 0, "INFANT"], ["PP1", 1, "INFANT"], ["PP2", 2, "INFANT"],
    ["Grade 1", 3, "PRIMARY"], ["Grade 2", 4, "PRIMARY"], ["Grade 3", 5, "PRIMARY"],
    ["Grade 4", 6, "PRIMARY"], ["Grade 5", 7, "PRIMARY"], ["Grade 6", 8, "PRIMARY"],
    ["Grade 7", 9, "JUNIOR"], ["Grade 8", 10, "JUNIOR"], ["Grade 9", 11, "JUNIOR"],
  ];
  for (const [name, level, stage] of classList) {
    const cls = await db.schoolClass.upsert({
      where: { name },
      update: {},
      create: { name, level, stage },
    });
    await db.stream.upsert({
      where: { classId_name: { classId: cls.id, name: "A" } },
      update: {},
      create: { classId: cls.id, name: "A" },
    });
  }


  // CBC learning areas with the stages that take them. SAMPLE — adjust in-app.
  const subjectList: [string, string, string[]][] = [
    // [name, code, stages]
    ["Language Activities", "LANG", ["INFANT"]],
    ["Mathematical Activities", "MATA", ["INFANT"]],
    ["Environmental Activities", "ENVA", ["INFANT"]],
    ["Creative Activities", "CREA", ["INFANT"]],
    ["English", "ENG", ["PRIMARY", "JUNIOR"]],
    ["Kiswahili", "KIS", ["PRIMARY", "JUNIOR"]],
    ["Mathematics", "MATH", ["PRIMARY", "JUNIOR"]],
    ["Science & Technology", "SCI", ["PRIMARY"]],
    ["Integrated Science", "INTS", ["JUNIOR"]],
    ["Social Studies", "SST", ["PRIMARY", "JUNIOR"]],
    ["Christian Religious Education", "CRE", ["INFANT", "PRIMARY", "JUNIOR"]],
    ["Creative Arts & Sports", "CAS", ["PRIMARY", "JUNIOR"]],
    ["Agriculture & Nutrition", "AGR", ["PRIMARY", "JUNIOR"]],
    ["Pre-Technical Studies", "PTS", ["JUNIOR"]],
  ];
  const allClasses = await db.schoolClass.findMany();
  for (const [name, code, stages] of subjectList) {
    const subject = await db.subject.upsert({
      where: { name },
      update: {},
      create: { name, code, type: "CORE" as const },
    });
    for (const cls of allClasses.filter((c) => stages.includes(c.stage))) {
      await db.classSubject.upsert({
        where: { classId_subjectId: { classId: cls.id, subjectId: subject.id } },
        update: {},
        create: { classId: cls.id, subjectId: subject.id },
      });
    }
  }


  // Demo pupils — SAMPLE data spread across classes, each with a guardian.
  const demoStudents: [string, string, "MALE" | "FEMALE", string, string, string, string][] = [
    ["Amani", "Wekesa", "MALE", "Grade 1", "Mary Wekesa", "Mother", "0712000001"],
    ["Blessing", "Nafula", "FEMALE", "Grade 1", "Peter Nafula", "Father", "0712000002"],
    ["Collins", "Barasa", "MALE", "Grade 2", "Agnes Barasa", "Mother", "0712000003"],
    ["Diana", "Khisa", "FEMALE", "Grade 3", "John Khisa", "Father", "0712000004"],
    ["Emmanuel", "Simiyu", "MALE", "Grade 4", "Rose Simiyu", "Mother", "0712000005"],
    ["Faith", "Naliaka", "FEMALE", "Grade 4", "David Naliaka", "Father", "0712000006"],
    ["Gift", "Wanjala", "MALE", "Grade 5", "Esther Wanjala", "Mother", "0712000007"],
    ["Hope", "Nekesa", "FEMALE", "Grade 6", "Samuel Nekesa", "Father", "0712000008"],
    ["Ian", "Mukhwana", "MALE", "Grade 7", "Grace Mukhwana", "Mother", "0712000009"],
    ["Joy", "Nasimiyu", "FEMALE", "Grade 8", "Paul Nasimiyu", "Father", "0712000010"],
    ["Kevin", "Wafula", "MALE", "Grade 9", "Lydia Wafula", "Mother", "0712000011"],
    ["Lucy", "Auma", "FEMALE", "PP1", "Tom Auma", "Father", "0712000012"],
    ["Moses", "Odhiambo", "MALE", "PP2", "Sarah Odhiambo", "Mother", "0712000013"],
    ["Neema", "Atieno", "FEMALE", "Playgroup", "James Atieno", "Father", "0712000014"],
    ["Oscar", "Juma", "MALE", "Grade 2", "Beatrice Juma", "Mother", "0712000015"],
  ];
  // The demo pupils' admission numbers carry whatever prefix this school is
  // configured with, so a demo install never shows another school's initials.
  const prefix = (await db.schoolSetting.findUnique({
    where: { id: "school" },
    select: { admissionPrefix: true },
  }))?.admissionPrefix ?? "ADM";
  const activeSession = demo ? await db.academicSession.findFirst({ where: { active: true } }) : null;
  if (activeSession) {
    let serial = 1;
    for (const [firstName, lastName, gender, className, gName, gRel, gPhone] of demoStudents) {
      const admissionNo = `${prefix}-25${String(serial++).padStart(4, "0")}`;
      const exists = await db.student.findUnique({ where: { admissionNo } });
      if (exists) continue;
      const stream = await db.stream.findFirst({
        where: { name: "A", class: { name: className } },
      });
      if (!stream) continue;
      await db.student.create({
        data: {
          admissionNo,
          firstName,
          lastName,
          gender,
          boarding: serial % 4 === 0 ? ("BOARDER" as const) : ("DAY" as const),
          guardians: { create: [{ name: gName, relation: gRel, phone: gPhone }] },
          enrollments: { create: { streamId: stream.id, sessionId: activeSession.id } },
        },
      });
    }
  }


  // Link the demo parent to two pupils and the demo student account to one.
  const demoParent = demo ? await db.user.findUnique({ where: { username: "parent" } }) : null;
  const demoStudentUser = demo ? await db.user.findUnique({ where: { username: "student" } }) : null;
  const firstPupils = await db.student.findMany({
    where: { admissionNo: { in: [`${prefix}-250001`, `${prefix}-250002`] } },
    orderBy: { admissionNo: "asc" },
  });
  if (demoParent) {
    for (const pupil of firstPupils) {
      await db.parentLink.upsert({
        where: { userId_studentId: { userId: demoParent.id, studentId: pupil.id } },
        update: {},
        create: { userId: demoParent.id, studentId: pupil.id },
      });
    }
  }
  if (demoStudentUser && firstPupils[0] && !firstPupils[0].userId) {
    await db.student.update({
      where: { id: firstPupils[0].id },
      data: { userId: demoStudentUser.id },
    });
  }


  // Fee structure — SAMPLE amounts per stage per term; adjust in Fees Setup.
  // Fee types are the vote heads payments are collected against.
  // The fifteen voteheads on the school's 2026 fee sheets — see
  // docs/school/FEE-STRUCTURE-2026.md. Amounts are set in Fees Setup, not here.
  const feeTypeNames = [
    "Tuition", "Accommodation", "Stationery", "Meals", "Medical",
    "Electricity", "Bus Maintenance", "RMI", "Games/Music", "WKD/BS",
    "Assessment Book", "Motivation", "Development", "Welfare",
    "External Assessment",
  ];
  const feeTypesByName: Record<string, { id: string }> = {};
  for (const name of feeTypeNames) {
    feeTypesByName[name] = await db.feeType.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  // Vote heads above are real; the amounts below are not. A real install sets
  // its own per-term, per-class figures in Fees → Fees Setup.
  const feeSession = demo
    ? await db.academicSession.findFirst({ where: { active: true }, include: { terms: true } })
    : null;
  if (feeSession && (await db.feeItem.count({ where: { sessionId: feeSession.id } })) === 0) {
    const stageTuition: Record<string, number> = { INFANT: 800000, PRIMARY: 1200000, JUNIOR: 1500000 }; // cents/term
    const classesForFees = await db.schoolClass.findMany();
    for (const term of feeSession.terms) {
      for (const cls of classesForFees) {
        await db.feeItem.create({
          data: {
            feeTypeId: feeTypesByName["Tuition"].id,
            sessionId: feeSession.id,
            termId: term.id,
            classId: cls.id,
            amountCents: stageTuition[cls.stage],
          },
        });
      }
      await db.feeItem.create({
        data: {
          feeTypeId: feeTypesByName["Meals"].id,
          sessionId: feeSession.id,
          termId: term.id,
          boarding: "DAY" as const,
          amountCents: 350000,
        },
      });
      await db.feeItem.create({
        data: {
          feeTypeId: feeTypesByName["Accommodation"].id,
          sessionId: feeSession.id,
          termId: term.id,
          boarding: "BOARDER" as const,
          amountCents: 1800000,
        },
      });
    }
    await db.feeItem.create({
      data: {
        feeTypeId: feeTypesByName["Games/Music"].id,
        sessionId: feeSession.id,
        amountCents: 200000,
      },
    });
    // sample payments for the two portal-demo pupils
    const paidPupils = await db.student.findMany({
      where: { admissionNo: { in: [`${prefix}-250001`, `${prefix}-250002`] } },
    });
    let receiptSerial = (await db.feePayment.count()) + 1;
    for (const pupil of paidPupils) {
      await db.feePayment.create({
        data: {
          receiptNo: `RCT-25${String(receiptSerial++).padStart(4, "0")}`,
          studentId: pupil.id,
          sessionId: feeSession.id,
          amountCents: 2000000,
          method: "CASH" as const,
          receivedBy: "accountant",
          allocations: {
            create: [{ feeTypeId: feeTypesByName["Tuition"].id, amountCents: 2000000 }],
          },
        },
      });
    }
  }

  // Finance heads — SAMPLE ledger categories; add more in Income & Expenses.
  const financeHeads: [string, "INCOME" | "EXPENSE"][] = [
    ["Uniform Sales", "INCOME"],
    ["Donations & Grants", "INCOME"],
    ["Farm Produce", "INCOME"],
    ["Salaries & Wages", "EXPENSE"],
    ["Utilities", "EXPENSE"],
    ["Teaching Materials", "EXPENSE"],
    ["Repairs & Maintenance", "EXPENSE"],
    ["Food & Kitchen", "EXPENSE"],
  ];
  for (const [name, kind] of financeHeads) {
    await db.financeHead.upsert({
      where: { name_kind: { name, kind } },
      update: {},
      create: { name, kind },
    });
  }

  // Staff directory — SAMPLE profiles; demo logins linked where they exist.
  const staffList: [string, string, string, "MALE" | "FEMALE", string, string, string | null, string | null][] = [
    ["ST-001", "Margaret", "Wanjiru", "FEMALE", "Head Teacher", "Administration", "B.Ed", null],
    ["ST-002", "Joseph", "Otieno", "MALE", "Deputy Head Teacher", "Administration", "B.Ed", null],
    ["ST-003", "Demo", "Teacher", "MALE", "Teacher", "Academics", "Dip.Ed", "teacher"],
    ["ST-004", "Anne", "Chebet", "FEMALE", "Accountant", "Finance", "CPA II", "accountant"],
    ["ST-005", "Janet", "Akinyi", "FEMALE", "Secretary", "Administration", null, "reception"],
    ["ST-006", "Peter", "Mutua", "MALE", "Cook", "Support Staff", null, null],
  ];
  for (const [employeeNo, firstName, lastName, gender, designation, department, qualification, linkUsername] of demo ? staffList : []) {
    const exists = await db.staffProfile.findUnique({ where: { employeeNo } });
    if (exists) continue;
    let userId: string | null = null;
    if (linkUsername) {
      const linkUser = await db.user.findUnique({
        where: { username: linkUsername },
        include: { staffProfile: true },
      });
      if (linkUser && !linkUser.staffProfile) userId = linkUser.id;
    }
    await db.staffProfile.create({
      data: { employeeNo, firstName, lastName, gender, designation, department, qualification, userId },
    });
  }

  // SAMPLE salary structures (KES cents) — the accountant adjusts in Payroll.
  const salaries: [string, number, number, number, number, number][] = [
    ["ST-001", 4500000, 900000, 108000, 148500, 650000],
    ["ST-002", 3800000, 760000, 108000, 125400, 480000],
    ["ST-003", 3000000, 600000, 108000, 99000, 320000],
    ["ST-004", 3200000, 640000, 108000, 105600, 360000],
    ["ST-005", 2200000, 440000, 108000, 72600, 190000],
    ["ST-006", 1500000, 300000, 108000, 49500, 80000],
  ];
  for (const [employeeNo, basicCents, allowancesCents, nssfCents, shifCents, payeCents] of demo ? salaries : []) {
    const member = await db.staffProfile.findUnique({ where: { employeeNo } });
    if (!member) continue;
    await db.salaryStructure.upsert({
      where: { staffId: member.id },
      update: {},
      create: { staffId: member.id, basicCents, allowancesCents, nssfCents, shifCents, payeCents },
    });
  }

  // Leave types with Kenyan statutory-style annual quotas — adjust in-app.
  const leaveTypes: [string, number][] = [
    ["Annual", 21],
    ["Sick", 14],
    ["Maternity", 90],
    ["Paternity", 14],
    ["Compassionate", 5],
  ];
  for (const [name, daysPerYear] of leaveTypes) {
    await db.leaveType.upsert({
      where: { name },
      update: {},
      create: { name, daysPerYear },
    });
  }

  console.log(
    demo
      ? "bootstrap: seeded demo users and sample data into empty database"
      : "bootstrap: created superadmin and school structure (no demo data)",
  );
  return true;
}
