/* PLACEHOLDER CREST.

   The school has not yet supplied a logo file. Rather than ship a borrowed
   one, this draws a simple roundel in the uniform's own colours — sky-blue
   shirt, maroon tie — with the cross of the Brothers of St Charles Lwanga and
   the founding year.

   When the school sends its badge, drop it in public/logo.png and swap this
   component out for an <Image>. Nothing else needs to change: every page uses
   <Crest /> and never the file directly. */

export function Crest({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="St Stephen's Kimaeti crest"
      className={className}
    >
      <circle cx="32" cy="32" r="31" fill="var(--color-brand-500)" />
      <circle
        cx="32"
        cy="32"
        r="27.5"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.55"
        strokeWidth="1.5"
      />
      {/* The cross */}
      <path d="M29.6 12h4.8v10.4H44v4.8h-9.6V44h-4.8V27.2H20v-4.8h9.6z" fill="#fff" />
      {/* A maroon band across the foot, as on the tie */}
      <path
        d="M10 44.5h44a27.6 27.6 0 0 1-22 14.9A27.6 27.6 0 0 1 10 44.5Z"
        fill="var(--color-maroon-500)"
      />
      <text
        x="32"
        y="55.4"
        textAnchor="middle"
        fontSize="8.5"
        fontWeight="800"
        fill="#fff"
        fontFamily="var(--font-display), sans-serif"
        letterSpacing="0.5"
      >
        2006
      </text>
    </svg>
  );
}
