import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { school, site } from "@/lib/site";
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

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: site.title,
    template: `%s | ${school.shortName}`,
  },
  description: site.description,
  keywords: [
    "Holy Cross Bulimbo",
    "Holy Cross Junior School",
    "Holy Cross Infant School",
    "schools in Kakamega",
    "CBC school Kenya",
    "private school Bulimbo",
    "junior school Kakamega",
  ],
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: siteUrl,
    siteName: school.name,
    title: site.title,
    description: site.description,
    images: [{ url: "/campus-front.jpg", width: 1600, height: 1200, alt: school.name }],
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
  address: {
    "@type": "PostalAddress",
    streetAddress: "P.O. Box 134",
    postalCode: "50109",
    addressLocality: "Bulimbo",
    addressRegion: "Kakamega County",
    addressCountry: "KE",
  },
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
