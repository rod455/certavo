'use client';

import { useEffect } from 'react';

/** Registers the offline service worker in production only. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV === 'production' &&
      typeof navigator !== 'undefined' &&
      'serviceWorker' in navigator
    ) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);
  return null;
}
