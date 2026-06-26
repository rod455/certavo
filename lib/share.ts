import { SITE_NAME } from './site';

/** WhatsApp deep link with a pre-filled message. */
export function whatsappLink(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/**
 * Try to share an actual image file (the result card) via the Web Share API —
 * this is what lets WhatsApp receive the image + the play link. Returns true
 * only if the image was shared; the caller falls back to a text link (wa.me)
 * otherwise (e.g. on most desktops, which don't support file sharing).
 */
export async function tryShareImage(
  imageUrl: string,
  text: string,
  title = SITE_NAME,
): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('canShare' in navigator)) return false;
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) return false;
    const blob = await res.blob();
    const file = new File([blob], 'certavo.png', {
      type: blob.type || 'image/png',
    });
    if (!navigator.canShare({ files: [file] })) return false;
    await navigator.share({ files: [file], text, title });
    return true;
  } catch {
    return false;
  }
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
