'use client';

import { useEffect } from 'react';

/** Registers the offline service worker in production only. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== 'production' ||
      typeof navigator === 'undefined' ||
      !('serviceWorker' in navigator)
    ) {
      return;
    }

    // If a controller already exists, a later controller change means a NEW
    // service worker activated (a deploy) → reload once to run fresh code, so
    // users never get stuck on a stale cached version. (Skipped on first visit,
    // when there's no controller yet, to avoid a needless reload.)
    if (navigator.serviceWorker.controller) {
      let reloading = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloading) return;
        reloading = true;
        window.location.reload();
      });
    }

    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => reg.update().catch(() => {}))
      .catch(() => {});
  }, []);
  return null;
}
