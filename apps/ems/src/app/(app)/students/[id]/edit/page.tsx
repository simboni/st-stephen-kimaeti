import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { getActiveSession } from "@/lib/school";
import { EditStudentForm } from "@/components/student-forms";

export const metadata: Metadata = { title: "Edit pupil" };

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("students", "edit");
  const { id } = await params;

  const [student, session, classes] = await Promise.all([
    db.student.findUnique({ where: { id }, include: { enrollments: true } }),
    getActiveSession(),
    db.schoolClass.findMany({
      where: { archived: false },
      include: { streams: { where: { archived: false }, orderBy: { name: "asc" } } },
      orderBy: { level: "asc" },
    }),
  ]);
  if (!student) notFound();

  const streams = classes.flatMap((c) =>
    c.streams.map((st) => ({ id: st.id, label: `${c.name} ${st.name}` })),
  );
  const currentStreamId = student.enrollments.find((e) => e.sessionId === session?.id)?.streamId;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink-900">
          Edit — {student.firstName} {student.lastName}
        </h1>
        <p className="mt-1 text-sm">
          <span className="font-mono text-xs">{student.admissionNo}</span> · changing the class
          moves the pupil within the active session.
        </p>
      </div>
      <EditStudentForm
        student={{
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          gender: student.gender,
          boarding: student.boarding,
          upiNumber: student.upiNumber ?? "",
          dateOfBirth: student.dateOfBirth?.toISOString().slice(0, 10) ?? "",
          religion: student.religion ?? "",
          address: student.address ?? "",
          medicalNotes: student.medicalNotes ?? "",
        }}
        streams={streams}
        currentStreamId={currentStreamId}
      />
    </div>
  );
}
