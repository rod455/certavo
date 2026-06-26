/**
 * Idempotent content seeder. Populates themes → packs → questions in Supabase
 * from the versioned data in /data via the generators in lib/content.ts.
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (server-only).
 *
 *   pnpm seed
 *
 * Re-running is safe: rows are upserted on natural keys (theme slug, pack
 * slug, question id), so content is updated rather than duplicated.
 */
import { createClient } from '@supabase/supabase-js';
import { THEMES, type ThemeKey } from '../lib/content';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. ' +
      'Set them (e.g. in .env.local) before running pnpm seed.',
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

async function seed() {
  for (const key of Object.keys(THEMES) as ThemeKey[]) {
    const theme = THEMES[key];

    const { data: themeRow, error: themeErr } = await supabase
      .from('themes')
      .upsert(
        { slug: theme.slug, name: theme.name, icon: theme.icon, is_active: true },
        { onConflict: 'slug' },
      )
      .select('id')
      .single();
    if (themeErr || !themeRow) throw themeErr ?? new Error('theme upsert failed');
    console.log(`theme: ${theme.slug}`);

    for (const pack of theme.packs) {
      const { data: packRow, error: packErr } = await supabase
        .from('packs')
        .upsert(
          {
            theme_id: themeRow.id,
            slug: pack.slug,
            name: pack.name,
            is_active: true,
          },
          { onConflict: 'theme_id,slug' },
        )
        .select('id')
        .single();
      if (packErr || !packRow) throw packErr ?? new Error('pack upsert failed');

      const questions = pack.build(`${theme.slug}:${pack.slug}`).map((q) => ({
        // Deterministic UUID-free natural key: store the stable string id in a
        // dedicated column so re-seeds upsert instead of duplicate.
        external_id: q.id,
        pack_id: packRow.id,
        media_type: q.media_type,
        media_value: q.media_value,
        prompt: q.prompt,
        options: q.options,
        correct_index: q.correct_index,
        difficulty: q.difficulty,
        option_media: q.option_media ?? null,
      }));

      const { error: qErr } = await supabase
        .from('questions')
        .upsert(questions, { onConflict: 'external_id' });
      if (qErr) throw qErr;
      console.log(`  pack: ${pack.slug} (${questions.length} questions)`);
    }
  }
  console.log('Seed complete.');
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
