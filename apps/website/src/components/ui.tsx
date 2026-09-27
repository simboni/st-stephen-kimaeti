import Link from "next/link";

/* The primitives every page is built from. Deliberately few: a section, a
   section header, a button and a figure. Everything else is Tailwind on the
   page itself, so a layout can be read in one place. */

export function Section({
  children,
  className = "",
  tone = "plain",
  id,
  as: Tag = "section",
  size = "normal",
}: {
  children: React.ReactNode;
  className?: string;
  /** plain = page ground · tint = warm band · band = always-dark band */
  tone?: "plain" | "tint" | "band";
  id?: string;
  as?: "section" | "div";
  size?: "normal" | "tight" | "loose";
}) {
  const pad =
    size === "tight" ? "py-12 md:py-16" : size === "loose" ? "py-20 md:py-32" : "py-16 md:py-24";
  const tones = {
    plain: "",
    tint: "bg-surface-2",
    band: "bg-band text-band-text-2",
  };
  return (
    <Tag id={id} className={`${tones[tone]} ${pad} ${className}`}>
      <div className="container-page">{children}</div>
    </Tag>
  );
}

/**
 * A section header in the editorial style: an index number, a rule, a tracked
 * label, then a large serif line.
 */
export function SectionHead({
  index,
  eyebrow,
  title,
  lede,
  align = "left",
  onBand = false,
  className = "",
}: {
  /** Two digits, as a magazine numbers its sections. Omit to hide. */
  index?: string;
  eyebrow: string;
  title: React.ReactNode;
  lede?: string;
  align?: "left" | "center";
  onBand?: boolean;
  className?: string;
}) {
  return (
    <header
      className={`${align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"} ${className}`}
    >
      <p
        className={`eyebrow ${align === "center" ? "justify-center" : ""} ${
          onBand ? "!text-band-text-2" : ""
        }`}
      >
        {index && (
          <span className={onBand ? "text-band-accent" : "text-second"}>{index}</span>
        )}
        {eyebrow}
      </p>
      <h2
        className={`display mt-4 text-[2rem] leading-[1.05] sm:text-[2.6rem] md:text-[3.1rem] ${
          onBand ? "!text-band-text" : ""
        }`}
      >
        {title}
      </h2>
      {lede && (
        <p className={`lede mt-5 ${onBand ? "!text-band-text-2" : ""}`}>{lede}</p>
      )}
    </header>
  );
}

const variants = {
  primary: "btn-primary",
  outline: "btn-outline",
  onBand: "btn-on-band",
  ghostBand: "btn-ghost-band",
} as const;

export function ButtonLink({
  href,
  children,
  variant = "primary",
  external = false,
  className = "",
  download,
}: {
  href: string;
  children: React.ReactNode;
  variant?: keyof typeof variants;
  external?: boolean;
  className?: string;
  download?: boolean | string;
}) {
  const cls = `btn ${variants[variant]} ${className}`;
  if (external || download) {
    return (
      <a
        href={href}
        className={cls}
        download={download}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
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

/** A statistic, set as a display numeral over a small label. */
export function Stat({
  value,
  label,
  onBand = false,
  size = "md",
}: {
  value: string | number;
  label: string;
  onBand?: boolean;
  size?: "md" | "lg";
}) {
  return (
    <div>
      <p
        className={`numeral ${size === "lg" ? "text-5xl md:text-6xl" : "text-4xl md:text-5xl"} ${
          onBand ? "!text-band-text" : ""
        }`}
      >
        {value}
      </p>
      <p
        className={`mt-2 text-xs font-semibold uppercase tracking-[0.14em] ${
          onBand ? "text-band-text-2" : "text-text-3"
        }`}
      >
        {label}
      </p>
    </div>
  );
}

/** Wraps a block so the boot script's observer fades it in on scroll.
 *
 *  `as` matters: inside a <ul> or <ol> this has to *be* the <li>, because a
 *  <div> between the list and its items breaks the list semantics that screen
 *  readers rely on to announce "list, 4 items". */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li";
}) {
  return (
    <Tag
      data-reveal=""
      className={className}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
