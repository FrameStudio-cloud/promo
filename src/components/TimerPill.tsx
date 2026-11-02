import type { Task } from '../lib/tasks';
import { formatClock } from '../lib/duration';

type Props = {
  remaining: number;
  running: boolean;
  focusTask: Task | null;
  onToggleRun: () => void;
  onOpenTimer: () => void;
};

/**
 * Compact live readout for the tasks page header: pause/play, the countdown,
 * and the focused task. Clicking the readout jumps back to the clock.
 */
export default function TimerPill({
  remaining,
  running,
  focusTask,
  onToggleRun,
  onOpenTimer,
}: Props) {
  const finished = remaining === 0;

  return (
    <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1">
      <button
        type="button"
        onClick={onToggleRun}
        aria-label={running ? 'Pause the timer' : finished ? 'Run the timer again' : 'Start the timer'}
        title={running ? 'Pause' : finished ? 'Run again' : 'Start'}
        className="grid size-7 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-950 transition-all duration-150 hover:bg-white active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      >
        {running ? (
          <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
            <path d="M4 2.5v7M8 2.5v7" />
          </svg>
        ) : (
          <svg viewBox="0 0 12 12" className="size-3" fill="currentColor" aria-hidden>
            <path d="M3.5 2.2 10 6l-6.5 3.8z" />
          </svg>
        )}
      </button>

      <button
        type="button"
        onClick={onOpenTimer}
        aria-label="Open the timer"
        title="Open the timer"
        className="flex min-w-0 items-center gap-2 rounded-full px-2.5 py-1 transition-colors hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
      >
        <span
          aria-hidden
          className={[
            'size-1.5 shrink-0 rounded-full transition-colors duration-300',
            finished
              ? 'bg-emerald-400'
              : running
                ? 'animate-pulse bg-red-400'
                : 'bg-neutral-500',
          ].join(' ')}
        />
        <span className="font-mono text-xs text-neutral-200 tabular-nums">
          {formatClock(remaining)}
        </span>
        {focusTask && !focusTask.done && (
          <span className="hidden max-w-[8rem] truncate text-xs text-neutral-500 sm:inline sm:max-w-[11rem]">
            · {focusTask.text}
          </span>
        )}
      </button>
    </div>
  );
}
