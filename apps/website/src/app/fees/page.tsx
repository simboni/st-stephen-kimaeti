import type { Metadata } from "next";
import { fees, money, payment, school } from "@/lib/site";
import { PageHero } from "@/components/page-hero";
import { ButtonLink, Section, SectionHeading } from "@/components/ui";
import { Reveal } from "@/components/reveal";
import { ArrowRightIcon, PhoneIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Fees",
  description: `${fees.year} fee structure for ${school.shortName} — termly fees by level, uniform costs, and how to pay by M-PESA or KCB.`,
};

const kes = (n: number) => n.toLocaleString("en-KE");

export default function FeesPage() {
  return (
    <>
      <PageHero
        eyebrow={`${fees.year} fee structure`}
        title="What a term costs, written down"
        intro="No school should make a parent guess. These are the school's own figures for the year, by level and by term."
        photo="dining-juniors"
      />

      {/* Termly fees */}
      <Section>
        <Reveal>
          <SectionHeading
            eyebrow="Termly fees"
            title={`${fees.year}, by level`}
            intro={fees.note}
          />
        </Reveal>

        <Reveal delay={100}>
          <div className="card mt-10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[34rem] text-sm">
                <thead className="bg-navy-900 text-white">
                  <tr>
                    <th className="px-5 py-3.5 text-left font-display text-xs font-bold uppercase tracking-wider">
                      Level
                    </th>
                    <th className="px-4 py-3.5 text-right font-display text-xs font-bold uppercase tracking-wider">
                      Term 1
                    </th>
                    <th className="px-4 py-3.5 text-right font-display text-xs font-bold uppercase tracking-wider">
                      Term 2
                    </th>
                    <th className="px-4 py-3.5 text-right font-display text-xs font-bold uppercase tracking-wider">
                      Term 3
                    </th>
                    <th className="px-5 py-3.5 text-right font-display text-xs font-bold uppercase tracking-wider">
                      Whole year
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-paper-300">
                  {fees.rows.map((r) => (
                    <tr key={r.level}>
                      <td className="px-5 py-4 font-semibold text-ink-900">{r.level}</td>
                      <td className="px-4 py-4 text-right tabular-nums">{kes(r.t1)}</td>
                      <td className="px-4 py-4 text-right tabular-nums">{kes(r.t2)}</td>
                      <td className="px-4 py-4 text-right tabular-nums">{kes(r.t3)}</td>
                      <td className="px-5 py-4 text-right font-display text-base font-extrabold tabular-nums text-ink-900">
                        {kes(r.total)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-paper-100">
                    <td className="px-5 py-4 font-semibold text-ink-400">{fees.missing}</td>
                    <td colSpan={4} className="px-5 py-4 text-right text-ink-400">
                      Ask the office for the current sheet
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="border-t border-paper-300 px-5 py-4 text-xs leading-relaxed text-ink-400">
              All amounts in Kenya shillings. The termly figure covers tuition,
              accommodation where it applies, stationery, meals, medical, electricity,
              bus maintenance, RMI, games and music, boarding and welfare, assessment
              and development. Boarding places and school-bus routes are quoted by the
              office.
            </p>
          </div>
        </Reveal>

        <Reveal delay={150}>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fees.oneOff.map((o) => (
              <div key={o.item} className="card flex items-baseline justify-between gap-4 p-5">
                <span className="font-semibold text-ink-900">{o.item}</span>
                <span className="font-display text-lg font-extrabold text-brand-600">
                  {money(o.amount)}
                </span>
              </div>
            ))}
          </div>
        </Reveal>
      </Section>

      {/* Uniform */}
      <Section tinted>
        <Reveal>
          <SectionHeading
            eyebrow="One-off"
            title="Uniform and kit"
            intro="Bought once, at the school or from the supplier the office names. Prices are per item."
          />
        </Reveal>
        <Reveal delay={100}>
          <div className="card mt-10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[28rem] text-sm">
                <thead className="bg-paper-200">
                  <tr>
                    <th className="px-5 py-3.5 text-left font-display text-xs font-bold uppercase tracking-wider text-ink-700">
                      Item
                    </th>
                    <th className="px-4 py-3.5 text-right font-display text-xs font-bold uppercase tracking-wider text-ink-700">
                      Early Years
                    </th>
                    <th className="px-4 py-3.5 text-right font-display text-xs font-bold uppercase tracking-wider text-ink-700">
                      Primary
                    </th>
                    <th className="px-5 py-3.5 text-right font-display text-xs font-bold uppercase tracking-wider text-ink-700">
                      Junior
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-paper-300">
                  {fees.uniform.map((u) => (
                    <tr key={u.item}>
                      <td className="px-5 py-3.5 font-semibold text-ink-900">{u.item}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums">
                        {u.eye === null ? "—" : kes(u.eye)}
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums">
                        {u.primary === null ? "—" : kes(u.primary)}
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums">
                        {u.junior === null ? "—" : kes(u.junior)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-paper-100 font-display font-extrabold text-ink-900">
                    <td className="px-5 py-3.5">Full set</td>
                    {(["eye", "primary", "junior"] as const).map((col) => (
                      <td key={col} className="px-4 py-3.5 text-right tabular-nums">
                        {kes(
                          fees.uniform.reduce((sum, u) => sum + (u[col] ?? 0), 0),
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* How to pay */}
      <Section>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <SectionHeading eyebrow="How to pay" title="M-PESA or the bank" />
            <div className="mt-8 space-y-5">
              <div className="card p-6">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-maroon-500">
                  M-PESA · {payment.mpesa.label}
                </p>
                <dl className="mt-4 space-y-2.5 text-sm">
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-ink-400">Paybill number</dt>
                    <dd className="font-display text-lg font-extrabold text-ink-900">
                      {payment.mpesa.paybill}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-ink-400">Account number</dt>
                    <dd className="font-display font-extrabold text-ink-900">
                      {payment.accountFormat} + child&rsquo;s name
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-ink-400">Example</dt>
                    <dd>
                      <code className="rounded bg-paper-200 px-2 py-1 text-ink-900">
                        {payment.accountExample}
                      </code>
                    </dd>
                  </div>
                </dl>
                <p className="mt-4 text-sm leading-relaxed text-ink-400">
                  No spaces anywhere in the account number. If the name is long, the
                  admission number works just as well.
                </p>
              </div>

              <div className="card p-6">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-maroon-500">
                  Bank
                </p>
                <dl className="mt-4 space-y-2.5 text-sm">
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-ink-400">Bank</dt>
                    <dd className="font-display font-extrabold text-ink-900">
                      {payment.bank.name}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-ink-400">Account number</dt>
                    <dd className="font-display text-lg font-extrabold text-ink-900">
                      {payment.bank.account}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-ink-400">Account name</dt>
                    <dd className="font-display font-extrabold text-ink-900">
                      {payment.bank.holder}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="rounded-3xl bg-navy-900 p-8 text-white/80 md:p-10">
              <h2 className="font-display text-2xl font-extrabold text-white">
                Always keep the receipt
              </h2>
              <p className="mt-4 leading-relaxed">
                Bring the M-PESA message or the bank slip to the office, or send it to the
                school on WhatsApp. The office posts it against your child&rsquo;s account
                the same day, and you get a statement showing the balance.
              </p>
              <p className="mt-4 leading-relaxed">
                Parents will soon be able to see that statement themselves, any time,
                through the parents&rsquo; portal.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/portal/" variant="onDark">
                  Parents&rsquo; portal <ArrowRightIcon className="h-4 w-4" />
                </ButtonLink>
                <a
                  href={`tel:${school.phoneHref}`}
                  className="glass inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white/20"
                >
                  <PhoneIcon className="h-4 w-4" />
                  {school.phone}
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
