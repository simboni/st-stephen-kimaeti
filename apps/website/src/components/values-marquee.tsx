import { school } from "@/lib/site";

/** Scrolling values band — a breather between sections, carrying the motto and
 *  the six values the school itself listed on its requirements form. */
export function ValuesMarquee() {
  const items = [school.motto, ...school.values];

  const row = (ariaHidden: boolean) => (
    <div className="flex shrink-0 items-center" aria-hidden={ariaHidden || undefined}>
      {items.map((item) => (
        <span key={item} className="flex items-center">
          <span className="px-6 font-display text-lg font-extrabold uppercase tracking-[0.14em] text-white md:text-xl">
            {item}
          </span>
          <span className="text-2xl text-white/50" aria-hidden>
            ✦
          </span>
        </span>
      ))}
    </div>
  );

  return (
    <div className="overflow-hidden bg-gradient-to-r from-brand-600 via-brand-500 to-brand-600 py-4">
      <div className="marquee-track">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
