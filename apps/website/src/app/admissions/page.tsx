import type { Metadata } from "next";
import { contacts,admissionSteps, fees, money, school, sections } from "@/lib/site";
import { PageHero } from "@/components/page-hero";
import { Photo } from "@/components/photo";
import { ButtonLink, Reveal, Section, SectionHead } from "@/components/ui";
import { ArrowRightIcon, MailIcon, PhoneIcon, PinIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Admissions",
  description: `How to enrol your child at ${school.shortName} — four steps, usually one visit. Places from Playgroup to Grade 9, day and boarding, under Kenya’s CBC curriculum.`,
};

export default function AdmissionsPage() {
  return (
    <>
      <PageHero
        index="07"
        eyebrow="Admissions"
        title="Four steps, usually one visit"
        lede="We admit learners from Playgroup through Grade 9, day and boarding. Nothing about joining this school is complicated."
        photo="early-years-desks"
      />

      {/* The steps */}
      <Section size="loose">
        <Reveal>
          <SectionHead
            index="01"
            eyebrow="How to join"
            title="From the first phone call to the first morning"
            lede="The office walks you through each step. Most families finish in a single morning."
          />
        </Reveal>

        <ol className="mt-14 grid grid-cols-1 gap-x-12 gap-y-12 md:grid-cols-2">
          {admissionSteps.map((step, i) => (
            <Reveal
              as="li"
              key={step.title}
              delay={(i % 2) * 80}
              className="border-t border-line pt-6"
            >
              <span
                className="index-ghost block text-4xl"
                data-index={String(i + 1).padStart(2, "0")}
                aria-hidden
              />
              <h3 className="display mt-3 text-xl md:text-2xl">{step.title}</h3>
              <p className="mt-3 leading-relaxed">{step.text}</p>
            </Reveal>
          ))}
        </ol>
      </Section>

      {/* What to bring */}
      <Section tone="tint" size="loose">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-6">
            <Reveal>
              <SectionHead
                index="02"
                eyebrow="Before you come"
                title="What to bring, and what it costs"
              />
              <ul className="mt-8 divide-y divide-line border-y border-line">
                {[
                  ["A copy of the birth certificate", "For every learner, whatever their age."],
                  [
                    "The most recent report card",
                    "Only if the child is transferring from another school.",
                  ],
                  [
                    `Registration and assessment — ${fees.oneOff
                      .map((o) => money(o.amount))
                      .join(" and ")}`,
                    "Paid once, on admission.",
                  ],
                  [
                    `The first term’s fees, from ${money(fees.rows[0].t1)}`,
                    "Or an arrangement agreed with the office.",
                  ],
                ].map(([title, note]) => (
                  <li key={title} className="py-5">
                    <p className="font-display text-lg text-text">{title}</p>
                    <p className="mt-1 text-sm text-text-3">{note}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-6 leading-relaxed text-text-3">
                Bursary and sibling considerations are handled case by case. If money is
                the only thing standing between your child and a place, say so — ask for
                the head teacher.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/fees/">
                  Work out what a term costs
                  <ArrowRightIcon className="h-4 w-4" />
                </ButtonLink>
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-6">
            <Reveal delay={80}>
              <Photo
                src="early-years-presenting"
                sizes="(min-width: 1024px) 48vw, 100vw"
                ratio="4/3"
                className="rounded-lg shadow-[var(--shadow-e2)]"
              />
            </Reveal>
          </div>
        </div>
      </Section>

      {/* Places by level */}
      <Section size="loose">
        <Reveal>
          <SectionHead
            index="03"
            eyebrow="Classes offered"
            title="Places at every level"
            lede="Twelve classes. Grade 9 is our highest."
          />
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          {sections.map((s, i) => (
            <Reveal key={s.slug} delay={i * 80}>
              <div className="h-full border-t border-line pt-6">
                <p className="eyebrow">{s.levels}</p>
                <h3 className="display mt-3 text-xl">{s.title}</h3>
                <p className="mt-3 leading-relaxed">{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Contact the office */}
      <Section tone="band" size="loose">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-6">
            <Reveal>
              <SectionHead
                onBand
                index="04"
                eyebrow="Talk to us"
                title="Come and see it first"
                lede="The office is open every working day. Come for a walk round the classrooms, the dormitories, the dining hall and the shamba — announced or not."
              />
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/contact/" variant="onBand">
                  Send an enquiry
                  <ArrowRightIcon className="h-4 w-4" />
                </ButtonLink>
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-6">
            <Reveal delay={80}>
              <ul className="divide-y divide-band-line border-y border-band-line">
                <li className="flex items-start gap-4 py-5">
                  <PhoneIcon className="mt-1 h-5 w-5 shrink-0 text-band-accent" />
                  <div>
                    <p className="eyebrow !text-band-text-2">Call</p>
                    <ul className="mt-1.5 space-y-2">
                      {contacts.map((c) => (
                        <li key={c.href}>
                          <a
                            href={`tel:${c.href}`}
                            className="block font-display text-lg text-band-text hover:text-band-accent"
                          >
                            {c.phone}
                          </a>
                          <span className="text-sm text-band-text-2">{c.role}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
                <li className="flex items-start gap-4 py-5">
                  <MailIcon className="mt-1 h-5 w-5 shrink-0 text-band-accent" />
                  <div>
                    <p className="eyebrow !text-band-text-2">Email</p>
                    <a
                      href={`mailto:${school.email}`}
                      className="mt-1 block break-all font-display text-lg text-band-text hover:text-band-accent"
                    >
                      {school.email}
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-4 py-5">
                  <PinIcon className="mt-1 h-5 w-5 shrink-0 text-band-accent" />
                  <div>
                    <p className="eyebrow !text-band-text-2">Find us</p>
                    <p className="mt-1 font-display text-lg text-band-text">
                      {school.address}
                    </p>
                    <p className="text-band-text-2">
                      {school.ward} · {school.location}
                    </p>
                  </div>
                </li>
              </ul>
            </Reveal>
          </div>
        </div>
      </Section>
    </>
  );
}
