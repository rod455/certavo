// Edge Function: ingest-pack  (ROADMAP — prepared, not wired to automation)
//
// Protected ingestion endpoint for future AI-generated packs (e.g. an n8n
// workflow). Requires the INGEST_API_KEY secret in the `x-ingest-key` header.
// It upserts a pack and its questions under an existing theme. The automation
// itself is intentionally NOT built yet — this is the secure landing point.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, x-ingest-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: cors });
  }

  const key = req.headers.get('x-ingest-key');
  if (!key || key !== Deno.env.get('INGEST_API_KEY')) {
    return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), {
      status: 401,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    // body: { theme_slug, pack: { slug, name }, questions: [...] }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } },
    );

    const { data: theme } = await supabase
      .from('themes')
      .select('id')
      .eq('slug', body.theme_slug)
      .single();
    if (!theme) {
      return new Response(JSON.stringify({ ok: false, error: 'theme_not_found' }), {
        status: 404,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const { data: pack, error: packErr } = await supabase
      .from('packs')
      .upsert(
        { theme_id: theme.id, slug: body.pack.slug, name: body.pack.name },
        { onConflict: 'theme_id,slug' },
      )
      .select('id')
      .single();
    if (packErr || !pack) throw packErr ?? new Error('pack_upsert_failed');

    const rows = (body.questions ?? []).map((q: Record<string, unknown>) => ({
      ...q,
      pack_id: pack.id,
    }));
    const { error: qErr } = await supabase
      .from('questions')
      .upsert(rows, { onConflict: 'external_id' });
    if (qErr) throw qErr;

    return new Response(JSON.stringify({ ok: true, inserted: rows.length }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
