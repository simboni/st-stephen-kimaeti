import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { school, site } from "@/lib/site";
import { photo } from "@/lib/photos";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppButton } from "@/components/whatsapp-button";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = `https://${site.domain}`;
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** The card people see when the site is shared on WhatsApp or Facebook. */
const ogPhoto = photo("learners-on-the-field");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: site.title,
    template: `%s | ${school.shortName}`,
  },
  description: site.description,
  keywords: [
    "St Stephen's Kimaeti",
    "St Stephen Primary School Kimaeti",
    "schools in Bungoma",
    "boarding school Bungoma",
    "junior school Bungoma",
    "CBC school Kenya",
    "Brothers of St Charles Lwanga school",
  ],
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: siteUrl,
    siteName: school.name,
    title: site.title,
    description: site.description,
    images: [
      {
        url: `${basePath}/photos/${ogPhoto.slug}-${ogPhoto.widths[ogPhoto.widths.length - 1]}.webp`,
        width: ogPhoto.width,
        height: ogPhoto.height,
        alt: ogPhoto.alt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
  },
  robots: { index: true, follow: true },
};

const schoolSchema = {
  "@context": "https://schema.org",
  "@type": "School",
  name: school.name,
  slogan: school.motto,
  email: school.email,
  telephone: school.phoneHref,
  url: siteUrl,
  foundingDate: String(school.founded),
  address: {
    "@type": "PostalAddress",
    streetAddress: "P.O. Box 93",
    postalCode: "50200",
    addressLocality: "Kimaeti, Bungoma",
    addressRegion: "Bungoma County",
    addressCountry: "KE",
  },
  numberOfStudents: 525,
  parentOrganization: { "@type": "Organization", name: school.sponsor },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {/* Marks JS availability before paint; scroll-reveal styles key off it. */}
        <script
          dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schoolSchema) }}
        />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <WhatsAppButton />
      </body>
    </html>
  );
}
