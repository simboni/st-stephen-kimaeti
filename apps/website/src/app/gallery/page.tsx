import type { Metadata } from "next";
import { photos, photosIn, type PhotoCategory } from "@/lib/photos";
import { school } from "@/lib/site";
import { PageHero } from "@/components/page-hero";
import { Photo } from "@/components/photo";
import { Section, SectionHeading } from "@/components/ui";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Gallery",
  description: `Photographs of life at ${school.shortName} — the science fair, the classrooms, the dormitories, the shamba, sport and the cultural troupe.`,
};

/** The order the gallery reads in, with a line of context for each group.
 *  A group may draw on more than one category where neither alone fills a row. */
const GROUPS: { cats: PhotoCategory[]; title: string; text: string }[] = [
  {
    cats: ["academics"],
    title: "The science fair",
    text: "Once a term the eucalyptus grove fills with desks, charts and apparatus, and every class defends a project it built itself.",
  },
  {
    cats: ["earlyyears"],
    title: "Early Years",
    text: "Playgroup, PP1 and PP2 — 123 of the smallest learners in the school.",
  },
  {
    cats: ["faith"],
    title: "Prayer",
    text: "Mass in the open air, the whole school standing round the lectern. The first half of the motto.",
  },
  {
    cats: ["campus"],
    title: "The compound",
    text: "Classrooms, grounds and the works the school has built for itself.",
  },
  {
    cats: ["boarding"],
    title: "Boarding",
    text: "157 learners sleep here. Three cooked meals a day and prep every evening.",
  },
  {
    cats: ["sport", "culture"],
    title: "Sport, music and dance",
    text: "Football for the boys and the girls, games every afternoon, and a cultural troupe that travels.",
  },
  {
    cats: ["community"],
    title: "Work",
    text: "The school shamba, dug and planted by the learners themselves — the second half of the motto.",
  },
  {
    cats: ["staff"],
    title: "Our staff",
    text: "Twenty-six teachers, and the office that keeps it all running.",
  },
  {
    cats: ["life"],
    title: "Faces",
    text: "Between lessons, on the field, at the end of the day.",
  },
];

export default function GalleryPage() {
  return (
    <>
      <PageHero
        eyebrow="Gallery"
        title="An ordinary term at St Stephen's"
        intro={`${photos.length} photographs from the school's own camera — no models, no stock, nothing staged for a brochure.`}
        photo="cultural-troupe"
      />

      {GROUPS.map((group, gi) => {
        const items = group.cats.flatMap(photosIn);
        if (items.length === 0) return null;
        return (
          <Section key={group.title} tinted={gi % 2 === 1}>
            <Reveal>
              <SectionHeading
                eyebrow={`${items.length} photo${items.length === 1 ? "" : "s"}`}
                title={group.title}
                intro={group.text}
              />
            </Reveal>
            {/* Always four columns wide, but a short group is capped so its
                tiles stay the same size as everyone else's rather than
                stretching across the page. */}
            <div
              className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
              style={items.length < 4 ? { maxWidth: `${items.length * 19.5}rem` } : undefined}
            >
              {items.map((p, i) => (
                <Reveal key={p.slug} delay={(i % 4) * 70}>
                  <figure className="card card-hover h-full overflow-hidden">
                    <Photo
                      src={p}
                      sizes="(min-width: 1024px) 22vw, (min-width: 768px) 30vw, 46vw"
                      ratio="4/5"
                    />
                    <figcaption className="p-3.5 text-xs font-semibold leading-snug text-ink-700 sm:text-sm">
                      {p.caption}
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </Section>
        );
      })}
    </>
  );
}
