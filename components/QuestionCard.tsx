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
  return (
    <div className="rounded-card border-2 border-navy/15 bg-paper-2 p-5 text-center shadow-tactile-sm">
      <div className="flex min-h-[120px] items-center justify-center">
        {question.media_type === 'flag' && question.media_value ? (
          <Flag code={question.media_value} className="mx-auto h-28 w-44" />
        ) : question.media_type === 'emoji' && question.media_value ? (
          <span className="text-7xl" role="img" aria-hidden>
            {question.media_value}
          </span>
        ) : question.media_type === 'image' && question.media_value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={question.media_value}
            alt=""
            className="mx-auto max-h-32 rounded-md"
          />
        ) : null}
      </div>
      <h2 className="mt-4 text-balance font-sans text-xl font-bold text-navy">
        {prompt}
      </h2>
    </div>
  );
}
