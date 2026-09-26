export function PageHero({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
}) {
  return (
    <div className="relative overflow-hidden bg-navy-900">
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage: "url(/campus-front.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center 35%",
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-navy-900/70 via-navy-900/60 to-navy-900"
        aria-hidden
      />
      <div className="container-page relative py-16 md:py-20">
        <span className="kicker !text-brand-300">{eyebrow}</span>
        <h1 className="mt-3 max-w-3xl font-display text-4xl font-extrabold tracking-tight text-white text-balance md:text-5xl">
          {title}
        </h1>
        {intro && (
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/75">{intro}</p>
        )}
      </div>
    </div>
  );
}
