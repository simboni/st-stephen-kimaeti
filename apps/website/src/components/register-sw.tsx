"use client";

import { useEffect } from "react";

/**
 * Registers the service worker that makes the site installable and readable
 * offline.
 *
 * This is not a gimmick here. Network in Kimaeti ward drops; a parent who
 * opened the fee structure on Tuesday should still be able to read it on
 * Thursday in a place with no signal. The worker caches pages as they are
 * visited and serves them from the cache when a request fails.
 *
 * Registration is deferred to `load` so it never competes with the first
 * render, and it is skipped entirely off HTTPS (except localhost) where
 * service workers are not permitted anyway.
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    const register = () => {
      navigator.serviceWorker.register(`${base}/sw.js`, { scope: `${base}/` }).catch(() => {
        /* An unregistered worker costs nothing — the site works without it. */
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
