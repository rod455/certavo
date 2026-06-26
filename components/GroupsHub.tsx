'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { isBackendConfigured } from '@/lib/supabase/client';
import { getNick, setNick } from '@/lib/anon';
import { createGroup, joinGroup, myGroups, type MyGroup } from '@/lib/groups';
import { Link } from '@/i18n/routing';

export function GroupsHub() {
  const t = useTranslations('groups');
  const router = useRouter();
  const [nick, setNickInput] = useState('');
  const [groups, setGroups] = useState<MyGroup[]>([]);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setNickInput(getNick());
    if (isBackendConfigured()) myGroups().then(setGroups);
  }, []);

  function ensureNick(): boolean {
    if (!nick.trim()) {
      setError(t('nickNeeded'));
      return false;
    }
    setNick(nick.trim());
    return true;
  }

  async function handleCreate() {
    if (!name.trim() || !ensureNick()) return;
    setBusy(true);
    setError('');
    const res = await createGroup(name.trim());
    setBusy(false);
    if (res.ok && res.code) router.push(`/g/${res.code}`);
    else setError(t('unavailable'));
  }

  async function handleJoin() {
    if (!code.trim() || !ensureNick()) return;
    setBusy(true);
    setError('');
    const res = await joinGroup(code.trim());
    setBusy(false);
    if (res.ok && res.code) router.push(`/g/${res.code}`);
    else setError(t('notFound'));
  }

  if (!isBackendConfigured()) {
    return <p className="text-navy-soft">{t('unavailable')}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-sans text-2xl font-bold">{t('title')}</h1>
        <p className="text-navy-soft">{t('subtitle')}</p>
      </header>

      {/* nick */}
      <input
        value={nick}
        onChange={(e) => setNickInput(e.target.value)}
        maxLength={24}
        placeholder={t('nickPlaceholder')}
        className="min-h-[44px] w-full rounded-card border-2 border-navy/20 bg-paper px-3 font-sans"
      />

      {/* create */}
      <section className="rounded-card border-2 border-navy/15 bg-paper-2 p-4">
        <h2 className="mb-2 font-sans font-bold">{t('create')}</h2>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            placeholder={t('groupName')}
            className="min-h-[44px] w-full rounded-card border-2 border-navy/20 bg-paper px-3 font-sans"
          />
          <button onClick={handleCreate} disabled={busy} className="btn-primary shrink-0">
            {t('create')}
          </button>
        </div>
      </section>

      {/* join */}
      <section className="rounded-card border-2 border-navy/15 bg-paper-2 p-4">
        <h2 className="mb-2 font-sans font-bold">{t('joinByCode')}</h2>
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={6}
            placeholder={t('codePlaceholder')}
            className="min-h-[44px] w-full rounded-card border-2 border-navy/20 bg-paper px-3 font-mono uppercase"
          />
          <button onClick={handleJoin} disabled={busy} className="btn-ghost shrink-0">
            {t('join')}
          </button>
        </div>
      </section>

      {error && <p className="text-sm text-error">{error}</p>}

      {/* my groups */}
      <section>
        <h2 className="mb-2 font-sans font-bold">{t('myGroups')}</h2>
        {groups.length === 0 ? (
          <p className="text-sm text-navy-soft">{t('empty')}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {groups.map((g) => (
              <li key={g.id}>
                <Link
                  href={`/g/${g.code}`}
                  className="flex items-center justify-between rounded-card border-2 border-navy/15 bg-paper-2 p-4 shadow-tactile-sm"
                >
                  <span className="flex items-center gap-2 font-sans font-bold">
                    <span aria-hidden>{g.icon ?? '🏆'}</span>
                    {g.name}
                  </span>
                  <span className="font-mono text-sm text-navy-soft">
                    {t('members', { n: g.member_count })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
