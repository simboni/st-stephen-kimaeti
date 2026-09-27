import type { Metadata } from "next";
import { photos } from "@/lib/photos";
import { school } from "@/lib/site";
import { PageHero } from "@/components/page-hero";
import { Gallery } from "@/components/gallery";

export const metadata: Metadata = {
  title: "Gallery",
  description: `${photos.length} photographs of life at ${school.shortName} — the science fair, open-air Mass, the music festival, the dormitories, the shamba, sport, and a trip to Kisumu International Airport.`,
};

export default function GalleryPage() {
  return (
    <>
      <PageHero
        index="05"
        eyebrow="Gallery"
        title="An ordinary term at St Stephen’s"
        lede={`${photos.length} photographs from the school’s own camera — no models, no stock, nothing staged for a brochure.`}
        photo="cultural-dancers"
      />
      <Gallery />
    </>
  );
}
