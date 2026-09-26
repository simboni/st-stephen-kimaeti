import type { Metadata } from "next";
import Image from "next/image";
import { gallery, videos } from "@/lib/site";
import { PageHero } from "@/components/page-hero";
import { Section, SectionHeading } from "@/components/ui";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Our Gallery",
  description:
    "Photos and videos of life at Holy Cross Junior & Infant Schools, Bulimbo — our compound, classrooms and learners in action.",
};

export default function GalleryPage() {
  return (
    <>
      <PageHero
        eyebrow="Our gallery"
        title="Life at Holy Cross, in pictures"
        intro="A look around our compound, classrooms and the moments that make our school special."
      />

      <Section>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {gallery.map((item, i) => (
            <Reveal key={item.src} delay={i * 100}>
              <figure className="card card-hover overflow-hidden">
                <Image
                  src={item.src}
                  alt={item.alt}
                  width={1600}
                  height={1200}
                  className="aspect-[4/3] w-full object-cover"
                />
                <figcaption className="p-5 text-sm font-semibold text-ink-700">
                  {item.caption}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
        <p className="mt-10 text-center text-sm text-ink-400">
          More photos coming soon — we&rsquo;re building our gallery term by term.
        </p>
      </Section>

      <Section tinted>
        <SectionHeading
          eyebrow="Videos"
          title="Our students in action"
          intro="Performances and school moments captured on video."
          center
        />
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {videos.map((v, i) => (
            <Reveal key={v.id} delay={i * 110}>
              <div className="overflow-hidden rounded-2xl shadow-lg">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${v.id}`}
                  title={v.title}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="aspect-video w-full"
                />
              </div>
            </Reveal>
          ))}
        </div>
      </Section>
    </>
  );
}
