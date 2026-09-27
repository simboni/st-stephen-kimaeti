/* The two things that must happen before first paint, and one that happens
   just after. Inlined in <head> so there is no flash of the wrong theme and no
   render-blocking request.

   1. Apply the saved (or system) colour scheme to <html data-theme>.
   2. Mark <html class="js"> so the scroll-reveal CSS may hide things. Without
      this, a failed or slow script would leave the page blank.
   3. Track scroll position as a class on <html>, so the sticky header can go
      solid without React re-rendering on every scroll event.
   4. Once the DOM is ready, one IntersectionObserver reveals every
      [data-reveal] element — one observer for the whole page rather than a
      React client component per section.

   Written as a string on purpose: it has to run synchronously, ahead of React. */

const BOOT = `
(function () {
  var d = document.documentElement;
  try {
    var t = localStorage.getItem("theme");
    if (t !== "light" && t !== "dark") {
      t = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    d.setAttribute("data-theme", t);
  } catch (e) {
    d.setAttribute("data-theme", "light");
  }
  d.classList.add("js");

  function reveal() {
    var els = document.querySelectorAll("[data-reveal]:not(.is-in)");
    if (!("IntersectionObserver" in window)) {
      for (var i = 0; i < els.length; i++) els[i].classList.add("is-in");
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          entries[i].target.classList.add("is-in");
          io.unobserve(entries[i].target);
        }
      }
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    for (var j = 0; j < els.length; j++) io.observe(els[j]);
  }

  // The sticky header goes solid once the page has moved. Handled here with a
  // class on <html> rather than React state, so scrolling never re-renders.
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      d.classList.toggle("scrolled", window.scrollY > 12);
      ticking = false;
    });
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", reveal);
  } else {
    reveal();
  }
  // Re-scan after a client-side route change swaps the DOM.
  window.addEventListener("pageshow", reveal);
  document.addEventListener("ststephen:navigated", reveal);
})();
`;

export function Boot() {
  return <script dangerouslySetInnerHTML={{ __html: BOOT }} />;
}
