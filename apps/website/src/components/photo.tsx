import { photo, type Photo as PhotoData } from "@/lib/photos";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function photoSrc(p: PhotoData, width: number) {
  return `${base}/photos/${p.slug}-${width}.webp`;
}

/**
 * One of the school's photographs, served as responsive WebP.
 *
 * The variants were exported at build time by scratchpad/photos/process.mjs,
 * so there is no image server to run and nothing to optimise at request time —
 * the browser picks a width from `sizes` and downloads only that file.
 *
 * While it downloads, the 20px inline placeholder from the index is painted as
 * a stretched background, which holds the right colours in place and keeps the
 * layout still. No JavaScript is involved.
 */
export function Photo({
  src,
  sizes,
  /** CSS aspect-ratio for the frame, e.g. "4/3". Omit to use the true ratio. */
  ratio,
  /** Fill the nearest positioned ancestor instead of holding a ratio — for
   *  full-bleed backdrops behind a gradient and text. */
  fill = false,
  alt,
  priority = false,
  className = "",
  imgClassName = "",
}: {
  src: string | PhotoData;
  sizes: string;
  ratio?: string;
  fill?: boolean;
  /** Overrides the index's alt text when the context calls for different words. */
  alt?: string;
  /** Set on the one image above the fold; everything else lazy-loads. */
  priority?: boolean;
  className?: string;
  imgClassName?: string;
}) {
  const p = typeof src === "string" ? photo(src) : src;
  const widest = p.widths[p.widths.length - 1];

  return (
    <span
      className={`block overflow-hidden bg-paper-200 ${
        fill ? "absolute inset-0 h-full w-full" : ""
      } ${className}`}
      style={{
        ...(fill ? {} : { aspectRatio: ratio ?? `${p.width}/${p.height}` }),
        backgroundImage: `url(${p.blur})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element --
          next/image is deliberately not used here: this site is a static
          export with images.unoptimized, where <Image> emits one source and
          no srcset. The variants below were generated ahead of time. */}
      <img
        src={photoSrc(p, widest)}
        srcSet={p.widths.map((w) => `${photoSrc(p, w)} ${w}w`).join(", ")}
        sizes={sizes}
        width={p.width}
        height={p.height}
        alt={alt ?? p.alt}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : undefined}
        className={`h-full w-full object-cover ${
          p.focus === "north" ? "object-[center_25%]" : "object-center"
        } ${imgClassName}`}
      />
    </span>
  );
}
