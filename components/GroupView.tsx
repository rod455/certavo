'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { isBackendConfigured } from '@/lib/supabase/client';
import { getNick, setNick } from '@/lib/anon';
import { whatsappLink, shareOrCopy } from '@/lib/share';
import {
  getGroup,
  getGroupLeaderboard,
  joinGroup,
  type GroupSummary,
  type GroupRow,
} from '@/lib/groups';

export function GroupView({ code }: { code: string }) {
  const t = useTranslations('groups');
  const locale = useLocale();
  const [group, setGroup] = useState<GroupSummary | null>(null);
  const [rows, setRows] = useState<GroupRow[]>([]);
  const [nick, setNickInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(() => {
    getGroup(code).then(setGroup);
    getGroupLeaderboard(code).then(setRows);
  }, [code]);

  useEffect(() => {
    setNickInput(getNick());
    if (isBackendConfigured()) refresh();
  }, [refresh]);

  const inviteUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/${locale}/g/${code}`
      : '';
  const inviteText = `${t('inviteText', { name: group?.name ?? '' })}\n${inviteUrl}`;

  async function handleJoin() {
    if (!nick.trim()) return;
    setNick(nick.trim());
    setBusy(true);
    await joinGroup(code);
    setBusy(false);
    refresh();
  }

  async function handleCopy() {
    const kind = await shareOrCopy(inviteText);
    if (kind === 'copied') {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }

  if (!isBackendConfigured()) return <p className="text-navy-soft">{t('unavailable')}</p>;
  if (!group) return <p className="p-6 text-center font-mono text-navy-soft">…</p>;
  if (!group.ok) return <p className="text-navy-soft">{t('notFound')}</p>;

  return (
    <div className="flex flex-col gap-5">
      <header className="text-center">
        <div className="text-3xl" aria-hidden>
          {group.icon ?? '🏆'}
        </div>
        <h1 className="font-sans text-2xl font-bold">{group.name}</h1>
        <p className="font-mono text-sm text-navy-soft">
          {t('members', { n: group.memberCount ?? 0 })} · {group.code}
        </p>
      </header>

      {!group.isMember && (
        <div className="rounded-card border-2 border-navy/15 bg-paper-2 p-4">
          <div className="flex gap-2">
            <input
              value={nick}
              onChange={(e) => setNickInput(e.target.value)}
              maxLength={24}
              placeholder={t('nickPlaceholder')}
              className="min-h-[44px] w-full rounded-card border-2 border-navy/20 bg-paper px-3 font-sans"
            />
            <button onClick={handleJoin} disabled={busy} className="btn-primary shrink-0">
              {t('joinThis')}
            </button>
          </div>
        </div>
      )}

      {/* invite */}
      <div className="flex flex-col gap-2">
        <a
          href={whatsappLink(inviteText)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn w-full border-transparent font-bold text-white shadow-tactile"
          style={{ background: '#25D366' }}
        >
          💬 {t('invite')}
        </a>
        <button onClick={handleCopy} className="btn-ghost w-full">
          {copied ? '✓' : t('copyLink')}
        </button>
      </div>

      {/* weekly ranking */}
      <section>
        <h2 className="mb-2 font-mono text-xs uppercase tracking-wide text-navy-soft">
          {t('weeklyRanking')}
        </h2>
        <ol className="overflow-hidden rounded-card border-2 border-navy/15">
          {rows.map((row) => (
            <li
              key={row.rank}
              className="flex items-center justify-between border-b border-navy/10 bg-paper-2 px-4 py-3 last:border-0"
            >
              <span className="flex items-center gap-3">
                <span className="w-5 font-mono font-bold">{row.rank}</span>
                <span>{row.name}</span>
              </span>
              <span className="font-mono font-bold text-teal">
                {row.points} {t('points')}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <Link href="/" className="btn-primary w-full text-center">
        {t('playNow')}
      </Link>
    </div>
  );
}
