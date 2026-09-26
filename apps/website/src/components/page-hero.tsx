import { Photo } from "@/components/photo";

/** The banner at the top of every page but the home page: one of the school's
 *  own photographs, dimmed under a gradient so the heading stays legible. */
export function PageHero({
  eyebrow,
  title,
  intro,
  photo = "school-grounds",
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  /** A slug from lib/photos. */
  photo?: string;
}) {
  return (
    <div className="relative isolate overflow-hidden bg-navy-900">
      <Photo src={photo} sizes="100vw" fill imgClassName="opacity-45" />
      <div
        className="absolute inset-0 bg-gradient-to-b from-navy-950/85 via-navy-900/75 to-navy-900"
        aria-hidden
      />
      <div className="container-page relative py-16 md:py-24">
        <span className="kicker !text-brand-300">{eyebrow}</span>
        <h1 className="mt-3 max-w-3xl font-display text-4xl font-extrabold tracking-tight text-white text-balance md:text-5xl">
          {title}
        </h1>
        {intro && <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/75">{intro}</p>}
      </div>
    </div>
  );
}
