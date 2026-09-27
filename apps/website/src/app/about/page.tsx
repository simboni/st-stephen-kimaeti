import type { Metadata } from "next";
import { intro, school, stats } from "@/lib/site";
import { photo } from "@/lib/photos";
import { PageHero } from "@/components/page-hero";
import { Photo } from "@/components/photo";
import { Crest } from "@/components/crest";
import { ButtonLink, Reveal, Section, SectionHead, Stat } from "@/components/ui";
import { ArrowRightIcon, CheckIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "About",
  description: `The story, crest, vision and values of ${school.shortName} — a mixed day and boarding school at Kimaeti, Bungoma, teaching 525 learners from Playgroup to Grade 9 since ${school.founded} under the ${school.sponsor}.`,
};

/* Every line here is checkable against a document the school gave us. */
const FACTS: [string, string][] = [
  ["Founded", String(school.founded)],
  ["Sponsor", school.sponsor],
  ["Type", "Mixed, day and boarding"],
  ["Sections", "Early Years · Primary · Junior"],
  ["Classes", "12 — Playgroup to Grade 9"],
  ["Learners", "525 — 250 boys, 275 girls"],
  ["Boarders", "157, about 30% of the roll"],
  ["Teaching staff", "26"],
  ["Curriculum", "Competency-Based Curriculum (CBC)"],
  ["Postal address", school.address],
];

