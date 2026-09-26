import type { Metadata } from "next";
import Link from "next/link";
import { formatDate, news, school } from "@/lib/site";
import { PageHero } from "@/components/page-hero";
import { Photo } from "@/components/photo";
import { Crest } from "@/components/crest";
import { Section } from "@/components/ui";
import { Reveal } from "@/components/reveal";
import { ArrowRightIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "News",
  description: `News from ${school.shortName} — what the learners have been building, winning and celebrating this term.`,
};

export default function NewsPage() {
  const posts = [...news].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <PageHero
        eyebrow="News"
        title="What has been happening"
        intro="Projects, results and announcements from the school at Kimaeti."
        photo="mass-outdoors"
      />
      <Section>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, i) => (
            <Reveal key={post.slug} delay={(i % 3) * 100}>
              <Link
                href={`/news/${post.slug}/`}
                className="card card-hover flex h-full flex-col overflow-hidden"
              >
                {post.photo ? (
                  <Photo
                    src={post.photo}
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 100vw"
                    ratio="8/5"
                  />
                ) : (
                  <div className="flex aspect-[8/5] w-full items-center justify-center bg-gradient-to-br from-brand-500 to-brand-400">
                    <Crest className="h-24 w-24" />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-brand-600">
                    {formatDate(post.date)}
                  </p>
                  <h2 className="mt-2 font-display text-lg font-extrabold leading-snug text-ink-900">
                    {post.title}
                  </h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed">{post.excerpt}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand-600">
                    Read more <ArrowRightIcon className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </Section>
    </>
  );
}
