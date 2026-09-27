"use client";

import { useEffect, useRef, useState } from "react";
import { photos, type Photo as PhotoData, type PhotoCategory } from "@/lib/photos";
import { Photo, photoSrc } from "@/components/photo";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "@/components/icons";

/**
 * The picture gallery: filters across the top, a masonry-ish grid beneath, and
 * a lightbox.
 *
 * Accessibility is the point of most of the code here. The lightbox is a modal
 * dialog: it traps focus, closes on Escape, moves with the arrow keys, restores
 * focus to the thumbnail that opened it, and announces each change to a screen
 * reader. Without JavaScript the grid still renders in full and every image is
 * a link to its own file.
 */

const FILTERS: { key: PhotoCategory | "all"; label: string }[] = [
  { key: "all", label: "Everything" },
  { key: "academics", label: "The science fair" },
  { key: "earlyyears", label: "Early Years" },
  { key: "faith", label: "Prayer" },
  { key: "music", label: "Music & dance" },
  { key: "sport", label: "Sport" },
  { key: "trips", label: "Trips" },
  { key: "community", label: "The shamba" },
  { key: "boarding", label: "Boarding" },
  { key: "campus", label: "The compound" },
  { key: "staff", label: "Staff" },
  { key: "life", label: "Faces" },
];

export function Gallery() {
  const [filter, setFilter] = useState<PhotoCategory | "all">("all");
  const [openAt, setOpenAt] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const shown = filter === "all" ? photos : photos.filter((p) => p.cat === filter);
  const current: PhotoData | null = openAt === null ? null : (shown[openAt] ?? null);

  function close() {
    setOpenAt(null);
    openerRef.current?.focus();
  }

  const count = shown.length;

  useEffect(() => {
    if (openAt === null) return;

    const shut = () => {
      setOpenAt(null);
      openerRef.current?.focus();
    };
    const step = (delta: number) =>
      setOpenAt((i) => (i === null ? null : (i + delta + count) % count));

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        shut();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        step(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(-1);
      } else if (e.key === "Tab") {
        // Keep Tab inside the dialog while it is open.
        const focusables = dialogRef.current?.querySelectorAll<HTMLElement>("button");
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Move focus into the dialog so the keyboard lands somewhere sensible.
    dialogRef.current?.querySelector<HTMLElement>("button")?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [openAt, count]);

  /** Changing the filter invalidates the index the lightbox is holding, so the
   *  two always move together. */
  function choose(key: PhotoCategory | "all") {
    setFilter(key);
    setOpenAt(null);
  }

  return (
    <>
      {/* Filters */}
      <div className="border-b border-line bg-surface-2 no-print">
        <div className="container-page">
          <div
            role="group"
            aria-label="Filter the photographs"
            className="flex gap-2 overflow-x-auto py-4"
            tabIndex={0}
          >
            {FILTERS.map((f) => {
              const count =
                f.key === "all" ? photos.length : photos.filter((p) => p.cat === f.key).length;
              if (count === 0) return null;
              const on = filter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => choose(f.key)}
                  aria-pressed={on}
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                    on
                      ? "border-accent bg-accent text-on-accent"
                      : "border-line bg-surface-3 text-text-2 hover:border-line-strong hover:text-text"
                  }`}
                >
                  {f.label}
                  <span
                    className={`ml-2 border-l pl-2 tabular-nums ${
                      on ? "border-on-accent/30 text-on-accent" : "border-line text-text-3"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="container-page py-12 md:py-16">
        <p className="sr-only" role="status">
          Showing {shown.length} photograph{shown.length === 1 ? "" : "s"}.
        </p>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
          {shown.map((p, i) => (
            <li key={p.slug}>
              <button
                type="button"
                onClick={(e) => {
                  openerRef.current = e.currentTarget;
                  setOpenAt(i);
                }}
                className="group block w-full text-left"
                aria-haspopup="dialog"
              >
                <Photo
                  src={p}
                  sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 46vw"
                  ratio="4/5"
                  className="rounded-lg"
                  imgClassName="transition-transform duration-500 group-hover:scale-[1.04]"
                />
                <span className="mt-2.5 block text-[13px] font-medium leading-snug text-text-2 group-hover:text-text">
                  {p.caption}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Lightbox */}
      {current && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={`${current.caption}. Photograph ${openAt! + 1} of ${shown.length}.`}
          className="fixed inset-0 z-[60] flex flex-col bg-black/92 backdrop-blur-sm"
        >
          <div className="flex shrink-0 items-center justify-between gap-4 p-4">
            <p className="text-sm font-semibold text-white/70 tabular-nums">
              {openAt! + 1} / {shown.length}
            </p>
            <button
              type="button"
              onClick={close}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/25 text-white transition-colors hover:bg-white/15"
              aria-label="Close"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="flex min-h-0 flex-1 items-center gap-2 px-2 md:gap-4 md:px-4">
            <button
              type="button"
              onClick={() => setOpenAt((i) => (i === null ? null : (i - 1 + count) % count))}
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/25 text-white transition-colors hover:bg-white/15"
              aria-label="Previous photograph"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>

            <figure className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4">
              {/* Plain <img>: the lightbox always wants the largest variant. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={current.slug}
                src={photoSrc(current, current.widths[current.widths.length - 1])}
                alt={current.alt}
                width={current.width}
                height={current.height}
                className="min-h-0 w-auto max-w-full flex-1 rounded-lg object-contain"
              />
              <figcaption className="max-w-2xl shrink-0 text-center text-sm text-white/75">
                {current.caption}
              </figcaption>
            </figure>

            <button
              type="button"
              onClick={() => setOpenAt((i) => (i === null ? null : (i + 1) % count))}
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/25 text-white transition-colors hover:bg-white/15"
              aria-label="Next photograph"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>

          <p className="shrink-0 p-4 text-center text-xs text-white/45">
            Arrow keys to move · Escape to close
          </p>
        </div>
      )}
    </>
  );
}