/* What the four quarters of the badge carry. */
const ARMS = [
  { name: "The S", text: "For Stephen, the first martyr, whose name the school carries." },
  { name: "The open book", text: "Learning, lit — the rays are drawn in gold across the pages." },
  { name: "Five stars", text: "Set in the lower left, on the blue of the shirt the learners wear." },
  { name: "The Latin cross", text: "The Brothers of St Charles Lwanga, who founded and sponsor the school." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        index="03"
        eyebrow="About us"
        title="Two words, taken seriously"
        lede={`Ora et Labora — pray and work. Painted on the classroom wall at Kimaeti since ${school.founded}, and meant in both halves.`}
        photo="motto-wall"
      />

      {/* The story */}
      <Section size="loose">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-6">
            <Reveal>
              <SectionHead index="01" eyebrow="Our story" title="A school of the Brothers" />
              {intro.map((p) => (
                <p key={p} className="mt-6 text-lg leading-relaxed">
                  {p}
                </p>
              ))}
              <ul className="mt-9 space-y-3.5">
                {[
                  "Faith at the centre — the day opens and closes in prayer",
                  "Twelve classes, so a learner never has to change school",
                  "Boarding for 157, with a matron or master in every dormitory",
                  "Practical CBC learning: every learner builds and defends a project",
                  "A working shamba, a kitchen garden and a water tank the school built itself",
                ].map((point) => (
                  <li key={point} className="flex items-start gap-3 leading-relaxed">
                    <CheckIcon className="mt-1 h-4 w-4 shrink-0 text-second" />
                    {point}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <div className="lg:col-span-6">
            <Reveal delay={90}>
              <figure>
                <Photo
                  src="staff-outside-block"
                  sizes="(min-width: 1024px) 48vw, 100vw"
                  ratio="4/3"
                  className="rounded-lg shadow-[var(--shadow-e2)]"
                />
                <figcaption className="plate-caption">
                  {photo("staff-outside-block").caption}
                </figcaption>
              </figure>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <Photo
                  src="office-desk"
                  sizes="(min-width: 1024px) 23vw, 45vw"
                  ratio="1/1"
                  className="rounded-lg"
                />
                <Photo
                  src="water-tank"
                  sizes="(min-width: 1024px) 23vw, 45vw"
                  ratio="1/1"
                  className="rounded-lg"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* Vision, mission, motto */}
      <Section tone="band" size="loose">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-5">
            <Reveal>
              <SectionHead
                onBand
                index="02"
                eyebrow="What guides us"
                title="Vision, mission and the motto on the wall"
              />
              <p className="mt-6 leading-relaxed text-band-text-2">
                The motto is painted in hand-lettered capitals on the classroom block,
                in Latin and in English, above the vision and the list of values.
              </p>
              <div className="mt-8">
                <Photo
                  src="motto-wall"
                  sizes="(min-width: 1024px) 38vw, 100vw"
                  ratio="4/3"
                  className="rounded-lg"
                />
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-7">
            <Reveal delay={80}>
              <div className="divide-y divide-band-line border-y border-band-line">
                <div className="py-8">
                  <p className="eyebrow !text-band-text-2">Motto</p>
                  <p className="quote mt-3 !text-band-text text-[1.9rem] leading-tight md:text-[2.4rem]">
                    {school.mottoLatin}
                  </p>
                  <p className="mt-2 text-band-text-2">{school.motto}</p>
                </div>
                <div className="py-8">
                  <p className="eyebrow !text-band-text-2">Vision</p>
                  <p className="quote mt-3 !text-band-text text-[1.6rem] leading-snug md:text-[2rem]">
                    {school.vision}
                  </p>
                </div>
                <div className="py-8">
                  <p className="eyebrow !text-band-text-2">Mission</p>
                  <p className="quote mt-3 !text-band-text text-[1.6rem] leading-snug md:text-[2rem]">
                    {school.mission}
                  </p>
                </div>
                <div className="py-8">
                  <p className="eyebrow !text-band-text-2">Values</p>
                  <ul className="mt-4 flex flex-wrap gap-2.5">
                    {school.values.map((v) => (
                      <li
                        key={v}
                        className="rounded-full border border-band-line px-4 py-2 font-display text-sm text-band-text"
                      >
                        {v}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* The crest */}
      <Section size="loose">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <Reveal>
              <div className="flex justify-center rounded-lg border border-line bg-surface-3 p-10">
                <Crest className="h-[22rem] w-auto max-w-full" />
              </div>
            </Reveal>
          </div>
          <div className="lg:col-span-7">
            <Reveal delay={80}>
              <SectionHead
                index="03"
                eyebrow="The crest"
                title="A shield quartered by a cross"
                lede="Between two ribbons: the motto above, the school’s name below."
              />
              <dl className="mt-9 divide-y divide-line border-y border-line">
                {ARMS.map((a) => (
                  <div key={a.name} className="grid grid-cols-1 gap-2 py-5 sm:grid-cols-3 sm:gap-6">
                    <dt className="font-display text-lg text-text">{a.name}</dt>
                    <dd className="sm:col-span-2">{a.text}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* At a glance */}
      <Section tone="tint" size="loose">
        <Reveal>
          <SectionHead
            index="04"
            eyebrow="At a glance"
            title="The school, in figures you can check"
            lede="Everything here comes from the school’s own enrolment return, letterheads and fee sheets — not from a brochure."
          />
        </Reveal>

        <Reveal delay={80}>
          <div className="mt-12 grid grid-cols-2 gap-8 border-y border-line py-10 lg:grid-cols-4">
            {stats.map((s) => (
              <Stat key={s.label} value={s.value} label={s.label} size="lg" />
            ))}
          </div>
        </Reveal>

        <Reveal delay={120}>
          <dl className="mt-10 grid grid-cols-1 gap-x-14 sm:grid-cols-2">
            {FACTS.map(([k, v]) => (
              <div
                key={k}
                className="flex items-baseline justify-between gap-6 border-b border-line py-4"
              >
                <dt className="shrink-0 text-xs font-semibold uppercase tracking-[0.14em] text-text-3">
                  {k}
                </dt>
                <dd className="text-right font-display text-text">{v}</dd>
              </div>
            ))}
          </dl>
        </Reveal>

        <Reveal>
          <div className="mt-12 flex flex-wrap gap-3">
            <ButtonLink href="/academics/">
              Academics
              <ArrowRightIcon className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink href="/school-life/" variant="outline">
              School life
            </ButtonLink>
            <ButtonLink href="/admissions/" variant="outline">
              Admissions
            </ButtonLink>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
