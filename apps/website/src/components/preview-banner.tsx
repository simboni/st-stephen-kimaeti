/**
 * A strip across the top of the preview build, so nobody mistakes it for the
 * live site.
 *
 * It matters for two reasons. The content is not signed off — the news posts
 * and term dates are placeholders, and the school has not yet confirmed its
 * own address. And the pages carry photographs of identifiable children, which
 * should not be circulating as though the school had published them.
 *
 * Rendered only when NEXT_PUBLIC_SITE_PREVIEW=1. The real build never sees it.
 */
export function PreviewBanner() {
  return (
    <div className="bg-maroon-700 text-white no-print">
      <p className="container-page py-2 text-center text-[13px] leading-snug">
        <b className="font-semibold">Preview.</b> Not the school&rsquo;s live
        website — some content is still placeholder, and this page asks search
        engines not to index it.
      </p>
    </div>
  );
}
