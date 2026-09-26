import type { Metadata } from "next";
import { academics, admissionSteps, school } from "@/lib/site";
import { PageHero } from "@/components/page-hero";
import { ButtonLink, Section, SectionHeading } from "@/components/ui";
import { Reveal } from "@/components/reveal";
import { ArrowRightIcon, BookIcon, MailIcon, PhoneIcon, PinIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Admissions",
  description: `How to enrol your child at ${school.name}, Bulimbo — places available from Playgroup to Grade 9 under the CBC curriculum.`,
};

export default function AdmissionsPage() {
  return (
    <>
      <PageHero
        eyebrow="Admissions"
        title="Begin your child's journey at Holy Cross"
        intro="We welcome learners from Playgroup through Grade 9. Enrolment is simple — here's everything you need to know."
      />

      {/* Steps */}
      <Section>
        <SectionHeading
          eyebrow="How to join"
          title="Four simple steps to enrolment"
          intro="Our office team will walk you through each step — most families complete the process in a single visit."
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
          {academics.map((a, i) => (
            <Reveal key={a.title} delay={i * 110}>
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

      {/* Contact the office */}
      <Section>
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
