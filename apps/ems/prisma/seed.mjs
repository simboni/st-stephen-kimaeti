/* Demo seed — keeps every deploy instantly testable.
   Idempotent: safe to run repeatedly (upserts everything). */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "ststephen2026";

const users = [
  { username: "superadmin", name: "System Owner", role: "SUPER_ADMIN", email: "superadmin@ststephenkimaeti.ac.ke" },
  { username: "admin", name: "School Administrator", role: "ADMIN", email: "admin@ststephenkimaeti.ac.ke" },
  { username: "accountant", name: "School Accountant", role: "ACCOUNTANT", email: "accounts@ststephenkimaeti.ac.ke" },
  { username: "teacher", name: "Demo Teacher", role: "TEACHER", email: "teacher@ststephenkimaeti.ac.ke" },
  { username: "reception", name: "Front Office", role: "RECEPTIONIST", email: "frontoffice@ststephenkimaeti.ac.ke" },
  { username: "librarian", name: "School Librarian", role: "LIBRARIAN", email: "library@ststephenkimaeti.ac.ke" },
  { username: "parent", name: "Demo Parent", role: "PARENT", email: "parent@example.com" },
  { username: "student", name: "Demo Student", role: "STUDENT", email: "student@example.com" },
];

// module → [view, create, edit, archive] per role.
// SUPER_ADMIN is not listed — it bypasses permission checks.
const matrix = {
  dashboard: {
    ADMIN: [1, 0, 0, 0], ACCOUNTANT: [1, 0, 0, 0], TEACHER: [1, 0, 0, 0],
    RECEPTIONIST: [1, 0, 0, 0], LIBRARIAN: [1, 0, 0, 0], PARENT: [1, 0, 0, 0], STUDENT: [1, 0, 0, 0],
  },
  academics: {
    ADMIN: [1, 1, 1, 1], TEACHER: [1, 0, 0, 0],
  },
  students: {
    ADMIN: [1, 1, 1, 1], TEACHER: [1, 0, 0, 0], RECEPTIONIST: [1, 1, 0, 0], ACCOUNTANT: [1, 0, 0, 0],
  },
  attendance: {
    ADMIN: [1, 1, 1, 1], TEACHER: [1, 1, 1, 0], RECEPTIONIST: [1, 0, 0, 0],
  },
  // exams: edit = publishing to the portal, so it stays with Admin.
  exams: {
    ADMIN: [1, 1, 1, 1], TEACHER: [1, 1, 0, 0],
  },
  fees: {
    ADMIN: [1, 1, 1, 1], ACCOUNTANT: [1, 1, 1, 1], RECEPTIONIST: [1, 0, 0, 0],
  },
  finance: {
    ADMIN: [1, 1, 1, 1], ACCOUNTANT: [1, 1, 1, 1],
  },
  transport: {
    ADMIN: [1, 1, 1, 1], ACCOUNTANT: [1, 0, 0, 0], RECEPTIONIST: [1, 0, 0, 0],
  },
  boarding: {
    ADMIN: [1, 1, 1, 1], RECEPTIONIST: [1, 0, 0, 0], TEACHER: [1, 0, 0, 0],
  },
  staff: {
    ADMIN: [1, 1, 1, 1], ACCOUNTANT: [1, 0, 0, 0],
  },
  payroll: {
    ADMIN: [1, 1, 1, 1], ACCOUNTANT: [1, 1, 1, 1],
  },
  communication: {
    ADMIN: [1, 1, 1, 1], RECEPTIONIST: [1, 1, 0, 0], TEACHER: [1, 0, 0, 0],
  },
  frontoffice: {
    ADMIN: [1, 1, 1, 1], RECEPTIONIST: [1, 1, 1, 1],
  },
  reports: {
    ADMIN: [1, 0, 0, 0], ACCOUNTANT: [1, 0, 0, 0],
  },
  homework: {
    ADMIN: [1, 1, 1, 1], TEACHER: [1, 1, 1, 1],
  },
  users: {
    ADMIN: [1, 1, 1, 1],
  },
  settings: {
    ADMIN: [1, 0, 1, 0],
  },
  audit: {
    ADMIN: [1, 0, 0, 0],
  },
};

