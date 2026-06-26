'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { THEMES } from '@/lib/content';
import {
  getGroupMembers,
  createChampionship,
  type Member,
  type Format,
  type RoundMode,
} from '@/lib/championships';

const ROUND_MODES: RoundMode[] = ['sudden_death', 'time_attack'];

const THEME_KEYS = Object.keys(THEMES);

export function ChampionshipCreate({ code }: { code: string }) {
  const t = useTranslations('champ');
  const tt = useTranslations('themes');
  const tm = useTranslations('modes');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [format, setFormat] = useState<Format>('points');
  const [roundMode, setRoundMode] = useState<RoundMode>('sudden_death');
  const [theme, setTheme] = useState(THEME_KEYS[0]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && members.length === 0) {
      getGroupMembers(code).then((m) => {
        setMembers(m);
        setSelected(new Set(m.map((x) => x.anon_id)));
      });
    }
  }, [open, code, members.length]);

  function toggle(anon: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(anon)) n.delete(anon);
      else n.add(anon);
      return n;
    });
  }

  async function handleCreate() {
    const picked = members.filter((m) => selected.has(m.anon_id));
    if (picked.length < 2) {
      setError(t('needPlayers'));
      return;
    }
    setBusy(true);
    setError('');
    const res = await createChampionship({
      code,
      name: name.trim() || t('title'),
      format,
      theme: format === 'knockout' ? theme : null,
      roundMode,
      members: picked,
    });
    setBusy(false);
    if (res.ok && res.id) router.push(`/c/${res.id}`);
    else setError(t('unavailable'));
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-ghost w-full">
        + {t('create')}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-card border-2 border-navy/15 bg-paper-2 p-4">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={40}
        placeholder={t('name')}
        className="min-h-[44px] w-full rounded-card border-2 border-navy/20 bg-paper px-3 font-sans"
      />

      <div className="flex gap-2">
        {(['points', 'knockout'] as Format[]).map((f) => (
          <button
            key={f}
            onClick={() => setFormat(f)}
            className={`btn flex-1 text-sm ${
              format === f ? 'bg-navy text-paper shadow-none' : 'bg-paper text-navy'
            }`}
          >
            {t(f)}
          </button>
        ))}
      </div>
      <p className="text-xs text-navy-soft">
        {format === 'points' ? t('pointsDesc') : t('knockoutDesc')}
      </p>

      {format === 'knockout' && (
        <>
          <div>
            <p className="mb-1 text-sm font-bold">{t('roundMode')}</p>
            <div className="flex gap-2">
              {ROUND_MODES.map((m) => (
                <button
                  key={m}
                  onClick={() => setRoundMode(m)}
                  className={`btn flex-1 text-sm ${
                    roundMode === m ? 'bg-navy text-paper shadow-none' : 'bg-paper text-navy'
                  }`}
                >
                  {tm(m)}
                </button>
              ))}
            </div>
          </div>
          <label className="text-sm">
            {t('finalTheme')}
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="mt-1 min-h-[44px] w-full rounded-card border-2 border-navy/20 bg-paper px-2"
            >
              {THEME_KEYS.map((k) => (
                <option key={k} value={k}>
                  {tt(k as never)}
                </option>
              ))}
            </select>
          </label>
        </>
      )}

      <div>
        <p className="mb-1 text-sm font-bold">{t('selectParticipants')}</p>
        <div className="flex flex-col gap-1">
          {members.map((m) => (
            <label key={m.anon_id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selected.has(m.anon_id)}
                onChange={() => toggle(m.anon_id)}
              />
              {m.nick ?? 'Anon'}
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-error">{error}</p>}
      <button onClick={handleCreate} disabled={busy} className="btn-primary w-full">
        {t('start')}
      </button>
    </div>
  );
}
