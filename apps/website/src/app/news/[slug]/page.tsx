import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, news, school, site } from "@/lib/site";
import { photo } from "@/lib/photos";
import { Photo } from "@/components/photo";
import { Reveal, Section } from "@/components/ui";
import { ArrowRightIcon, ChevronRightIcon } from "@/components/icons";

const siteUrl = `https://${site.domain}`;
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

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
  const image = post.photo ? photo(post.photo) : null;
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/news/${post.slug}/` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      publishedTime: post.date,
      ...(image
        ? {
            images: [
              {
                url: `${base}/photos/${image.slug}-${image.widths[image.widths.length - 1]}.webp`,
                width: image.width,
                height: image.height,
                alt: image.alt,
              },
            ],
          }
        : {}),
    },
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
  const image = post.photo ? photo(post.photo) : null;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    mainEntityOfPage: `${siteUrl}${base}/news/${post.slug}/`,
    publisher: { "@type": "School", name: school.name, "@id": `${siteUrl}/#school` },
    ...(image
      ? {
          image: `${siteUrl}${base}/photos/${image.slug}-${
            image.widths[image.widths.length - 1]
          }.webp`,
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <article>
        <header className="bg-band">
          <div className="container-page py-14 md:py-20">
            <nav aria-label="Breadcrumb" className="mb-6">
              <ol className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-band-text-2">
                <li>
                  <Link href="/" className="hover:text-band-text">
                    Home
                  </Link>
                </li>
                <li className="flex items-center gap-1.5">
                  <ChevronRightIcon className="h-3 w-3 opacity-50" />
                  <Link href="/news/" className="hover:text-band-text">
                    News
                  </Link>
                </li>
              </ol>
            </nav>
            <p className="eyebrow !text-band-text-2">
              <time dateTime={post.date}>{formatDate(post.date)}</time>
            </p>
            <h1 className="display mt-4 max-w-4xl !text-band-text text-[2.2rem] leading-[1.05] sm:text-[3rem] md:text-[3.6rem]">
              {post.title}
            </h1>
          </div>
        </header>

        <Section size="loose">
          {post.photo && (
            <Reveal>
              <figure className="mb-12">
                <Photo
                  src={post.photo}
                  sizes="(min-width: 1320px) 1240px, 100vw"
                  ratio="16/9"
                  priority
                  className="rounded-lg shadow-[var(--shadow-e2)]"
                />
                <figcaption className="plate-caption">{image?.caption}</figcaption>
              </figure>
            </Reveal>
          )}

          <div className="measure space-y-6 text-lg leading-relaxed">
            {post.body.map((paragraph) => (
              <p key={paragraph.slice(0, 40)}>{paragraph}</p>
            ))}
          </div>

          <div className="mt-14 border-t border-line pt-8">
            <Link href="/news/" className="link-underline inline-flex items-center gap-2">
              <ArrowRightIcon className="h-4 w-4 rotate-180" />
              All news
            </Link>
          </div>
        </Section>

        {others.length > 0 && (
          <Section tone="tint" size="loose" as="div">
            <h2 className="display text-2xl">More from the school</h2>
            <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
              {others.map((other) => (
                <Link key={other.slug} href={`/news/${other.slug}/`} className="group block">
                  {other.photo && (
                    <Photo
                      src={other.photo}
                      sizes="(min-width: 640px) 46vw, 100vw"
                      ratio="16/9"
                      className="rounded-lg"
                      imgClassName="transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                  )}
                  <p className="eyebrow mt-5">{formatDate(other.date)}</p>
                  <h3 className="display mt-3 text-xl leading-snug">{other.title}</h3>
                  <p className="mt-2 leading-relaxed">{other.excerpt}</p>
                </Link>
              ))}
            </div>
          </Section>
        )}
      </article>
    </>
  );
}
