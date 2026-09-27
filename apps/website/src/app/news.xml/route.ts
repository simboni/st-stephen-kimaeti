import { news, school, site } from "@/lib/site";
import { photo } from "@/lib/photos";

export const dynamic = "force-static";

/* An RSS feed for the school's news. Cheap to produce, and it means a parent,
   a diocesan newsletter or an aggregator can follow the school without anyone
   having to remember to tell them. */

const siteUrl = `https://${site.domain}`;
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function escape(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function GET() {
  const items = [...news]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((post) => {
      const url = `${siteUrl}${base}/news/${post.slug}/`;
      const image = post.photo ? photo(post.photo) : null;
      return [
        "    <item>",
        `      <title>${escape(post.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <pubDate>${new Date(`${post.date}T08:00:00+03:00`).toUTCString()}</pubDate>`,
        `      <description>${escape(post.excerpt)}</description>`,
        ...(image
          ? [
              `      <enclosure url="${siteUrl}${base}/photos/${image.slug}-${
                image.widths[image.widths.length - 1]
              }.webp" type="image/webp" length="0" />`,
            ]
          : []),
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(school.shortName)} — news</title>
    <link>${siteUrl}${base}/news/</link>
    <atom:link href="${siteUrl}${base}/news.xml" rel="self" type="application/rss+xml" />
    <description>${escape(site.description)}</description>
    <language>en-KE</language>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { "content-type": "application/rss+xml; charset=utf-8" },
  });
}
