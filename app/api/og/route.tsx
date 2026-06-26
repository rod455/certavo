import { ImageResponse } from 'next/og';
import { SITE_NAME, SHARE_HOST } from '@/lib/site';

export const runtime = 'edge';

const TAGLINE: Record<string, string> = {
  pt: 'O quiz visual de todo dia',
  en: 'The daily visual quiz',
  es: 'El quiz visual de cada día',
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const n = searchParams.get('n');
  const locale = searchParams.get('locale') ?? 'pt';
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
          background: '#F6F2EA',
          color: '#1C2B3A',
          fontFamily: 'sans-serif',
          padding: 80,
        }}
      >
        <div style={{ fontSize: 96, fontWeight: 800, letterSpacing: -2 }}>
          {SITE_NAME}
        </div>
        <div style={{ fontSize: 36, color: '#36485A', marginTop: 8 }}>
          {tagline}
        </div>
        {n ? (
          <div
            style={{
              marginTop: 48,
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              background: '#1E94AB',
              color: '#F6F2EA',
              padding: '20px 40px',
              borderRadius: 20,
              fontSize: 48,
              fontWeight: 700,
            }}
          >
            <span>🟩🟩⬛🟩🟩</span>
            <span>#{n}</span>
          </div>
        ) : null}
        <div style={{ marginTop: 48, fontSize: 28, color: '#36485A' }}>
          {SHARE_HOST}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
