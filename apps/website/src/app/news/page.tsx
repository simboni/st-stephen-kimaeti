import type { Metadata } from "next";
import Link from "next/link";
import { formatDate, news, school } from "@/lib/site";
import { PageHero } from "@/components/page-hero";
import { Photo } from "@/components/photo";
import { Crest } from "@/components/crest";
import { ButtonLink, Reveal, Section } from "@/components/ui";
import { ArrowRightIcon } from "@/components/icons";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "News",
  description: `News from ${school.shortName} — what the learners have been building, winning and celebrating this term.`,
};

export default function NewsPage() {
  const posts = [...news].sort((a, b) => b.date.localeCompare(a.date));
  const [lead, ...rest] = posts;

  return (
    <>
      <PageHero
        index="08"
        eyebrow="News"
        title="What has been happening"
        lede="Projects, results and announcements from the school at Kimaeti."
        photo="mass-outdoors"
      />

      <Section size="loose">
        {lead && (
          <Reveal>
            <Link
              href={`/news/${lead.slug}/`}
              className="group grid grid-cols-1 gap-8 border-b border-line pb-14 lg:grid-cols-12 lg:gap-14"
            >
              {lead.photo && (
                <div className="lg:col-span-7">
                  <Photo
                    src={lead.photo}
                    sizes="(min-width: 1024px) 55vw, 100vw"
                    ratio="16/10"
                    className="rounded-lg"
                    imgClassName="transition-transform duration-700 group-hover:scale-[1.02]"
                  />
                </div>
              )}
              <div className="flex flex-col justify-center lg:col-span-5">
                <p className="eyebrow">{formatDate(lead.date)}</p>
                <h2 className="display mt-4 text-[1.9rem] leading-tight md:text-[2.6rem]">
                  {lead.title}
                </h2>
                <p className="mt-5 text-lg leading-relaxed">{lead.excerpt}</p>
                <span className="mt-6 inline-flex items-center gap-2 font-semibold text-accent">
                  Read the story
                  <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          </Reveal>
        )}

        <div className="mt-14 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((post, i) => (
            <Reveal key={post.slug} delay={(i % 3) * 80}>
              <Link href={`/news/${post.slug}/`} className="group flex h-full flex-col">
                {post.photo ? (
                  <Photo
                    src={post.photo}
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 100vw"
                    ratio="8/5"
                    className="rounded-lg"
                    imgClassName="transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                ) : (
                  <span className="flex aspect-[8/5] w-full items-center justify-center rounded-lg bg-surface-2">
                    <Crest mark className="h-16 w-16" />
                  </span>
                )}
                <p className="eyebrow mt-5">{formatDate(post.date)}</p>
                <h2 className="display mt-3 text-xl leading-snug">{post.title}</h2>
                <p className="mt-3 flex-1 leading-relaxed">{post.excerpt}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
                  Read more
                  <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-16 flex flex-wrap items-center justify-between gap-6 border-t border-line pt-8">
            <p className="text-text-3">
              Follow the school without checking back — the news is published as a feed.
            </p>
            <ButtonLink href={`${base}/news.xml`} variant="outline" external>
              Subscribe by RSS
              <ArrowRightIcon className="h-4 w-4" />
            </ButtonLink>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
