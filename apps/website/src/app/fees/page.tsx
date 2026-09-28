import type { Metadata } from "next";
import { fees, money, payment, school, primaryPhone } from "@/lib/site";
import { PageHero } from "@/components/page-hero";
import { FeeCalculator } from "@/components/fee-calculator";
import { ButtonLink, Reveal, Section, SectionHead } from "@/components/ui";
import { ArrowRightIcon, PhoneIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Fees",
  description: `The ${fees.year} fee structure for ${school.shortName} — termly fees by level, uniform costs, a calculator that tells you what a term actually costs, and how to pay by M-PESA or KCB.`,
};

const kes = (n: number) => n.toLocaleString("en-KE");

export default function FeesPage() {
  return (
    <>
      <PageHero
        index="04"
        eyebrow="Fees"
        title="What a term costs, written down"
        lede="No school should make a parent guess. These are the school’s own figures for the year, by level and by term, with a calculator that adds up what you would actually pay."
        photo="dining-juniors"
      />

      {/* Calculator */}
      <Section size="loose">
        <Reveal>
          <SectionHead
            index="01"
            eyebrow="Work it out"
            title="What would my child’s term cost?"
            lede="Pick the class and the term. Everything is computed in your browser from the published sheet — nothing is sent anywhere, and it works offline."
          />
        </Reveal>
        <Reveal delay={80}>
          <div className="mt-12">
            <FeeCalculator />
          </div>
        </Reveal>
      </Section>

      {/* The published table */}
      <Section tone="tint" size="loose">
        <Reveal>
          <SectionHead
            index="02"
            eyebrow={`${fees.year} termly fees`}
            title="The whole structure"
            lede={fees.note}
          />
        </Reveal>

        <Reveal delay={80}>
          <div className="mt-12 overflow-x-auto" tabIndex={0} role="group" aria-label="Table, scrolls sideways">
            <table className="w-full min-w-[36rem] border-collapse text-sm">
              <caption className="sr-only">
                Termly fees by level for {fees.year}, in Kenya shillings
              </caption>
              <thead>
                <tr className="border-y border-line-strong">
                  <th scope="col" className="py-4 pr-4 text-left eyebrow eyebrow-plain">
                    Level
                  </th>
                  <th scope="col" className="px-3 py-4 text-right eyebrow eyebrow-plain">
                    Term 1
                  </th>
                  <th scope="col" className="px-3 py-4 text-right eyebrow eyebrow-plain">
                    Term 2
                  </th>
                  <th scope="col" className="px-3 py-4 text-right eyebrow eyebrow-plain">
                    Term 3
                  </th>
                  <th scope="col" className="py-4 pl-3 text-right eyebrow eyebrow-plain">
                    Whole year
                  </th>
                </tr>
              </thead>
              <tbody>
                {fees.rows.map((r) => (
                  <tr key={r.level} className="border-b border-line">
                    <th scope="row" className="py-5 pr-4 text-left font-display text-lg text-text">
                      {r.level}
                    </th>
                    <td className="px-3 py-5 text-right tabular-nums">{kes(r.t1)}</td>
                    <td className="px-3 py-5 text-right tabular-nums">{kes(r.t2)}</td>
                    <td className="px-3 py-5 text-right tabular-nums">{kes(r.t3)}</td>
                    <td className="numeral py-5 pl-3 text-right text-2xl">{kes(r.total)}</td>
                  </tr>
                ))}
                <tr className="border-b border-line text-text-3">
                  <th scope="row" className="py-5 pr-4 text-left font-normal">
                    {fees.missing}
                  </th>
                  <td colSpan={4} className="py-5 text-right">
                    Not yet published — ask the office for the current sheet
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-text-3">
            All amounts in Kenya shillings. The termly figure covers tuition,
            accommodation where it applies, stationery, meals, medical, electricity, bus
            maintenance, RMI, games and music, boarding and welfare, assessment and
            development. Boarding places and school-bus routes are quoted by the office.
            One-off on admission:{" "}
            {fees.oneOff.map((o) => `${o.item.toLowerCase()} ${money(o.amount)}`).join(", ")}.
          </p>
        </Reveal>
      </Section>

      {/* Uniform */}
      <Section size="loose">
        <Reveal>
          <SectionHead
            index="03"
            eyebrow="One-off"
            title="Uniform and kit"
            lede="Bought once, at the school or from the supplier the office names. Prices are per item."
          />
        </Reveal>
        <Reveal delay={80}>
          <div className="mt-12 overflow-x-auto" tabIndex={0} role="group" aria-label="Table, scrolls sideways">
            <table className="w-full min-w-[30rem] border-collapse text-sm">
              <caption className="sr-only">Uniform prices by section, in Kenya shillings</caption>
              <thead>
                <tr className="border-y border-line-strong">
                  <th scope="col" className="py-4 pr-4 text-left eyebrow eyebrow-plain">
                    Item
                  </th>
                  <th scope="col" className="px-3 py-4 text-right eyebrow eyebrow-plain">
                    Early Years
                  </th>
                  <th scope="col" className="px-3 py-4 text-right eyebrow eyebrow-plain">
                    Primary
                  </th>
                  <th scope="col" className="py-4 pl-3 text-right eyebrow eyebrow-plain">
                    Junior
                  </th>
                </tr>
              </thead>
              <tbody>
                {fees.uniform.map((u) => (
                  <tr key={u.item} className="border-b border-line">
                    <th scope="row" className="py-4 pr-4 text-left font-semibold text-text">
                      {u.item}
                    </th>
                    <td className="px-3 py-4 text-right tabular-nums">
                      {u.eye === null ? "—" : kes(u.eye)}
                    </td>
                    <td className="px-3 py-4 text-right tabular-nums">
                      {u.primary === null ? "—" : kes(u.primary)}
                    </td>
                    <td className="py-4 pl-3 text-right tabular-nums">
                      {u.junior === null ? "—" : kes(u.junior)}
                    </td>
                  </tr>
                ))}
                <tr className="border-b border-line-strong">
                  <th scope="row" className="py-5 pr-4 text-left font-display text-lg text-text">
                    Full set
                  </th>
                  {(["eye", "primary", "junior"] as const).map((col, i) => (
                    <td
                      key={col}
                      className={`numeral py-5 text-right text-xl ${i === 2 ? "pl-3" : "px-3"}`}
                    >
                      {kes(fees.uniform.reduce((sum, u) => sum + (u[col] ?? 0), 0))}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </Reveal>
      </Section>

      {/* How to pay */}
      <Section tone="band" size="loose">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <Reveal>
              <SectionHead
                onBand
                index="04"
                eyebrow="How to pay"
                title="M-PESA or the bank"
                lede="Whichever you use, bring or send the receipt to the office. It is posted against your child’s account the same day."
              />
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/portal/" variant="onBand">
                  Parents&rsquo; portal
                  <ArrowRightIcon className="h-4 w-4" />
                </ButtonLink>
                <ButtonLink
                  href={`tel:${primaryPhone.href}`}
                  variant="ghostBand"
                  external
                >
                  <PhoneIcon className="h-4 w-4" />
                  {primaryPhone.phone}
                </ButtonLink>
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-7">
            <Reveal delay={80}>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="rounded-lg border border-band-line bg-band-2 p-6">
                  <p className="eyebrow !text-band-text-2">M-PESA · {payment.mpesa.label}</p>
                  <dl className="mt-5 space-y-4 text-sm">
                    <div>
                      <dt className="text-band-text-2">Paybill number</dt>
                      <dd className="numeral mt-1 text-3xl !text-band-text">
                        {payment.mpesa.paybill}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-band-text-2">Account number</dt>
                      <dd className="mt-1 font-display text-lg text-band-text">
                        {payment.accountFormat} + child&rsquo;s name
                      </dd>
                    </div>
                    <div>
                      <dt className="text-band-text-2">For example</dt>
                      <dd className="mt-1">
                        <code className="rounded bg-band px-2 py-1 font-mono text-[13px] text-band-accent">
                          {payment.accountExample}
                        </code>
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-5 text-sm leading-relaxed text-band-text-2">
                    No spaces anywhere in the account number. If the name is long, the
                    admission number works just as well.
                  </p>
                </div>

                <div className="rounded-lg border border-band-line bg-band-2 p-6">
                  <p className="eyebrow !text-band-text-2">Bank</p>
                  <dl className="mt-5 space-y-4 text-sm">
                    <div>
                      <dt className="text-band-text-2">Bank</dt>
                      <dd className="mt-1 font-display text-lg text-band-text">
                        {payment.bank.name}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-band-text-2">Account number</dt>
                      <dd className="numeral mt-1 text-2xl !text-band-text">
                        {payment.bank.account}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-band-text-2">Account name</dt>
                      <dd className="mt-1 font-display text-lg text-band-text">
                        {payment.bank.holder}
                      </dd>
                    </div>
                  </dl>
                  {/* Parents do read this and assume the site has misspelt the
                      school. It has not — the bank holds the account under
                      that spelling, and a transfer typed the other way can be
                      held up. Saying so here saves a trip to the office. */}
                  <p className="mt-5 text-sm leading-relaxed text-band-text-2">
                    The account name really is spelt <b className="font-semibold text-band-text">Stefan</b>{" "}
                    — that is how the bank holds it. Type it exactly as shown.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </Section>
    </>
  );
}
