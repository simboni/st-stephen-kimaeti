const ITEMS = ["Faith", "Discipline", "Hard Work", "Social Transformation", "Learners Today, Leaders Tomorrow"];

/** Scrolling values band — a modern breather between sections. */
export function ValuesMarquee() {
  const row = (ariaHidden: boolean) => (
    <div className="flex shrink-0 items-center" aria-hidden={ariaHidden || undefined}>
      {ITEMS.map((item) => (
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
