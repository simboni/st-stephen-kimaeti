import type { Metadata } from "next";
import { db } from "@/lib/db";
import { nextAdmissionNo } from "@/lib/school";
import { requirePermission } from "@/lib/rbac";
import { AdmitStudentForm } from "@/components/student-forms";

export const metadata: Metadata = { title: "Admit pupil" };

export default async function NewStudentPage() {
  await requirePermission("students", "create");

  const [classes, suggested] = await Promise.all([
    db.schoolClass.findMany({
      where: { archived: false },
      include: { streams: { where: { archived: false }, orderBy: { name: "asc" } } },
      orderBy: { level: "asc" },
    }),
    nextAdmissionNo(),
  ]);
  const streams = classes.flatMap((c) =>
    c.streams.map((st) => ({ id: st.id, label: `${c.name} ${st.name}` })),
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink-900">Admit a pupil</h1>
        <p className="mt-1 text-sm">
          Personal details, class placement and at least one parent/guardian contact.
        </p>
      </div>
      <AdmitStudentForm streams={streams} suggestedAdmissionNo={suggested} />
    </div>
  );
}
