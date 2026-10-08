import { useCallback, useEffect, useRef, useState } from 'react';
import FlipPanel from './FlipPanel';
import { formatDuration } from '../lib/duration';

type Props = {
  /** session length in minutes */
  duration: number;
  remaining: number;
  setRemaining: (s: number) => void;
  running: boolean;
  setRunning: (v: boolean) => void;
  soundOn: boolean;
  onToggleRun: () => void;
  onReset: () => void;
  /** both side panels are folded away — take the room */
  maximised: boolean;
  notify: (msg: string, kind?: 'success' | 'info' | 'warning' | 'error') => void;
};

export default function Clock({
  duration,
  remaining,
  setRemaining,
  running,
  setRunning,
  soundOn,
  onToggleRun,
  onReset,
  maximised,
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
  const beep = useCallback(() => {
    if (!soundOn) return;
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
  }, [soundOn]);

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
  }, [remaining, running, duration, notify, setRunning, beep]);

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
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onToggleRun, onReset]);

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
          space — start / pause · r — reset
        </p>
      </div>
    </section>
  );
}