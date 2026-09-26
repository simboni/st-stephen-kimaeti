import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, news } from "@/lib/site";
import { Photo } from "@/components/photo";
import { Section } from "@/components/ui";
import { ArrowRightIcon } from "@/components/icons";

export function generateStaticParams() {
  return news.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = news.find((p) => p.slug === slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: { title: post.title, description: post.excerpt },
  };
}

export default async function NewsPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = news.find((p) => p.slug === slug);
  if (!post) notFound();

  const others = news.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <>
      <div className="bg-navy-900">
        <div className="container-page py-16 md:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-300">
            {formatDate(post.date)} · News
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-3xl font-extrabold tracking-tight text-white text-balance md:text-5xl">
            {post.title}
          </h1>
        </div>
      </div>

      <Section>
        <div className="mx-auto max-w-3xl">
          {post.photo && (
            <Photo
              src={post.photo}
              sizes="(min-width: 768px) 768px, 100vw"
              ratio="16/10"
              priority
              className="mb-10 rounded-2xl shadow-lg"
            />
          )}
          <div className="space-y-5 text-lg leading-relaxed">
            {post.body.map((paragraph) => (
              <p key={paragraph.slice(0, 40)}>{paragraph}</p>
            ))}
          </div>

          <div className="mt-12 border-t border-paper-300 pt-8">
            <Link
              href="/news/"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:text-brand-700"
            >
              <ArrowRightIcon className="h-4 w-4 rotate-180" /> Back to all news
            </Link>
          </div>
        </div>
      </Section>

      {others.length > 0 && (
        <Section tinted>
          <h2 className="font-display text-2xl font-extrabold text-ink-900">More news</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {others.map((other) => (
              <Link key={other.slug} href={`/news/${other.slug}/`} className="card card-hover block p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-brand-600">
                  {formatDate(other.date)}
                </p>
                <h3 className="mt-2 font-display text-lg font-extrabold leading-snug text-ink-900">
                  {other.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed">{other.excerpt}</p>
              </Link>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
