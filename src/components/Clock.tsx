import { useCallback, useEffect, useRef, useState } from 'react';
import FlipPanel from './FlipPanel';
import { formatDuration } from '../lib/duration';
import DurationInput from './DurationInput';

type Props = {
  /** session length in minutes */
  duration: number;
  setDuration: (m: number) => void;
  remaining: number;
  setRemaining: (s: number) => void;
  running: boolean;
  setRunning: (v: boolean) => void;
  notify: (msg: string, kind?: 'success' | 'info' | 'warning' | 'error') => void;
};

export default function Clock({
  duration,
  setDuration,
  remaining,
  setRemaining,
  running,
  setRunning,
  notify,
}: Props) {
  const [now, setNow] = useState(() => new Date());
  const audioCtx = useRef<AudioContext | null>(null);

  /* The ticker must not restart whenever `remaining` changes, so it reads the
     latest value through a ref that a sibling effect keeps up to date. */
  const remainingRef = useRef(remaining);
  const setRemainingRef = useRef(setRemaining);

  useEffect(() => {
    remainingRef.current = remaining;
  }, [remaining]);

  useEffect(() => {
    setRemainingRef.current = setRemaining;
  }, [setRemaining]);

  /* three short tones when the session ends */
  function beep() {
    try {
      const Ctx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      audioCtx.current ??= new Ctx();
      const ctx = audioCtx.current;
      void ctx.resume?.().catch(() => undefined);

      [0, 0.22, 0.44].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 660;
        gain.gain.setValueAtTime(0.0001, ctx.currentTime + offset);
        gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + offset + 0.18);
        osc.connect(gain).connect(ctx.destination);
        osc.start(ctx.currentTime + offset);
        osc.stop(ctx.currentTime + offset + 0.2);
      });
    } catch {
      /* audio blocked — ignore */
    }
  }

  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;
  const finished = remaining === 0;

  /* ticker — derived from a wall-clock deadline so it never drifts */
  useEffect(() => {
    if (!running) return;

    const endsAt = Date.now() + remainingRef.current * 1000;
    const tick = () =>
      setRemainingRef.current(
        Math.max(0, Math.round((endsAt - Date.now()) / 1000)),
      );

    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [running]);

  /* live date line */
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  /* reach zero: stop, ring once, stay put — no auto-advance */
  useEffect(() => {
    if (!running || remaining !== 0) return;

    setRunning(false);
    beep();
    notify(`Time's up — ${formatDuration(duration)} done`, 'success');
  }, [remaining, running, duration, notify, setRunning]);

  /* start / pause — pressing start at zero runs the duration again */
  const toggle = useCallback(() => {
    if (remainingRef.current === 0) setRemaining(duration * 60);
    setRunning(!running);
  }, [running, duration, setRemaining, setRunning]);

  const reset = useCallback(() => {
    setRemaining(duration * 60);
    setRunning(false);
    notify('Timer reset', 'info');
  }, [duration, setRemaining, setRunning, notify]);

  /* keyboard shortcuts */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        toggle();
      }
      if (e.key.toLowerCase() === 'r') reset();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle, reset]);

  const dateLine = now.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const weekday = now.toLocaleDateString(undefined, { weekday: 'short' });

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
      </div>

      {/* digits */}
      <div className="flex w-full flex-1 flex-col items-center justify-center">
        <div
          className={[
            'flex items-center justify-center gap-2 sm:gap-5',
            // panels are sized from whichever runs out first: height or width,
            // so a short-but-wide phone landscape fits three of them
            '[--panel-h:min(38vh,19vw)]',
            '[--glyph-size:min(16vh,8vw)]',
          ].join(' ')}
        >
          <FlipPanel value={hours} label="Hours" />
          <FlipPanel value={minutes} label="Minutes" />
          <FlipPanel value={seconds} label="Seconds" />
        </div>
      </div>

      {/* controls */}
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-center gap-3 [@media(max-height:560px)]:gap-2">
          <button
            type="button"
            onClick={reset}
            className="rounded-full border border-white/10 px-5 py-2.5 text-sm text-neutral-400 transition-colors hover:border-white/25 hover:text-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 [@media(max-height:560px)]:px-4 [@media(max-height:560px)]:py-1.5 [@media(max-height:560px)]:text-xs"
          >
            Reset
          </button>

          <button
            type="button"
            onClick={toggle}
            className="min-w-28 rounded-full bg-neutral-100 px-8 py-2.5 text-sm font-semibold text-neutral-950 transition-all hover:bg-white active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 [@media(max-height:560px)]:min-w-24 [@media(max-height:560px)]:px-6 [@media(max-height:560px)]:py-1.5 [@media(max-height:560px)]:text-xs"
          >
            {running ? 'Pause' : finished ? 'Run again' : 'Start'}
          </button>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 [@media(max-height:560px)]:mt-3">
          <span className="text-[0.7rem] uppercase tracking-widest text-neutral-600 [@media(max-height:560px)]:hidden">
            Duration
          </span>
          <DurationInput
            minutes={duration}
            onApply={(minutes) => {
              setDuration(minutes);
              setRemaining(minutes * 60);
              setRunning(false);
            }}
            notify={notify}
          />
        </div>

        <p className="mt-6 text-center text-[0.65rem] text-neutral-700 [@media(max-height:560px)]:hidden">
          space — start / pause · r — reset
        </p>
      </div>
    </section>
  );
}