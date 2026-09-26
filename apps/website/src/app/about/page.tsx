import type { Metadata } from "next";
import Image from "next/image";
import { academics, coreValues, school } from "@/lib/site";
import { PageHero } from "@/components/page-hero";
import { ButtonLink, Section, SectionHeading } from "@/components/ui";
import { Reveal } from "@/components/reveal";
import {
  ArrowRightIcon,
  BookIcon,
  CheckIcon,
  EyeIcon,
  LightbulbIcon,
  TargetIcon,
} from "@/components/icons";

export const metadata: Metadata = {
  title: "About Us",
  description: `The story, mission, vision and values of ${school.name}, Bulimbo — from 13 founding learners to a thriving school family of over 340 pupils.`,
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About us"
        title="A school built on faith, discipline and service"
        intro={`${school.name} in Bulimbo, Kakamega — ${school.motto.toLowerCase()}.`}
      />

      {/* Story */}
      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <SectionHeading eyebrow="Our story" title="From humble beginnings" />
            <p className="mt-5 leading-relaxed">{school.intro}</p>
            <p className="mt-4 leading-relaxed">
              Rooted in the Catholic tradition of the Holy Cross, the school community brings
              together dedicated teachers, supportive parents and eager learners. Every child is
              known by name, supported in their studies and encouraged to grow in character as
              much as in knowledge.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Value-based education rooted in the Christian faith",
                "Small classes with individual attention for every learner",
                "A safe, green and welcoming compound in Bulimbo",
                "Strong performance in academics, music and co-curricular life",
              ].map((point) => (
                <li key={point} className="flex items-start gap-3 text-sm leading-relaxed">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-leaf-500/15 text-leaf-600">
                    <CheckIcon className="h-3 w-3" />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={120}>
            <div className="space-y-6">
              <Image
                src="/campus-front.jpg"
                alt="The school compound with its two-storey classroom block"
                width={1600}
                height={1200}
                className="rounded-2xl object-cover shadow-xl"
              />
              <Image
                src="/campus-courtyard.jpg"
                alt="The colourful classroom wing seen from the courtyard"
                width={1600}
                height={1200}
                className="rounded-2xl object-cover shadow-xl"
              />
            </div>
          </Reveal>
        </div>
      </Section>

      {/* Mission / vision / motto */}
      <Section tinted className="bg-dots">
        <SectionHeading eyebrow="Pillars of excellence" title="What guides us every day" center />
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            { icon: TargetIcon, title: "Mission", text: school.mission },
            { icon: EyeIcon, title: "Vision", text: school.vision },
            { icon: LightbulbIcon, title: "Motto", text: `${school.motto}.` },
          ].map((p, i) => (
            <Reveal key={p.title} delay={i * 110}>
              <div className="card card-hover h-full p-8 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                  <p.icon className="h-7 w-7" />
                </span>
                <h2 className="mt-5 font-display text-xl font-extrabold text-ink-900">{p.title}</h2>
                <p className="mt-3 leading-relaxed">{p.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Values */}
      <Section>
        <SectionHeading
          eyebrow="Core values"
          title="Four values, one community"
          intro="These values are woven into assemblies, classrooms, games and everything in between."
          center
        />
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {coreValues.map((v, i) => (
            <Reveal key={v.title} delay={i * 90}>
              <div className="card card-hover flex h-full items-start gap-5 p-7">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 font-display text-lg font-extrabold text-brand-600">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-display text-lg font-extrabold text-ink-900">{v.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed">{v.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Sections of the school */}
      <Section tinted>
        <SectionHeading
          eyebrow="Our schools"
          title="Infant, Primary and Junior — under one roof"
          center
        />
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {academics.map((a, i) => (
            <Reveal key={a.title} delay={i * 110}>
              <div className="card card-hover h-full p-8">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <BookIcon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 font-display text-lg font-extrabold text-ink-900">{a.title}</h3>
                <p className="mt-1 text-sm font-bold text-brand-600">{a.levels}</p>
                <p className="mt-3 text-sm leading-relaxed">{a.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="mt-12 text-center">
          <ButtonLink href="/admissions/">
            Join our school <ArrowRightIcon className="h-4 w-4" />
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
