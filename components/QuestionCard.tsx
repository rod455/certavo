import type { Question } from '@/lib/types';
import { Flag } from './Flag';

/** Renders any question's stem (prompt + optional media) — theme-agnostic. */
export function QuestionCard({
  question,
  prompt,
}: {
  question: Question;
  prompt: string;
}) {
  const media =
    question.media_type === 'flag' && question.media_value ? (
      <Flag code={question.media_value} className="mx-auto h-24 w-36 sm:h-28 sm:w-44" />
    ) : question.media_type === 'emoji' && question.media_value ? (
      <span className="text-6xl sm:text-7xl" role="img" aria-hidden>
        {question.media_value}
      </span>
    ) : question.media_type === 'image' && question.media_value ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={question.media_value} alt="" className="mx-auto max-h-32 rounded-md" />
    ) : null;

  return (
    <div className="rounded-card border-2 border-navy/15 bg-paper-2 p-5 text-center shadow-tactile-sm">
      {/* Only reserve space for media when there is media (text-only themes
          like World Cup shouldn't show a big empty box). */}
      {media && (
        <div className="mb-4 flex min-h-[112px] items-center justify-center">
          {media}
        </div>
      )}
      <h2 className="text-balance font-sans text-lg font-bold text-navy sm:text-xl">
        {prompt}
      </h2>
    </div>
  );
}