async function main() {
  // This script plants demo accounts that all share a password published in
  // the README, alongside invented pupils, fees and payments. It must never
  // reach a real school's database. Production installs are set up instead by
  // the app's own first-run bootstrap (src/lib/bootstrap.ts), which creates a
  // single superadmin from ADMIN_PASSWORD.
  const demoAllowed =
    process.env.SEED_DEMO != null
      ? process.env.SEED_DEMO !== "false" && process.env.SEED_DEMO !== "0"
      : process.env.NODE_ENV !== "production";
  if (!demoAllowed) {
    console.log(
      "seed: skipped — demo data is disabled under NODE_ENV=production. " +
        "Set SEED_DEMO=true to force it onto a throwaway database.",
    );
    return;
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: { ...u, passwordHash },
    });
  }

  for (const [module, roles] of Object.entries(matrix)) {
    for (const [role, [canView, canCreate, canEdit, canArchive]] of Object.entries(roles)) {
      await prisma.rolePermission.upsert({
        where: { role_module: { role, module } },
        update: {},
        create: {
          role,
          module,
          canView: !!canView,
          canCreate: !!canCreate,
          canEdit: !!canEdit,
          canArchive: !!canArchive,
        },
      });
    }
  }

  // School profile singleton
  await prisma.schoolSetting.upsert({
    where: { id: "school" },
    update: {},
    create: {
      id: "school",
      name: "St Stephen Mixed Day and Boarding Primary School, Junior School & Early Years of Education Centre",
      shortName: "St Stephen's Kimaeti",
      motto: "Pray and Work",
      email: "ststephenprimarykimaeti@gmail.com",
      phone: "0714 118 611 / 0724 570 171",
      address: "P.O. Box 93 – 50200, Bungoma",
    },
  });

  // Demo academic session with three terms — SAMPLE dates, edit in Settings.
  const existingSession = await prisma.academicSession.findUnique({
    where: { name: "2025-2026" },
  });
  if (!existingSession) {
    await prisma.academicSession.create({
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
  const classList = [
    ["Playgroup", 0, "INFANT"], ["PP1", 1, "INFANT"], ["PP2", 2, "INFANT"],
    ["Grade 1", 3, "PRIMARY"], ["Grade 2", 4, "PRIMARY"], ["Grade 3", 5, "PRIMARY"],
    ["Grade 4", 6, "PRIMARY"], ["Grade 5", 7, "PRIMARY"], ["Grade 6", 8, "PRIMARY"],
    ["Grade 7", 9, "JUNIOR"], ["Grade 8", 10, "JUNIOR"], ["Grade 9", 11, "JUNIOR"],
  ];
  for (const [name, level, stage] of classList) {
    const cls = await prisma.schoolClass.upsert({
      where: { name },
      update: {},
      create: { name, level, stage },
    });
    await prisma.stream.upsert({
      where: { classId_name: { classId: cls.id, name: "A" } },
      update: {},
      create: { classId: cls.id, name: "A" },
    });
  }


  // CBC learning areas with the stages that take them. SAMPLE — adjust in-app.
  const subjectList = [
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
  const allClasses = await prisma.schoolClass.findMany();
  for (const [name, code, stages] of subjectList) {
    const subject = await prisma.subject.upsert({
      where: { name },
      update: {},
      create: { name, code, type: "CORE" },
    });
    for (const cls of allClasses.filter((c) => stages.includes(c.stage))) {
      await prisma.classSubject.upsert({
        where: { classId_subjectId: { classId: cls.id, subjectId: subject.id } },
        update: {},
        create: { classId: cls.id, subjectId: subject.id },
      });
    }
  }


  // Demo pupils — SAMPLE data spread across classes, each with a guardian.
  const demoStudents = [
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
  const activeSession = await prisma.academicSession.findFirst({ where: { active: true } });
  if (activeSession) {
    let serial = 1;
    for (const [firstName, lastName, gender, className, gName, gRel, gPhone] of demoStudents) {
      const admissionNo = `HC-25${String(serial++).padStart(4, "0")}`;
      const exists = await prisma.student.findUnique({ where: { admissionNo } });
      if (exists) continue;
      const stream = await prisma.stream.findFirst({
        where: { name: "A", class: { name: className } },
      });
      if (!stream) continue;
      await prisma.student.create({
        data: {
          admissionNo,
          firstName,
          lastName,
          gender,
          boarding: serial % 4 === 0 ? "BOARDER" : "DAY",
          guardians: { create: [{ name: gName, relation: gRel, phone: gPhone }] },
          enrollments: { create: { streamId: stream.id, sessionId: activeSession.id } },
        },
      });
    }
  }


  // Link the demo parent to two pupils and the demo student account to one.
  const demoParent = await prisma.user.findUnique({ where: { username: "parent" } });
  const demoStudentUser = await prisma.user.findUnique({ where: { username: "student" } });
  const firstPupils = await prisma.student.findMany({
    where: { admissionNo: { in: ["HC-250001", "HC-250002"] } },
    orderBy: { admissionNo: "asc" },
  });
  if (demoParent) {
    for (const pupil of firstPupils) {
      await prisma.parentLink.upsert({
        where: { userId_studentId: { userId: demoParent.id, studentId: pupil.id } },
        update: {},
        create: { userId: demoParent.id, studentId: pupil.id },
      });
    }
  }
  if (demoStudentUser && firstPupils[0] && !firstPupils[0].userId) {
    await prisma.student.update({
      where: { id: firstPupils[0].id },
      data: { userId: demoStudentUser.id },
    });
  }


  // Fee structure — SAMPLE amounts per stage per term; adjust in Fees Setup.
  // Fee types are the vote heads payments are collected against.
  const feeTypeNames = ["Tuition", "Examinations", "Lunch", "Boarding", "Activity"];
  const feeTypesByName = {};
  for (const name of feeTypeNames) {
    feeTypesByName[name] = await prisma.feeType.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  const feeSession = await prisma.academicSession.findFirst({
    where: { active: true },
    include: { terms: true },
  });
  if (feeSession && (await prisma.feeItem.count({ where: { sessionId: feeSession.id } })) === 0) {
    const stageTuition = { INFANT: 800000, PRIMARY: 1200000, JUNIOR: 1500000 }; // cents/term
    const classesForFees = await prisma.schoolClass.findMany();
    for (const term of feeSession.terms) {
      for (const cls of classesForFees) {
        await prisma.feeItem.create({
          data: {
            feeTypeId: feeTypesByName["Tuition"].id,
            sessionId: feeSession.id,
            termId: term.id,
            classId: cls.id,
            amountCents: stageTuition[cls.stage],
          },
        });
      }
      await prisma.feeItem.create({
        data: {
          feeTypeId: feeTypesByName["Lunch"].id,
          sessionId: feeSession.id,
          termId: term.id,
          boarding: "DAY",
          amountCents: 350000,
        },
      });
      await prisma.feeItem.create({
        data: {
          feeTypeId: feeTypesByName["Boarding"].id,
          sessionId: feeSession.id,
          termId: term.id,
          boarding: "BOARDER",
          amountCents: 1800000,
        },
      });
    }
    await prisma.feeItem.create({
      data: {
        feeTypeId: feeTypesByName["Activity"].id,
        sessionId: feeSession.id,
        amountCents: 200000,
      },
    });
    // sample payments for the two portal-demo pupils
    const paidPupils = await prisma.student.findMany({
      where: { admissionNo: { in: ["HC-250001", "HC-250002"] } },
    });
    let receiptSerial = (await prisma.feePayment.count()) + 1;
    for (const pupil of paidPupils) {
      await prisma.feePayment.create({
        data: {
          receiptNo: `RCT-25${String(receiptSerial++).padStart(4, "0")}`,
          studentId: pupil.id,
          sessionId: feeSession.id,
          amountCents: 2000000,
          method: "CASH",
          receivedBy: "accountant",
          allocations: {
            create: [{ feeTypeId: feeTypesByName["Tuition"].id, amountCents: 2000000 }],
          },
        },
      });
    }
  }

  // Finance heads — SAMPLE ledger categories; add more in Income & Expenses.
  const financeHeads = [
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
    await prisma.financeHead.upsert({
      where: { name_kind: { name, kind } },
      update: {},
      create: { name, kind },
    });
  }

  // Staff directory — SAMPLE profiles; demo logins linked where they exist.
  const staffList = [
    // [employeeNo, first, last, gender, designation, department, qualification, linkUsername]
    ["ST-001", "Margaret", "Wanjiru", "FEMALE", "Head Teacher", "Administration", "B.Ed", null],
    ["ST-002", "Joseph", "Otieno", "MALE", "Deputy Head Teacher", "Administration", "B.Ed", null],
    ["ST-003", "Demo", "Teacher", "MALE", "Teacher", "Academics", "Dip.Ed", "teacher"],
    ["ST-004", "Anne", "Chebet", "FEMALE", "Accountant", "Finance", "CPA II", "accountant"],
    ["ST-005", "Janet", "Akinyi", "FEMALE", "Secretary", "Administration", null, "reception"],
    ["ST-006", "Peter", "Mutua", "MALE", "Cook", "Support Staff", null, null],
  ];
  for (const [employeeNo, firstName, lastName, gender, designation, department, qualification, linkUsername] of staffList) {
    const exists = await prisma.staffProfile.findUnique({ where: { employeeNo } });
    if (exists) continue;
    let userId = null;
    if (linkUsername) {
      const linkUser = await prisma.user.findUnique({
        where: { username: linkUsername },
        include: { staffProfile: true },
      });
      if (linkUser && !linkUser.staffProfile) userId = linkUser.id;
    }
    await prisma.staffProfile.create({
      data: { employeeNo, firstName, lastName, gender, designation, department, qualification, userId },
    });
  }

  // SAMPLE salary structures (KES cents) — the accountant adjusts in Payroll.
  const salaries = [
    // [employeeNo, basic, allowances, nssf, shif, paye]
    ["ST-001", 4500000, 900000, 108000, 148500, 650000],
    ["ST-002", 3800000, 760000, 108000, 125400, 480000],
    ["ST-003", 3000000, 600000, 108000, 99000, 320000],
    ["ST-004", 3200000, 640000, 108000, 105600, 360000],
    ["ST-005", 2200000, 440000, 108000, 72600, 190000],
    ["ST-006", 1500000, 300000, 108000, 49500, 80000],
  ];
  for (const [employeeNo, basicCents, allowancesCents, nssfCents, shifCents, payeCents] of salaries) {
    const member = await prisma.staffProfile.findUnique({ where: { employeeNo } });
    if (!member) continue;
    await prisma.salaryStructure.upsert({
      where: { staffId: member.id },
      update: {},
      create: { staffId: member.id, basicCents, allowancesCents, nssfCents, shifCents, payeCents },
    });
  }

  // Leave types with Kenyan statutory-style annual quotas — adjust in-app.
  const leaveTypes = [
    ["Annual", 21],
    ["Sick", 14],
    ["Maternity", 90],
    ["Paternity", 14],
    ["Compassionate", 5],
  ];
  for (const [name, daysPerYear] of leaveTypes) {
    await prisma.leaveType.upsert({
      where: { name },
      update: {},
      create: { name, daysPerYear },
    });
  }

  console.log(
    `Seeded ${users.length} demo users (password: ${DEMO_PASSWORD}), the permission matrix, school settings, the 2025-2026 session, classes, CBC subjects, 15 demo pupils, finance heads, staff and leave types.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
