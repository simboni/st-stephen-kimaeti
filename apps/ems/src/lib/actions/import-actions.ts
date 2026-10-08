"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/rbac";
import { getActiveSession, nextAdmissionNo } from "@/lib/school";
import { normalizeClassName, parseStudentCsv } from "@/lib/import";

export type ImportRowView = {
  line: number;
  admissionNo: string;
  name: string;
  gender: string;
  classLabel: string;
  guardian: string;
  status: "ready" | "skip";
  note: string;
};

export type ImportState = {
  error?: string;
  csvText?: string;
  preview?: { rows: ImportRowView[]; readyCount: number };
};

const MAX_ROWS = 1000;

/** Validates the CSV against the database; commit=1 then imports the ready rows. */
export async function importStudents(
  _prev: ImportState,
  formData: FormData,
): Promise<ImportState> {
  const actor = await requirePermission("students", "create");

  const csvText = String(formData.get("csv") ?? "").trim();
  const commit = String(formData.get("commit") ?? "") === "1";
  if (!csvText) return { error: "Paste your CSV or choose a file first." };

  const session = await getActiveSession();
  if (!session) return { error: "No active session — set one in Settings first.", csvText };

  const { rows, headerIssues } = parseStudentCsv(csvText);
  if (headerIssues.length > 0) return { error: headerIssues.join(" "), csvText };
  if (rows.length === 0) return { error: "No pupil rows found under the header.", csvText };
  if (rows.length > MAX_ROWS)
    return { error: `That file has ${rows.length} rows — import at most ${MAX_ROWS} at a time.`, csvText };

  // Resolve the school's classes and streams once.
  const classes = await db.schoolClass.findMany({
    where: { archived: false },
    include: { streams: { where: { archived: false }, orderBy: { name: "asc" } } },
  });
  const classByKey = new Map(classes.map((c) => [normalizeClassName(c.name), c]));

  const seenAdm = new Set<string>();
  const seenUpi = new Set<string>();
  const seenName = new Set<string>();

  const views: ImportRowView[] = [];
  const ready: {
    row: (typeof rows)[number];
    streamId: string;
    classLabel: string;
  }[] = [];

  for (const row of rows) {
    const view: ImportRowView = {
      line: row.line,
      admissionNo: row.admissionNo ?? "(auto)",
      name: `${row.lastName}, ${row.firstName}`.trim(),
      gender: row.gender ?? "?",
      classLabel: row.className ?? "?",
      guardian: row.guardianName ? `${row.guardianName}${row.guardianPhone ? ` · ${row.guardianPhone}` : ""}` : "—",
      status: "skip",
      note: "",
    };
    views.push(view);

    const skip = (note: string) => {
      view.note = note;
    };

    if (!row.firstName || !row.lastName) {
      skip("No name");
      continue;
    }
    if (!row.gender) {
      skip("Gender missing or unrecognised");
      continue;
    }
    if (!row.className) {
      skip("No class given");
      continue;
    }
    const cls = classByKey.get(normalizeClassName(row.className));
    if (!cls) {
      skip(`Class “${row.className}” not found — create it under Academics first`);
      continue;
    }
    const stream =
      cls.streams.find((s) => s.name.toLowerCase() === row.streamName.toLowerCase()) ??
      cls.streams[0];
    if (!stream) {
      skip(`${cls.name} has no streams`);
      continue;
    }
    view.classLabel = `${cls.name} ${stream.name}`;

    if (row.admissionNo) {
      const adm = row.admissionNo.toUpperCase();
      if (seenAdm.has(adm)) {
        skip("Duplicate admission no. in this file");
        continue;
      }
      seenAdm.add(adm);
      if (await db.student.findUnique({ where: { admissionNo: adm } })) {
        skip("Already admitted (admission no. exists)");
        continue;
      }
    }
    if (row.upiNumber) {
      if (seenUpi.has(row.upiNumber)) {
        skip("Duplicate UPI in this file");
        continue;
      }
      seenUpi.add(row.upiNumber);
      if (await db.student.findFirst({ where: { upiNumber: row.upiNumber } })) {
        skip("Already admitted (UPI exists)");
        continue;
      }
    }

    /* Same name, same class, already on the roll.
     *
     * The admission-number and UPI checks above only help when the file
     * carries those columns. A school typing its register in for the first
     * time has neither, so an operator who re-ran the same file — which is
     * exactly what someone does when they are not sure the first run worked —
     * got every pupil a second time, with a second admission number. The roll
     * doubles silently and nothing in the preview warns them.
     *
     * Matching on name within one class is a heuristic, and genuine namesakes
     * in the same class do exist. Getting it wrong this way costs the office
     * one pupil admitted by hand from the Students page, and the message says
     * which existing record it matched. Getting it wrong the other way costs
     * them a corrupted roll they may not notice for weeks. */
    const nameKey = `${row.lastName}|${row.firstName}|${cls.id}`.toLowerCase();
    if (seenName.has(nameKey)) {
      skip("Appears twice in this file (same name and class)");
      continue;
    }
    seenName.add(nameKey);
    const twin = await db.student.findFirst({
      where: {
        archived: false,
        firstName: { equals: row.firstName, mode: "insensitive" },
        lastName: { equals: row.lastName, mode: "insensitive" },
        enrollments: { some: { stream: { classId: cls.id } } },
      },
      select: { admissionNo: true },
    });
    if (twin) {
      skip(`Already on the roll as ${twin.admissionNo} — same name, same class`);
      continue;
    }

    view.status = "ready";
    view.note = "Will be admitted";
    ready.push({ row, streamId: stream.id, classLabel: view.classLabel });
  }

  if (!commit) {
    return { csvText, preview: { rows: views, readyCount: ready.length } };
  }

  if (ready.length === 0)
    return { error: "Nothing to import — every row was skipped.", csvText, preview: { rows: views, readyCount: 0 } };

  // Auto admission numbers carry the school's own prefix — see lib/school.
  const nextAuto = nextAdmissionNo;

  let created = 0;
  for (const { row, streamId } of ready) {
    const admissionNo = row.admissionNo ? row.admissionNo.toUpperCase() : await nextAuto();
    await db.student.create({
      data: {
        admissionNo,
        upiNumber: row.upiNumber,
        firstName: row.firstName,
        lastName: row.lastName,
        gender: row.gender!,
        boarding: row.boarding,
        ...(row.guardianName
          ? { guardians: { create: [{ name: row.guardianName, relation: "Guardian", phone: row.guardianPhone }] } }
          : {}),
        enrollments: { create: { streamId, sessionId: session.id } },
      },
    });
    created += 1;
  }

  await audit(
    actor,
    "students",
    "students_imported",
    `${created} pupil(s) imported from CSV into ${session.name} (${views.length - created} skipped)`,
  );
  revalidatePath("/students");
  redirect(`/students?imported=${created}`);
}
