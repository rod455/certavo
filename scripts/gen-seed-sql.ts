/**
 * Generates supabase/seed.sql — a no-credentials way to populate themes/packs/
 * questions: paste it into the Supabase SQL editor. Idempotent (upserts on
 * natural keys). Run: pnpm tsx scripts/gen-seed-sql.ts
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { THEMES, type ThemeKey } from '../lib/content';

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
const jb = (o: unknown) => `${q(JSON.stringify(o))}::jsonb`;

const lines: string[] = [
  '-- Certavo content seed. Paste into the Supabase SQL editor. Idempotent.',
  'begin;',
  '',
];

// themes
const themeRows = (Object.keys(THEMES) as ThemeKey[]).map((k) => {
  const th = THEMES[k];
  return `  (${q(th.slug)}, ${jb(th.name)}, ${q(th.icon)})`;
});
lines.push(
  'insert into themes (slug, name, icon) values',
  themeRows.join(',\n') +
    '\non conflict (slug) do update set name = excluded.name, icon = excluded.icon;',
  '',
);

// packs
const packRows: string[] = [];
for (const k of Object.keys(THEMES) as ThemeKey[]) {
  for (const p of THEMES[k].packs) {
    packRows.push(`  (${q(THEMES[k].slug)}, ${q(p.slug)}, ${jb(p.name)})`);
  }
}
lines.push(
  'insert into packs (theme_id, slug, name)',
  'select t.id, x.slug, x.name from (values',
  packRows.join(',\n'),
  ') as x(theme_slug, slug, name)',
  'join themes t on t.slug = x.theme_slug',
  'on conflict (theme_id, slug) do update set name = excluded.name;',
  '',
);

// questions
const qRows: string[] = [];
for (const k of Object.keys(THEMES) as ThemeKey[]) {
  for (const p of THEMES[k].packs) {
    for (const item of p.build(`${THEMES[k].slug}:${p.slug}`)) {
      const media = item.media_value == null ? 'null::text' : q(item.media_value);
      const om = item.option_media ? jb(item.option_media) : 'null::jsonb';
      qRows.push(
        `  (${q(item.id)}, ${q(p.slug)}, ${q(item.media_type)}, ${media}, ${jb(
          item.prompt,
        )}, ${jb(item.options)}, ${om}, ${item.correct_index}, ${item.difficulty})`,
      );
    }
  }
}
lines.push(
  'insert into questions (external_id, pack_id, media_type, media_value, prompt, options, option_media, correct_index, difficulty)',
  'select x.external_id, p.id, x.media_type, x.media_value, x.prompt, x.options, x.option_media, x.correct_index, x.difficulty',
  'from (values',
  qRows.join(',\n'),
  ') as x(external_id, pack_slug, media_type, media_value, prompt, options, option_media, correct_index, difficulty)',
  'join packs p on p.slug = x.pack_slug',
  'on conflict (external_id) do update set',
  '  pack_id = excluded.pack_id, media_type = excluded.media_type, media_value = excluded.media_value,',
  '  prompt = excluded.prompt, options = excluded.options, option_media = excluded.option_media,',
  '  correct_index = excluded.correct_index, difficulty = excluded.difficulty;',
  '',
  'commit;',
  '',
);

const out = join(process.cwd(), 'supabase', 'seed.sql');
writeFileSync(out, lines.join('\n'));
console.log(`Wrote ${out} (${qRows.length} questions)`);
