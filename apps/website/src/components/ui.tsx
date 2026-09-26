import Link from "next/link";

export function Section({
  children,
  className = "",
  tinted = false,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  tinted?: boolean;
  id?: string;
}) {
  return (
    <section id={id} className={`${tinted ? "bg-paper-200/60" : ""} py-16 md:py-24 ${className}`}>
      <div className="container-page">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  center = false,
  dark = false,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  center?: boolean;
  /** For headings placed on navy bands. */
  dark?: boolean;
}) {
  return (
    <div className={`max-w-2xl ${center ? "mx-auto text-center" : ""}`}>
      <span className={`kicker ${center ? "justify-center" : ""} ${dark ? "!text-brand-300" : ""}`}>
        {eyebrow}
      </span>
      <h2
        className={`mt-3 font-display text-3xl font-extrabold tracking-tight text-balance md:text-4xl ${dark ? "text-white" : "text-ink-900"}`}
      >
        {title}
      </h2>
      {intro && (
        <p className={`mt-4 text-lg leading-relaxed ${dark ? "text-white/75" : ""}`}>{intro}</p>
      )}
    </div>
  );
}

const buttonStyles = {
  primary:
    "bg-brand-500 text-white hover:bg-brand-600 shadow-[0_10px_24px_-10px_rgba(27,122,180,0.55)]",
  secondary:
    "bg-white text-ink-900 border border-paper-300 hover:border-brand-400 hover:text-brand-600",
  ghost: "text-brand-600 hover:text-brand-700 hover:bg-brand-50",
  onDark:
    "bg-white text-brand-600 hover:bg-brand-50 shadow-[0_10px_24px_-12px_rgba(0,0,0,0.5)]",
} as const;

export function ButtonLink({
  href,
  children,
  variant = "primary",
  external = false,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: keyof typeof buttonStyles;
  external?: boolean;
  className?: string;
}) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-colors ${buttonStyles[variant]} ${className}`;
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}
