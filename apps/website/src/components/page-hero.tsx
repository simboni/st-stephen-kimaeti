import Link from "next/link";
import { Photo } from "@/components/photo";
import { ChevronRightIcon } from "@/components/icons";

/**
 * The banner at the top of every page but the home page: one of the school's
 * own photographs under a gradient, with a breadcrumb, an index number and a
 * display line.
 */
export function PageHero({
  index,
  eyebrow,
  title,
  lede,
  photo = "school-grounds",
  crumb,
}: {
  index?: string;
  eyebrow: string;
  title: string;
  lede?: string;
  /** A slug from lib/photos. */
  photo?: string;
  /** Trail above the heading, home implied. */
  crumb?: { href: string; label: string }[];
}) {
  return (
    <div className="relative isolate overflow-hidden bg-band">
      <Photo src={photo} sizes="100vw" fill imgClassName="opacity-35 drift" priority />
      <div
        className="absolute inset-0 bg-gradient-to-b from-band/75 via-band/80 to-band"
        aria-hidden
      />

      <div className="container-page relative py-14 md:py-20">
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-band-text-2">
            <li>
              <Link href="/" className="transition-colors hover:text-band-text">
                Home
              </Link>
            </li>
            {(crumb ?? []).map((c) => (
              <li key={c.href} className="flex items-center gap-1.5">
                <ChevronRightIcon className="h-3 w-3 opacity-50" />
                <Link href={c.href} className="transition-colors hover:text-band-text">
                  {c.label}
                </Link>
              </li>
            ))}
            <li className="flex items-center gap-1.5">
              <ChevronRightIcon className="h-3 w-3 opacity-50" />
              <span className="text-band-accent">{eyebrow}</span>
            </li>
          </ol>
        </nav>

        <p className="eyebrow !text-band-text-2">
          {index && <span className="text-band-accent">{index}</span>}
          {eyebrow}
        </p>
        <h1 className="display mt-4 max-w-4xl !text-band-text text-[2.4rem] leading-[1.03] sm:text-[3.2rem] md:text-[4rem]">
          {title}
        </h1>
        {lede && <p className="lede mt-6 max-w-2xl !text-band-text-2">{lede}</p>}
      </div>
    </div>
  );
}
