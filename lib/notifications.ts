'use client';

import { getAnonId } from './anon';
import { myGroups } from './groups';
import { listChampionships, loadChampionship } from './championships';

export type NotifKind = 'champion' | 'final' | 'eliminated' | 'turn';

export type Notification = {
  id: string;
  kind: NotifKind;
  champ: string;
  champId: string;
  /** round number (1-based) for the "eliminated" notice */
  round?: number;
};

const SEEN_KEY = 'certavo:notif-seen';

/** IDs the user already dismissed/opened, so the unread dot can clear. */
function readSeen(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    return new Set(JSON.parse(window.localStorage.getItem(SEEN_KEY) ?? '[]'));
  } catch {
    return new Set();
  }
}

export function markAllSeen(ids: string[]): void {
  if (typeof window === 'undefined') return;
  const merged = new Set([...readSeen(), ...ids]);
  window.localStorage.setItem(SEEN_KEY, JSON.stringify([...merged]));
}

/**
 * Derive the player's notifications from their groups' knockout championships:
 * - champion: they won
 * - final: they reached the final (and it isn't decided yet)
 * - eliminated: they were knocked out
 * - turn: a round is live today and they're still alive → play now
 *
 * Bounded for performance: a few groups × a few championships each.
 */
export async function getNotifications(): Promise<Notification[]> {
  const me = getAnonId();
  if (!me) return [];

  const groups = (await myGroups()).slice(0, 8);
  const lists = await Promise.all(groups.map((g) => listChampionships(g.code)));
  const champs = lists
    .flat()
    .filter((c) => c.format === 'knockout')
    .slice(0, 24);

  const views = await Promise.all(
    champs.map(async (c) => {
      try {
        return { champ: c, view: await loadChampionship(c) };
      } catch {
        return null;
      }
    }),
  );

  const out: Notification[] = [];
  for (const entry of views) {
    if (!entry || entry.view.format !== 'knockout') continue;
    const { champ, view } = entry;
    const s = view.state;

    if (s.winner?.anon === me) {
      out.push({ id: `champion:${champ.id}`, kind: 'champion', champ: champ.name, champId: champ.id });
      continue;
    }
    const out_ = s.eliminated.find((e) => e.anon === me);
    if (out_) {
      out.push({
        id: `eliminated:${champ.id}`,
        kind: 'eliminated',
        champ: champ.name,
        champId: champ.id,
        round: out_.round + 1,
      });
      continue;
    }
    const aliveMe = s.alive.some((a) => a.anon === me);
    if (!aliveMe) continue;

    if (s.final && s.alive.length === 2) {
      out.push({ id: `final:${champ.id}`, kind: 'final', champ: champ.name, champId: champ.id });
      continue;
    }
    // alive and a round is live today → it's your turn to play
    if (s.rounds.some((r) => r.live)) {
      out.push({ id: `turn:${champ.id}`, kind: 'turn', champ: champ.name, champId: champ.id });
    }
  }
  return out;
}

export function unreadCount(notifs: Notification[]): number {
  const seen = readSeen();
  return notifs.filter((n) => !seen.has(n.id)).length;
}
