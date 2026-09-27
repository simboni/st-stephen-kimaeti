/* The school's own badge, redrawn.

   The school sent a photograph of its crest: a low-resolution screenshot on a
   black field, with a phone clock burnt into the corner. Rather than ship that,
   this traces the same arms as vector paths — a quartered shield under a pale
   cross, charged with the S of Stephen, the open book, the five stars and the
   Latin cross, between two ribbons reading PRAY AND WORK and the school’s name.

   Colours are sampled from the original: field #86a3ff, pale #dcf4fe, gold
   #ecf254.

   Two variants, because a crest that reads at 200px is mud at 40px:
     <Crest />            full arms with both ribbons — footer, about page
     <Crest mark />       the shield alone — header, favicon, small chrome        */

const STAR =
  "M 0,-10 L 2.3,-3.98 L 8.66,-5 L 4.6,0 L 8.66,5 L 2.3,3.98 L 0,10 " +
  "L -2.3,3.98 L -8.66,5 L -4.6,0 L -8.66,-5 L -2.3,-3.98 Z";

/** Where the five stars sit in the lower-left quarter, and how big each is. */
const STARS = [
  { x: 110, y: 290, s: 1.45 },
  { x: 156, y: 310, s: 1.32 },
  { x: 104, y: 340, s: 1.26 },
  { x: 150, y: 362, s: 1.18 },
  { x: 126, y: 398, s: 1.08 },
];

export function Crest({
  className = "",
  mark = false,
  title = "St Stephen’s, Kimaeti — school crest",
}: {
  className?: string;
  /** Shield only, no ribbons. Use below about 64px. */
  mark?: boolean;
  title?: string;
}) {
  const id = mark ? "crest-mark" : "crest-full";
  return (
    <svg
      viewBox={mark ? "40 70 320 376" : "0 0 400 512"}
      role="img"
      aria-label={title}
      className={className}
    >
      <defs>
        <clipPath id={`${id}-shield`}>
          <path d="M72 96 H328 V258 C328 342 292 388 200 430 C108 388 72 342 72 258 Z" />
        </clipPath>
        <path id={`${id}-star`} d={STAR} />
      </defs>

      {!mark && (
        <>
          {/* Upper ribbon */}
          <path
            d="M30 96 C30 34 110 14 200 14 C290 14 370 34 370 96 L340 96 C340 52 274 40 200 40 C126 40 60 52 60 96 Z"
            fill="#dcf4fe"
            stroke="#0b3049"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path id={`${id}-top-text`} d="M48 90 C48 46 118 28 200 28 C282 28 352 46 352 90" fill="none" />
          <text
            fontSize="27"
            fontWeight="800"
            letterSpacing="2.5"
            fill="#0b3049"
            fontFamily="var(--font-display), Georgia, serif"
          >
            <textPath href={`#${id}-top-text`} startOffset="50%" textAnchor="middle">
              PRAY AND WORK
            </textPath>
          </text>

          {/* Lower ribbon */}
          <path
            d="M30 392 C30 454 110 486 200 486 C290 486 370 454 370 392 L340 392 C340 440 274 460 200 460 C126 460 60 440 60 392 Z"
            fill="#dcf4fe"
            stroke="#0b3049"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            id={`${id}-bottom-text`}
            d="M46 398 C46 446 118 472 200 472 C282 472 354 446 354 398"
            fill="none"
          />
          <text
            fontSize="21"
            fontWeight="800"
            letterSpacing="1.4"
            fill="#0b3049"
            fontFamily="var(--font-display), Georgia, serif"
          >
            <textPath href={`#${id}-bottom-text`} startOffset="50%" textAnchor="middle">
              ST STEPHEN · DAY &amp; BOARDING
            </textPath>
          </text>
        </>
      )}

      {/* Shield */}
      <path
        d="M60 84 H340 V262 C340 352 300 402 200 448 C100 402 60 352 60 262 Z"
        fill="#dcf4fe"
        stroke="#0b3049"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M72 96 H328 V258 C328 342 292 388 200 430 C108 388 72 342 72 258 Z"
        fill="#86a3ff"
      />

      <g clipPath={`url(#${id}-shield)`}>
        {/* The cross that quarters the field */}
        <path d="M182 96 H218 V430 H182 Z" fill="#dcf4fe" />
        <path d="M72 212 H328 V248 H72 Z" fill="#dcf4fe" />

        {/* Upper left — the S of Stephen */}
        <text
          x="128"
          y="185"
          textAnchor="middle"
          fontSize="112"
          fontWeight="800"
          fill="#ecf254"
          fontFamily="var(--font-display), Georgia, serif"
        >
          S
        </text>

        {/* Upper right — the open book */}
        <g>
          <path
            d="M272 132 C260 122 244 118 232 120 L232 178 C244 176 260 180 272 190 Z"
            fill="#dcf4fe"
            stroke="#5b73c4"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            d="M272 132 C284 122 300 118 312 120 L312 178 C300 176 284 180 272 190 Z"
            fill="#dcf4fe"
            stroke="#5b73c4"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <g stroke="#ecf254" strokeWidth="5" strokeLinecap="round" fill="none">
            <path d="M242 136 C252 136 260 140 265 145" />
            <path d="M242 150 C252 150 260 154 265 159" />
            <path d="M242 164 C252 164 260 168 265 173" />
            <path d="M302 136 C292 136 284 140 279 145" />
            <path d="M302 150 C292 150 284 154 279 159" />
            <path d="M302 164 C292 164 284 168 279 173" />
          </g>
        </g>

        {/* Lower left — five stars */}
        <g fill="#ecf254">
          {STARS.map((s) => (
            <use
              key={`${s.x}-${s.y}`}
              href={`#${id}-star`}
              transform={`translate(${s.x} ${s.y}) scale(${s.s})`}
            />
          ))}
        </g>

        {/* Lower right — the Latin cross */}
        <path d="M264 272 H282 V420 H264 Z" fill="#dcf4fe" />
        <path d="M238 300 H308 V318 H238 Z" fill="#dcf4fe" />
      </g>
    </svg>
  );
}
