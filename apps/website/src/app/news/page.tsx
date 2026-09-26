import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { formatDate, news } from "@/lib/site";
import { PageHero } from "@/components/page-hero";
import { Section } from "@/components/ui";
import { Reveal } from "@/components/reveal";
import { ArrowRightIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "News & Updates",
  description:
    "The latest news and updates from Holy Cross Junior & Infant Schools, Bulimbo — achievements, projects and announcements.",
};

export default function NewsPage() {
  const posts = [...news].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <PageHero
        eyebrow="News & updates"
        title="Stories from our school community"
        intro="Achievements, projects and announcements from Holy Cross, Bulimbo."
      />
      <Section>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, i) => (
            <Reveal key={post.slug} delay={(i % 3) * 100}>
              <Link
                href={`/news/${post.slug}/`}
                className="card card-hover flex h-full flex-col overflow-hidden"
              >
                {post.image ? (
                  <Image
                    src={post.image}
                    alt=""
                    width={800}
                    height={500}
                    className="aspect-[8/5] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[8/5] w-full items-center justify-center bg-gradient-to-br from-brand-500 to-brand-400">
                    <Image src="/logo.png" alt="" width={96} height={96} className="h-24 w-24 rounded-full bg-white/95 object-contain p-1.5" />
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
