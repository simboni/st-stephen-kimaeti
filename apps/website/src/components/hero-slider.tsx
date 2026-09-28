"use client";

import { useEffect, useRef, useState } from "react";
import { photo } from "@/lib/photos";
import { Photo } from "@/components/photo";
import { PauseIcon, PlayIcon } from "@/components/icons";

/**
 * The photographs behind the hero, crossfading on a timer.
 *
 * Decisions worth knowing about:
 *
 * · The text on top never moves. Only the picture behind it changes, so
 *   nothing reflows and the headline is readable from the first frame.
 *
 * · Only the slides that are needed exist in the DOM. `loading="lazy"` is no
 *   help here — every slide sits at inset-0, so the browser counts all five as
 *   "in the viewport" and fetches the lot, about a megabyte, before the
 *   headline has painted. Instead the component mounts slide 0, adds slide 1 a
 *   couple of seconds later, and thereafter keeps exactly one slide ahead of
 *   the one showing. A parent on 3G pays for one photograph up front.
 *
 * · WCAG 2.2.2 requires a way to stop anything that moves by itself for more
 *   than five seconds. Hence the pause button. It also stops on hover, on
 *   keyboard focus anywhere in the hero, and while the tab is in the
 *   background — no point burning a phone battery animating a page nobody is
 *   looking at.
 *
 * · Under prefers-reduced-motion it does not run at all: one photograph, no
 *   timer, no controls.
 *
 * · The images are decorative — the headline is the content — so the whole
 *   layer is aria-hidden and a screen reader is never told the picture
 *   changed.
 */

const INTERVAL = 6500;

export function HeroSlider({ slides }: { slides: string[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  /** How many slides are in the DOM. Only ever grows. */
  const [mounted, setMounted] = useState(1);
  const holdRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Bring in the second slide once the page has settled, so it is ready for
  // the first transition without competing with the first paint.
  useEffect(() => {
    if (reduced || slides.length < 2) return;
    const id = setTimeout(() => setMounted((m) => Math.max(m, 2)), 2500);
    return () => clearTimeout(id);
  }, [reduced, slides.length]);

  // Thereafter stay exactly one ahead of whatever is showing. Skipped at
  // index 0, or it would fire on the first render and undo the delay above.
  useEffect(() => {
    if (index === 0) return;
    setMounted((m) => Math.max(m, Math.min(slides.length, index + 2)));
  }, [index, slides.length]);

  useEffect(() => {
    if (reduced || paused || slides.length < 2) return;

    const id = setInterval(() => {
      // holdRef covers hover, focus and tab visibility without re-rendering
      // the component every time the pointer crosses the hero.
      if (!holdRef.current && !document.hidden) {
        setIndex((i) => (i + 1) % slides.length);
      }
    }, INTERVAL);
    return () => clearInterval(id);
  }, [reduced, paused, slides.length]);

  const shown = reduced ? [slides[0]] : slides.slice(0, mounted);

  return (
    <>
      <div
        aria-hidden
        className="absolute inset-0"
        onMouseEnter={() => (holdRef.current = true)}
        onMouseLeave={() => (holdRef.current = false)}
      >
        {shown.map((slug, i) => (
          <div
            key={slug}
            className="absolute inset-0 transition-opacity duration-[1400ms] ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none"
            style={{ opacity: i === index ? 1 : 0 }}
          >
            <Photo
              src={slug}
              sizes="100vw"
              fill
              priority={i === 0}
              imgClassName={i === index ? "drift" : undefined}
            />
          </div>
        ))}
      </div>

      {/* Controls. Hidden entirely when there is nothing moving to control. */}
      {!reduced && slides.length > 1 && (
        <div
          className="absolute bottom-6 right-5 z-10 flex items-center gap-3 md:right-8"
          onFocusCapture={() => (holdRef.current = true)}
          onBlurCapture={() => (holdRef.current = false)}
        >
          <ul className="flex items-center gap-2">
            {slides.map((slug, i) => (
              <li key={slug}>
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-current={i === index ? "true" : undefined}
                  className={`block h-2.5 rounded-full transition-all duration-300 ${
                    i === index ? "w-7 bg-white" : "w-2.5 bg-white/45 hover:bg-white/70"
                  }`}
                >
                  <span className="sr-only">
                    Show photograph {i + 1} of {slides.length}: {photo(slug).caption}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/25 text-white backdrop-blur-sm transition-colors hover:bg-black/45"
          >
            {paused ? <PlayIcon className="h-4 w-4" /> : <PauseIcon className="h-4 w-4" />}
            <span className="sr-only">
              {paused ? "Start the photographs changing again" : "Stop the photographs changing"}
            </span>
          </button>
        </div>
      )}
    </>
  );
}
