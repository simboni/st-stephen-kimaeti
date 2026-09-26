import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { getSchoolSettings, logoSrc } from "@/lib/school";
import { studentBalance } from "@/lib/fees";
import { formatMoney } from "@/lib/money";
import { PrintButton } from "@/components/fees-forms";

export const metadata: Metadata = { title: "Receipt" };

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  await requirePermission("fees", "view");
  const { paymentId } = await params;

  const [payment, school] = await Promise.all([
    db.feePayment.findUnique({
      where: { id: paymentId },
      include: {
        student: {
          include: { enrollments: { include: { stream: { include: { class: true } } } } },
        },
        session: true,
        allocations: { include: { feeType: true } },
      },
    }),
    getSchoolSettings(),
  ]);
  if (!payment) notFound();

  const balance = await studentBalance(payment.studentId, payment.sessionId);
  const enrollment = payment.student.enrollments.find((e) => e.sessionId === payment.sessionId);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <Link href={`/fees/${payment.studentId}`} className="btn btn-secondary">
          ← Back to account
        </Link>
        <PrintButton />
      </div>

      <div className="card p-8 print:border-0 print:shadow-none">
        {/* School header */}
        <div className="flex items-center gap-4 border-b border-paper-300 pb-5">
          <Image
            src={logoSrc(school)}
            alt=""
            width={64}
            height={64}
            unoptimized
            className="h-16 w-16 rounded-full bg-white object-contain"
          />
          <div>
            <h1 className="font-display text-lg font-extrabold text-ink-900">{school.name}</h1>
            <p className="text-xs text-ink-500">
              {school.address} · {school.phone} · {school.email}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-start justify-between">
          <div>
            <h2 className="font-display text-base font-extrabold text-ink-900">
              OFFICIAL RECEIPT
            </h2>
            <p className="font-mono text-sm font-bold text-brand-600">{payment.receiptNo}</p>
            {payment.voided && (
              <p className="mt-1 inline-block rounded bg-danger-500 px-2 py-0.5 text-xs font-bold uppercase text-white">
                VOIDED{payment.voidReason ? ` — ${payment.voidReason}` : ""}
              </p>
            )}
          </div>
          <div className="text-right text-sm text-ink-500">
            <p>
              {payment.receivedAt.toLocaleString("en-KE", {
                dateStyle: "long",
                timeStyle: "short",
                timeZone: "Africa/Nairobi",
              })}
            </p>
            <p>Session {payment.session.name}</p>
          </div>
        </div>

        <dl className="mt-6 space-y-2.5 text-sm">
          {[
            ["Received from", `${payment.student.firstName} ${payment.student.lastName} (${payment.student.admissionNo})`],
            ["Class", enrollment ? `${enrollment.stream.class.name} ${enrollment.stream.name}` : "—"],
            ["Payment method", payment.method + (payment.reference ? ` · ${payment.reference}` : "")],
            ["Received by", payment.receivedBy],
            ...(payment.note ? [["Note", payment.note]] : []),
          ].map(([label, value]) => (
            <div key={label as string} className="flex justify-between gap-6">
              <dt className="font-bold text-ink-700">{label}</dt>
              <dd className="text-right text-ink-500">{value}</dd>
            </div>
          ))}
        </dl>

        {payment.allocations.length > 0 && (
          <table className="table-admin mt-6">
            <thead>
              <tr>
                <th>Vote head</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {[...payment.allocations]
                .sort((a, b) => a.feeType.name.localeCompare(b.feeType.name))
                .map((a) => (
                  <tr key={a.id}>
                    <td className="font-semibold text-ink-900">{a.feeType.name}</td>
                    <td className="text-right">{formatMoney(a.amountCents)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}

        <div className="mt-6 rounded-xl bg-paper-100 p-5 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-400">Amount received</p>
          <p className="font-display text-3xl font-extrabold text-ink-900">
            {formatMoney(payment.amountCents)}
          </p>
        </div>

        <div className="mt-5 flex justify-between text-sm">
          <span className="text-ink-500">Balance after this receipt:</span>
          <span className={`font-bold ${balance.balanceCents > 0 ? "text-danger-500" : "text-leaf-600"}`}>
            {formatMoney(balance.balanceCents)}
          </span>
        </div>

        <p className="mt-8 border-t border-paper-300 pt-4 text-center text-xs text-ink-400">
          {school.motto} · This receipt is system-generated and valid without a signature.
        </p>
      </div>
    </div>
  );
}
