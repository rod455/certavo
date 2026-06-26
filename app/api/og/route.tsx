import { ImageResponse } from 'next/og';
import { SITE_NAME, SHARE_HOST } from '@/lib/site';

export const runtime = 'edge';

const TAGLINE: Record<string, string> = {
  pt: 'O quiz visual de todo dia',
  en: 'The daily visual quiz',
  es: 'El quiz visual de cada día',
};

const PAPER = '#F6F2EA';
const NAVY = '#1C2B3A';
const TEAL = '#1E94AB';
const NAVY_SOFT = '#36485A';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const kind = searchParams.get('kind');
  const locale = searchParams.get('locale') ?? 'pt';

  // ---- Shareable result card (sent as an image on WhatsApp) ----
  if (kind === 'result') {
    const title = searchParams.get('title') ?? SITE_NAME;
    const headline = searchParams.get('h') ?? '';
    const sub = searchParams.get('sub') ?? '';
    const message = searchParams.get('m') ?? '';
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: PAPER,
            color: NAVY,
            fontFamily: 'sans-serif',
            padding: 72,
          }}
        >
          <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: -1 }}>
            {SITE_NAME}
          </div>
          <div style={{ fontSize: 34, color: NAVY_SOFT, marginTop: 6 }}>
            {title}
          </div>
          <div
            style={{
              fontSize: 220,
              fontWeight: 800,
              color: TEAL,
              lineHeight: 1.05,
              margin: '18px 0 4px',
            }}
          >
            {headline}
          </div>
          {sub ? (
            <div style={{ fontSize: 32, color: NAVY_SOFT }}>{sub}</div>
          ) : null}
          {message ? (
            <div
              style={{
                fontSize: 36,
                textAlign: 'center',
                marginTop: 36,
                maxWidth: 820,
                color: NAVY,
              }}
            >
              {message}
            </div>
          ) : null}
          <div style={{ marginTop: 44, fontSize: 28, color: NAVY_SOFT }}>
            {SHARE_HOST}
          </div>
        </div>
      ),
      { width: 1080, height: 1080 },
    );
  }

  // ---- Default: daily link-preview card (Open Graph) ----
  const n = searchParams.get('n');
  const edition = searchParams.get('t');
  const tagline = TAGLINE[locale] ?? TAGLINE.pt;

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: PAPER,
          color: NAVY,
          fontFamily: 'sans-serif',
          padding: 80,
        }}
      >
        <div style={{ fontSize: 96, fontWeight: 800, letterSpacing: -2 }}>
          {SITE_NAME}
        </div>
        <div style={{ fontSize: 36, color: NAVY_SOFT, marginTop: 8 }}>
          {tagline}
        </div>
        {n ? (
          <div
            style={{
              marginTop: 48,
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              background: TEAL,
              color: PAPER,
              padding: '20px 44px',
              borderRadius: 20,
              fontSize: 44,
              fontWeight: 700,
            }}
          >
            <span>#{n}</span>
            {edition ? <span>· {edition}</span> : null}
          </div>
        ) : null}
        <div style={{ marginTop: 48, fontSize: 28, color: NAVY_SOFT }}>
          {SHARE_HOST}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
