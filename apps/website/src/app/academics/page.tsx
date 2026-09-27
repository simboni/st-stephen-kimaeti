import type { Metadata } from "next";
import { school, sections } from "@/lib/site";
import { PageHero } from "@/components/page-hero";
import { Photo } from "@/components/photo";
import { ButtonLink, Reveal, Section, SectionHead, Stat } from "@/components/ui";
import { ArrowRightIcon, CheckIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Academics",
  description: `How ${school.shortName} teaches Kenya’s Competency-Based Curriculum from Playgroup to Grade 9 — continuous assessment, practical science, agriculture taught in the beds, and the science and engineering fair.`,
};

/* The CBC assessment bands, as Kenyan schools report them. */
const BANDS = [
  { code: "EE", name: "Exceeding expectation", range: "80–100%" },
  { code: "ME", name: "Meeting expectation", range: "60–79%" },
  { code: "AE", name: "Approaching expectation", range: "40–59%" },
  { code: "BE", name: "Below expectation", range: "Under 40%" },
];

const HOW = [
  {
    title: "Assessed all term, not once a year",
    text: "CBC judges a learner on what they can do. Work is assessed continuously against the four bands and reported to parents each term, so nothing about a report card should come as a surprise.",
  },
  {
    title: "Practical before theoretical",
    text: "Osmosis is demonstrated with a jam jar. The oxygen atom is modelled from whatever is to hand. Hard water is softened at a bench under the trees. If it can be built, it gets built.",
  },
  {
    title: "Taught by people who stay",
    text: "Twenty-six teachers for 525 learners, across twelve classes. Small enough that a child who goes quiet in Grade 4 is noticed in Grade 4.",
  },
  {
    title: "Agriculture in the beds themselves",
    text: "Onions and kale grow in timber frames and old tyres beside the classrooms. Learners dig, plant, weed and harvest, and the kitchen cooks the result.",
  },
];

export default function AcademicsPage() {
  return (
    <>
      <PageHero
        index="01"
        eyebrow="Academics"
        title="Twelve classes, one curriculum, a great deal of practical work"
        lede="Kenya’s Competency-Based Curriculum, taught from Playgroup through to the Grade 9 assessment — and taught with your hands where that is possible."
        photo="science-bottles"
      />

      {/* The three sections */}
      <Section size="loose">
        <Reveal>
          <SectionHead
            index="01"
            eyebrow="Our sections"
            title="Playgroup to Grade 9, without changing school"
            lede="Roll figures are from the Term II 2026 enrolment return."
          />
        </Reveal>

        <div className="mt-14 space-y-16 md:space-y-24">
          {sections.map((s, i) => (
            <Reveal key={s.slug}>
              <article className="grid grid-cols-1 items-center gap-8 md:grid-cols-12 md:gap-14">
                <figure
                  className={`md:col-span-6 ${i % 2 === 1 ? "md:order-2 md:col-start-7" : ""}`}
                >
                  <Photo
                    src={s.photo}
                    sizes="(min-width: 768px) 48vw, 100vw"
                    ratio="4/3"
                    className="rounded-lg shadow-[var(--shadow-e2)]"
                  />
                </figure>
                <div className={`md:col-span-6 ${i % 2 === 1 ? "md:order-1 md:row-start-1" : ""}`}>
                  <p className="eyebrow">{s.levels}</p>
                  <h3 className="display mt-4 text-[1.9rem] leading-tight md:text-[2.4rem]">
                    {s.title}
                  </h3>
                  <p className="mt-5 text-lg leading-relaxed">{s.text}</p>
                  <div className="mt-7 border-t border-line pt-5">
                    <Stat value={s.learners} label="Learners on the roll today" />
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* How we teach */}
      <Section tone="tint" size="loose">
        <Reveal>
          <SectionHead index="02" eyebrow="How we teach" title="Four principles, in practice" />
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-x-10 gap-y-10 md:grid-cols-2">
          {HOW.map((h, i) => (
            <Reveal key={h.title} delay={(i % 2) * 80}>
              <div className="border-t border-line pt-6">
                <span
                  className="index-ghost block text-3xl"
                  data-index={String(i + 1).padStart(2, "0")}
                  aria-hidden
                />
                <h3 className="display mt-3 text-xl">{h.title}</h3>
                <p className="mt-3 leading-relaxed">{h.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* The fair */}
      <Section size="loose">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <Reveal>
              <SectionHead
                index="03"
                eyebrow="The science and engineering fair"
                title="Every class builds something and defends it"
                lede="Once a term the eucalyptus grove behind the classrooms fills with desks, tents, hand-drawn charts and improvised apparatus."
              />
              <p className="mt-5 leading-relaxed">
                It is the clearest answer we can give to a parent who asks what CBC
                actually looks like. It looks like a nine-year-old explaining her own
                findings, out loud, to a stranger — and getting them right.
              </p>
              <ul className="mt-7 space-y-3">
                {[
                  "Investigating osmosis",
                  "Softening hard water",
                  "Conduction in solids and in liquids",
                  "Modelling the oxygen atom",
                  "Plants grow towards the source of light",
                  "The arrangement of particles in matter",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3 leading-relaxed">
                    <CheckIcon className="mt-1 h-4 w-4 shrink-0 text-second" />
                    {t}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <div className="lg:col-span-7">
            <Reveal delay={90}>
              <div className="grid grid-cols-2 gap-4">
                {["lab-coats", "oxygen-model", "phototropism", "project-chart"].map((slug) => (
                  <Photo
                    key={slug}
                    src={slug}
                    sizes="(min-width: 1024px) 28vw, 45vw"
                    ratio="3/4"
                    className="rounded-lg"
                  />
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* Assessment bands */}
      <Section tone="band" size="loose">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <Reveal>
              <SectionHead
                onBand
                index="04"
                eyebrow="Reading a report card"
                title="What the four letters mean"
                lede="CBC does not report a position in class. It reports where a learner is against the expectation for their grade, in each strand."
              />
            </Reveal>
          </div>
          <div className="lg:col-span-7">
            <Reveal delay={80}>
              <dl className="divide-y divide-band-line border-y border-band-line">
                {BANDS.map((b) => (
                  <div key={b.code} className="flex items-baseline gap-6 py-5">
                    <dt className="numeral w-16 shrink-0 text-3xl !text-band-accent">
                      {b.code}
                    </dt>
                    <dd className="flex flex-1 flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                      <span className="font-display text-lg text-band-text">{b.name}</span>
                      <span className="text-sm text-band-text-2">{b.range}</span>
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-6 text-sm leading-relaxed text-band-text-2">
                Report cards go home each term and parents are invited to consultation
                days. The parents&rsquo; portal, launching with the school&rsquo;s new
                management system, will show the same marks live.
              </p>
              <div className="mt-8">
                <ButtonLink href="/portal/" variant="onBand">
                  The parents&rsquo; portal
                  <ArrowRightIcon className="h-4 w-4" />
                </ButtonLink>
              </div>
            </Reveal>
          </div>
        </div>
      </Section>

      <Section size="tight">
        <Reveal>
          <div className="flex flex-wrap items-center justify-between gap-6 rounded-lg border border-line bg-surface-3 p-8 md:p-10">
            <div>
              <h2 className="display text-2xl">Places are open from Playgroup to Grade 9</h2>
              <p className="mt-2">Day and boarding, for the 2027 intake.</p>
            </div>
            <ButtonLink href="/admissions/">
              How to apply
              <ArrowRightIcon className="h-4 w-4" />
            </ButtonLink>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
