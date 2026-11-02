import { useEffect, useState } from 'react';
import FlipPanel from './FlipPanel';
import type { Task } from '../lib/tasks';

type Props = {
  remaining: number;
  running: boolean;
  onToggleRun: () => void;
  onReset: () => void;
  /** both side panels are folded away — take the room */
  maximised: boolean;
  /** the task focus sessions are being logged onto, if any */
  focusTask: Task | null;
  onOpenTasks: () => void;
};

/**
 * The split-flap readout. Purely presentational — the ticker itself lives in
 * useCountdown at the shell so the countdown survives page changes.
 */
export default function Clock({
  remaining,
  running,
  onToggleRun,
  onReset,
  maximised,
  focusTask,
  onOpenTasks,
}: Props) {
  const [now, setNow] = useState(() => new Date());

  /* live date line */
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;
  const finished = remaining === 0;

  /* keyboard shortcuts */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        onToggleRun();
      }
      if (e.key.toLowerCase() === 'r') onReset();
      if (e.key.toLowerCase() === 't') onOpenTasks();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onToggleRun, onReset, onOpenTasks]);

  const dateLine = now.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const weekday = now.toLocaleDateString(undefined, { weekday: 'short' });

  const panelH = maximised ? 'min(58vh,26vw)' : 'min(38vh,19vw)';
  const glyph = maximised ? 'min(24vh,10.5vw)' : 'min(16vh,8vw)';

  return (
    <section className="flex h-full flex-col items-center justify-between bg-black px-6 py-8 sm:px-10 [@media(max-height:560px)]:px-4 [@media(max-height:560px)]:py-3">
      {/* top */}
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-end">
          <span
            className={[
              'rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider transition-colors duration-300',
              finished
                ? 'bg-emerald-500/15 text-emerald-300'
                : running
                  ? 'bg-red-500/15 text-red-300'
                  : 'bg-white/5 text-neutral-500',
            ].join(' ')}
          >
            {finished ? 'Done' : running ? 'Running' : 'Paused'}
          </span>
        </div>

        <p className="mt-8 text-center text-sm text-neutral-500 [@media(max-height:560px)]:mt-3 [@media(max-height:560px)]:text-xs">
          {dateLine} <span className="text-neutral-600">{weekday}</span>
        </p>

        {focusTask && (
          <p
            className="mt-2 flex items-center justify-center gap-2 text-xs text-neutral-500"
            title={`Focusing on ${focusTask.text}`}
          >
            <span
              aria-hidden
              className="size-1.5 shrink-0 rounded-full"
              style={{ background: focusTask.color }}
            />
            <span className="max-w-[70%] truncate">
              Focusing on “{focusTask.text}”
            </span>
          </p>
        )}
      </div>

      {/* digits */}
      <div className="flex w-full flex-1 flex-col items-center justify-center">
        <div
          className="flex items-center justify-center gap-2 [@media(max-height:560px)]:gap-1.5 sm:gap-5"
          style={
            {
              '--panel-h': panelH,
              '--glyph-size': glyph,
            } as React.CSSProperties
          }
        >
          <FlipPanel value={hours} label="Hours" />
          <FlipPanel value={minutes} label="Minutes" />
          <FlipPanel value={seconds} label="Seconds" />
        </div>
      </div>

      {/* footer */}
      <div className="w-full max-w-2xl text-center">
        <p className="text-[0.65rem] text-neutral-700 [@media(max-height:560px)]:hidden">
          space — start / pause · r — reset · t — tasks
        </p>
      </div>
    </section>
  );
}
