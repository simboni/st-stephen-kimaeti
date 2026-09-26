import type { Metadata } from "next";
import { admissionSteps, fees, money, school, sections } from "@/lib/site";
import { PageHero } from "@/components/page-hero";
import { Photo } from "@/components/photo";
import { ButtonLink, Section, SectionHeading } from "@/components/ui";
import { Reveal } from "@/components/reveal";
import { ArrowRightIcon, BookIcon, MailIcon, PhoneIcon, PinIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Admissions",
  description: `How to enrol your child at ${school.shortName} — places available from Playgroup to Grade 9, day and boarding, under Kenya's CBC curriculum.`,
};

export default function AdmissionsPage() {
  return (
    <>
      <PageHero
        eyebrow="Admissions"
        title="Four steps, usually one visit"
        intro="We admit learners from Playgroup through Grade 9, day and boarding. Nothing about joining this school is complicated."
        photo="early-years-desks"
      />

      {/* Steps */}
      <Section>
        <SectionHeading
          eyebrow="How to join"
          title="Four simple steps to enrolment"
          intro="The office walks you through each step. Most families finish in a single morning."
        />
        <ol className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          {admissionSteps.map((step, i) => (
            <Reveal key={step.title} delay={i * 90}>
              <li className="card card-hover flex h-full items-start gap-5 p-7">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-500 font-display text-lg font-extrabold text-white">
                  {i + 1}
                </span>
                <div>
                  <h2 className="font-display text-lg font-extrabold text-ink-900">{step.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed">{step.text}</p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </Section>

      {/* Levels */}
      <Section tinted className="bg-dots">
        <SectionHeading
          eyebrow="Classes offered"
          title="Places available at every level"
          center
        />
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {sections.map((a, i) => (
            <Reveal key={a.slug} delay={i * 110}>
              <div className="card card-hover h-full p-8 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <BookIcon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 font-display text-lg font-extrabold text-ink-900">{a.title}</h3>
                <p className="mt-1 text-sm font-bold text-brand-600">{a.levels}</p>
                <p className="mt-3 text-sm leading-relaxed">{a.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* What it costs, and what to bring */}
      <Section>
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <SectionHeading eyebrow="Before you come" title="What to bring, and what it costs" />
            <ul className="mt-7 space-y-3 leading-relaxed">
              <li>A copy of the child&rsquo;s birth certificate.</li>
              <li>The most recent report card, if they are transferring.</li>
              <li>
                The registration and placement-assessment fees —{" "}
                {fees.oneOff.map((o) => money(o.amount)).join(" and ")}, paid once.
              </li>
              <li>
                The first term&rsquo;s fees, or an arrangement agreed with the office. Early
                Years begins at {money(fees.rows[0].t1)} for Term 1.
              </li>
            </ul>
            <p className="mt-6 leading-relaxed text-ink-400">
              Bursary and sibling considerations are handled case by case. If money is the only
              thing standing between your child and a place, say so — ask for the head teacher.
            </p>
            <div className="mt-8">
              <ButtonLink href="/fees/" variant="secondary">
                See the {fees.year} fee structure <ArrowRightIcon className="h-4 w-4" />
              </ButtonLink>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <Photo
              src="early-years-presenting"
              sizes="(min-width: 1024px) 46vw, 100vw"
              ratio="4/3"
              className="rounded-3xl shadow-[0_30px_70px_-40px_rgba(26,33,48,0.6)]"
            />
          </Reveal>
        </div>
      </Section>

      {/* Contact the office */}
      <Section tinted>
        <div className="card grid grid-cols-1 gap-10 p-8 md:grid-cols-2 md:p-12">
          <div>
            <SectionHeading
              eyebrow="Talk to the office"
              title="Ready to visit? We'd love to meet you"
              intro="The school office is open on all working days. Come for a guided tour of the classrooms, grounds and facilities."
            />
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/contact/">
                Send an enquiry <ArrowRightIcon className="h-4 w-4" />
              </ButtonLink>
            </div>
          </div>
          <ul className="space-y-5 self-center">
            <li className="flex items-center gap-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <PhoneIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-ink-400">Call us</p>
                <a href={`tel:${school.phoneHref}`} className="font-bold text-ink-900 hover:text-brand-600">
                  {school.phone}
                </a>
              </div>
            </li>
            <li className="flex items-center gap-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <MailIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-ink-400">Email</p>
                <a href={`mailto:${school.email}`} className="font-bold text-ink-900 hover:text-brand-600">
                  {school.email}
                </a>
              </div>
            </li>
            <li className="flex items-center gap-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <PinIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-ink-400">Find us</p>
                <p className="font-bold text-ink-900">{school.address}</p>
              </div>
            </li>
          </ul>
        </div>
      </Section>
    </>
  );
}
