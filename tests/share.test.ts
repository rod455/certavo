import { describe, it, expect } from 'vitest';
import { resultGrid, dailyShareText, whatsappLink } from '@/lib/share';
import type { AnswerRecord } from '@/lib/types';

const answers: AnswerRecord[] = [
  { questionId: '1', chosenIndex: 0, correct: true, msTaken: 10 },
  { questionId: '2', chosenIndex: 1, correct: false, msTaken: 10 },
  { questionId: '3', chosenIndex: 0, correct: true, msTaken: 10 },
];

describe('share', () => {
  it('renders a green/black emoji grid', () => {
    expect(resultGrid(answers)).toBe('🟩⬛🟩');
  });

  it('wraps rows at the given width', () => {
    const five = Array(7).fill(answers[0]);
    expect(resultGrid(five, 5).split('\n')).toHaveLength(2);
  });

  it('daily share text contains the challenge number and link', () => {
    const text = dailyShareText({
      challengeNumber: 128,
      answers,
      correctCount: 2,
      total: 3,
    });
    expect(text).toContain('#128');
    expect(text).toContain('/d/128');
    expect(text).toContain('2/3');
  });

  it('builds an encoded WhatsApp link', () => {
    const link = whatsappLink('a b');
    expect(link).toBe('https://wa.me/?text=a%20b');
  });
});
