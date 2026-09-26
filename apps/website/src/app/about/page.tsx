import type { Metadata } from "next";
import { intro, school, sections, stats } from "@/lib/site";
import { PageHero } from "@/components/page-hero";
import { Photo } from "@/components/photo";
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
  title: "About",
  description: `The story, mission, vision and values of ${school.shortName} — a mixed day and boarding school at Kimaeti, Bungoma, teaching 525 learners from Playgroup to Grade 9 since ${school.founded}.`,
};

/* Confirmed from the school's own papers — each one is checkable. */
const facts = [
  ["Founded", String(school.founded)],
  ["Sponsor", school.sponsor],
  ["Type", "Mixed, day and boarding"],
  ["Sections", "Early Years · Primary · Junior"],
  ["Classes", "12 — Playgroup to Grade 9"],
  ["Learners", "525 (250 boys, 275 girls)"],
  ["Boarders", "157"],
  ["Teaching staff", "26"],
  ["Curriculum", "Competency-Based Curriculum (CBC)"],
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About us"
        title="Two words, taken seriously"
        intro={`${school.name} — ${school.motto.toLowerCase()}, at Kimaeti in Bungoma County since ${school.founded}.`}
        photo="staff-outside-block"
      />

      {/* Story */}
      <Section>
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <SectionHeading eyebrow="Our story" title="A school of the Brothers" />
            {intro.map((p) => (
              <p key={p} className="mt-5 text-lg leading-relaxed">
                {p}
              </p>
            ))}
            <ul className="mt-7 space-y-3">
              {[
                "Faith at the centre — the day opens and closes in prayer",
                "Twelve classes, so a learner never has to change school",
                "Boarding for 157, with a matron or master in every dormitory",
                "Practical CBC learning: every learner builds and defends a project",
                "A working shamba, a tree line and a water tank the school built itself",
              ].map((point) => (
                <li key={point} className="flex items-start gap-3 leading-relaxed">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-leaf-500/15 text-leaf-600">
                    <CheckIcon className="h-3 w-3" />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={120}>
            <div className="space-y-5">
              <Photo
                src="staff-outside-block"
                sizes="(min-width: 1024px) 46vw, 100vw"
                ratio="4/3"
                className="rounded-2xl shadow-[0_28px_64px_-34px_rgba(26,33,48,0.6)]"
              />
              <div className="grid grid-cols-2 gap-5">
                <Photo
                  src="classroom-lesson"
                  sizes="(min-width: 1024px) 23vw, 50vw"
                  ratio="1/1"
                  className="rounded-2xl"
                />
                <Photo
                  src="school-grounds"
                  sizes="(min-width: 1024px) 23vw, 50vw"
                  ratio="1/1"
                  className="rounded-2xl"
                />
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* The school at a glance */}
      <Section tinted className="bg-dots">
        <Reveal>
          <SectionHeading
            center
            eyebrow="At a glance"
            title="The school, in figures you can check"
            intro="Everything here comes from the school's own enrolment return and letterheads, not from a brochure."
          />
        </Reveal>
        <Reveal delay={100}>
          <dl className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-x-10 gap-y-0 sm:grid-cols-2">
            {facts.map(([k, v]) => (
              <div
                key={k}
                className="flex items-baseline justify-between gap-4 border-b border-paper-300 py-3.5"
              >
                <dt className="text-sm font-semibold uppercase tracking-wider text-ink-400">{k}</dt>
                <dd className="text-right font-display font-bold text-ink-900">{v}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </Section>

      {/* Mission / vision / motto */}
      <Section>
        <Reveal>
          <SectionHeading center eyebrow="What guides us" title="Vision, mission, motto" />
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            { icon: EyeIcon, title: "Vision", text: school.vision },
            { icon: TargetIcon, title: "Mission", text: school.mission },
            { icon: LightbulbIcon, title: "Motto", text: `${school.motto}.` },
          ].map((p, i) => (
            <Reveal key={p.title} delay={i * 110}>
              <div className="card card-hover h-full p-8 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                  <p.icon className="h-7 w-7" />
                </span>
                <h2 className="mt-5 font-display text-xl font-extrabold text-ink-900">{p.title}</h2>
                <p className="mt-3 text-lg leading-relaxed">{p.text}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <div className="mt-10 rounded-3xl bg-navy-900 p-8 text-center md:p-12">
            <p className="kicker justify-center !text-brand-300">Our values</p>
            <ul className="mt-5 flex flex-wrap justify-center gap-2.5">
              {school.values.map((v) => (
                <li
                  key={v}
                  className="rounded-full bg-white/10 px-4 py-2 font-display text-sm font-bold text-white"
                >
                  {v}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </Section>

      {/* Sections of the school */}
      <Section tinted>
        <Reveal>
          <SectionHeading
            center
            eyebrow="Our sections"
            title="Early Years, Primary and Junior — one compound"
          />
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {sections.map((a, i) => (
            <Reveal key={a.slug} delay={i * 110}>
              <div className="card card-hover h-full p-8">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <BookIcon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 font-display text-lg font-extrabold text-ink-900">{a.title}</h3>
                <p className="mt-1 text-sm font-bold text-brand-600">{a.levels}</p>
                <p className="mt-3 leading-relaxed">{a.text}</p>
                <p className="mt-4 text-sm font-semibold text-maroon-500">
                  {a.learners} learners today
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="card p-6 text-center">
                <p className="font-display text-3xl font-extrabold text-brand-600">{s.value}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-ink-400">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        <div className="mt-12 text-center">
          <ButtonLink href="/admissions/">
            Join the school <ArrowRightIcon className="h-4 w-4" />
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
