import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { school, site } from "@/lib/site";
import { photo } from "@/lib/photos";
import { Boot } from "@/components/boot";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { RegisterServiceWorker } from "@/components/register-sw";

/* Two families, and a hard eye on the bytes: most parents here are on a phone
   over 3G, where every 100 KB of font is a second of blank text.

   Inter ships as one variable file covering 400–700, which is smaller than the
   four static weights it replaces. */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

/* Fraunces carries the display type — a high-contrast serif with the slightly
   hand-painted quality of the signwriting on the school’s own walls, which is
   where this look came from.

   Only the optical-size axis is requested. Its SOFT and WONK axes are lovely
   and cost about 80 KB, which is not a trade worth making here. */
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"],
  style: ["normal", "italic"],
});

const siteUrl = `https://${site.domain}`;
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** The card people see when the site is shared on WhatsApp or Facebook. */
const ogPhoto = photo("learners-on-the-field");
const ogUrl = `${basePath}/photos/${ogPhoto.slug}-${ogPhoto.widths[ogPhoto.widths.length - 1]}.webp`;

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf9f5" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1216" },
  ],
  colorScheme: "light dark",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: site.title,
    template: `%s · ${school.shortName}`,
  },
  description: site.description,
  applicationName: school.shortName,
  manifest: `${basePath}/manifest.webmanifest`,
  appleWebApp: { capable: true, title: school.shortName, statusBarStyle: "default" },
  keywords: [
    "St Stephen’s Kimaeti",
    "St Stephen Primary School Kimaeti",
    "schools in Bungoma",
    "boarding school Bungoma",
    "junior school Bungoma",
    "CBC school Kenya",
    "Brothers of St Charles Lwanga school",
  ],
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": `${siteUrl}/news.xml` },
  },
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: siteUrl,
    siteName: school.name,
    title: site.title,
    description: site.description,
    images: [{ url: ogUrl, width: ogPhoto.width, height: ogPhoto.height, alt: ogPhoto.alt }],
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
    images: [ogUrl],
  },
  robots: { index: true, follow: true },
};

/* Structured data, rich enough that a search result can carry the school's
   phone number, address and opening hours without anyone clicking through. */
const schoolSchema = {
  "@context": "https://schema.org",
  "@type": "School",
  "@id": `${siteUrl}/#school`,
  name: school.name,
  alternateName: school.shortName,
  slogan: `${school.mottoLatin} — ${school.motto}`,
  description: site.description,
  email: school.email,
  telephone: school.phoneHref,
  url: siteUrl,
  logo: `${siteUrl}${basePath}/icon.svg`,
  image: `${siteUrl}${ogUrl}`,
  foundingDate: String(school.founded),
  numberOfStudents: 525,
  parentOrganization: { "@type": "Organization", name: school.sponsor },
  address: {
    "@type": "PostalAddress",
    streetAddress: "P.O. Box 93",
    postalCode: "50200",
    addressLocality: "Kimaeti, Bungoma",
    addressRegion: "Bungoma County",
    addressCountry: "KE",
  },
  areaServed: "Bungoma County, Kenya",
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    opens: "07:30",
    closes: "17:00",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-KE" className={`${inter.variable} ${fraunces.variable} h-full`}>
      <head>
        <Boot />
      </head>
      <body className="flex min-h-full flex-col bg-surface">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schoolSchema) }}
        />
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <WhatsAppButton />
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
