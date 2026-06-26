import { SITE_NAME } from './site';

/** WhatsApp deep link with a pre-filled message. */
export function whatsappLink(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/** Try the Web Share API, fall back to clipboard. Returns 'shared' | 'copied'. */
export async function shareOrCopy(
  text: string,
  title = SITE_NAME,
): Promise<'shared' | 'copied'> {
  if (typeof navigator !== 'undefined' && 'share' in navigator) {
    try {
      await navigator.share({ title, text });
      return 'shared';
    } catch {
      /* user cancelled or share failed — fall through to copy */
    }
  }
  await navigator.clipboard.writeText(text);
  return 'copied';
}
