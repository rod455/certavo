'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { isBackendConfigured } from '@/lib/supabase/client';
import {
  getNotifications,
  markAllSeen,
  unreadCount,
  type Notification,
} from '@/lib/notifications';

function line(t: ReturnType<typeof useTranslations>, n: Notification): string {
  switch (n.kind) {
    case 'champion':
      return t('champion', { champ: n.champ });
    case 'final':
      return t('final', { champ: n.champ });
    case 'eliminated':
      return t('eliminated', { champ: n.champ, n: n.round ?? 1 });
    case 'turn':
      return t('turn', { champ: n.champ });
  }
}

export function NotificationBell() {
  const t = useTranslations('notif');
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isBackendConfigured()) return;
    let alive = true;
    getNotifications()
      .then((n) => {
        if (!alive) return;
        setItems(n);
        setUnread(unreadCount(n));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!isBackendConfigured()) return null;

  function toggle() {
    setOpen((v) => {
      const next = !v;
      if (next && items.length) {
        markAllSeen(items.map((i) => i.id));
        setUnread(0);
      }
      return next;
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={t('title')}
        className="relative flex h-8 w-8 items-center justify-center rounded-full hover:bg-navy/5"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 font-mono text-[10px] font-bold text-paper">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-72 overflow-hidden rounded-card border-2 border-navy/15 bg-paper shadow-lg">
          <p className="border-b border-navy/10 px-3 py-2 font-mono text-xs uppercase tracking-wide text-navy-soft">
            {t('title')}
          </p>
          {items.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-navy-soft">{t('empty')}</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {items.map((n) => (
                <li key={n.id} className="border-b border-navy/5 last:border-0">
                  <Link
                    href={`/c/${n.champId}`}
                    onClick={() => setOpen(false)}
                    className="block px-3 py-2.5 text-sm hover:bg-navy/5"
                  >
                    {line(t, n)}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
