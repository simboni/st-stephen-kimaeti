import type { Metadata } from "next";
import { lifeStrands, school } from "@/lib/site";
import { photo } from "@/lib/photos";
import { PageHero } from "@/components/page-hero";
import { Photo } from "@/components/photo";
import { ButtonLink, Reveal, Section, SectionHead } from "@/components/ui";
import {
  ArrowRightIcon,
  BedIcon,
  BusIcon,
  CrossIcon,
  LeafIcon,
  MusicIcon,
  TrophyIcon,
} from "@/components/icons";

export const metadata: Metadata = {
  title: "School life",
  description: `Life outside the timetable at ${school.shortName} — boarding, open-air Mass, the music festival troupes, football, the shamba and kitchen garden, and trips as far as Kisumu.`,
};

const ICON = {
  bed: BedIcon,
  cross: CrossIcon,
  music: MusicIcon,
  trophy: TrophyIcon,
  leaf: LeafIcon,
  bus: BusIcon,
} as const;

export default function SchoolLifePage() {
  return (
    <>
      <PageHero
        index="02"
        eyebrow="School life"
        title="What happens when the lesson ends"
        lede="Boarding, prayer, music, sport, the shamba and the road out of the ward. A third of our learners sleep here, so the evening matters as much as the morning."
        photo="festival-travel"
      />

      {/* Jump list */}
      <div className="border-b border-line bg-surface-2">
        <nav
          className="container-page flex gap-x-6 gap-y-2 overflow-x-auto py-4"
          aria-label="On this page"
          tabIndex={0}
        >
          {lifeStrands.map((s) => (
            <a
              key={s.slug}
              href={`#${s.slug}`}
              className="whitespace-nowrap text-sm font-semibold text-text-2 transition-colors hover:text-accent"
            >
              {s.title}
            </a>
          ))}
        </nav>
      </div>

      {lifeStrands.map((strand, i) => {
        const Icon = ICON[strand.icon];
        const [firstPhoto, ...others] = strand.photos;
        const flip = i % 2 === 1;
        return (
          <Section
            key={strand.slug}
            id={strand.slug}
            tone={flip ? "tint" : "plain"}
            size="loose"
          >
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
              <div className={`lg:col-span-5 ${flip ? "lg:order-2 lg:col-start-8" : ""}`}>
                <Reveal>
                  <Icon className="h-8 w-8 text-second" />
                  <SectionHead
                    className="mt-5"
                    index={String(i + 1).padStart(2, "0")}
                    eyebrow={strand.title}
                    title={strand.lead}
                  />
                  <div className="mt-6 space-y-4">
                    {strand.body.map((p) => (
                      <p key={p} className="leading-relaxed">
                        {p}
                      </p>
                    ))}
                  </div>
                </Reveal>
              </div>

              <div className={`lg:col-span-7 ${flip ? "lg:order-1 lg:row-start-1" : ""}`}>
                <Reveal delay={80}>
                  <figure>
                    <Photo
                      src={firstPhoto}
                      sizes="(min-width: 1024px) 55vw, 100vw"
                      ratio="16/10"
                      className="rounded-lg shadow-[var(--shadow-e2)]"
                    />
                    <figcaption className="plate-caption">
                      {photo(firstPhoto).caption}
                    </figcaption>
                  </figure>

                  {others.length > 0 && (
                    <div
                      className={`mt-4 grid gap-4 ${
                        others.length >= 3 ? "grid-cols-3" : "grid-cols-2"
                      }`}
                    >
                      {others.map((slug) => (
                        <Photo
                          key={slug}
                          src={slug}
                          sizes="(min-width: 1024px) 18vw, 32vw"
                          ratio="1/1"
                          className="rounded-lg"
                        />
                      ))}
                    </div>
                  )}
                </Reveal>
              </div>
            </div>
          </Section>
        );
      })}

      <Section tone="band" size="loose">
        <Reveal>
          <div className="flex flex-wrap items-center justify-between gap-8">
            <SectionHead
              onBand
              eyebrow="See the rest"
              title="Forty-six photographs, taken by the school itself"
            />
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/gallery/" variant="onBand">
                The gallery
                <ArrowRightIcon className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink href="/admissions/" variant="ghostBand">
                Apply for a place
              </ButtonLink>
            </div>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
