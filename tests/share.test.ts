import { describe, it, expect } from 'vitest';
import { whatsappLink } from '@/lib/share';

describe('share', () => {
  it('builds an encoded WhatsApp link', () => {
    expect(whatsappLink('a b')).toBe('https://wa.me/?text=a%20b');
  });

  it('encodes newlines and the share URL', () => {
    const link = whatsappLink('Acertei 8/10\nhttps://certavo.app/d/1');
    expect(link).toContain('%0A');
    expect(link).toContain('https%3A%2F%2Fcertavo.app%2Fd%2F1');
  });
});
