import { useEffect, useRef, useState } from 'react';

type Props = {
  value: number;
  label: string;
  /** must match the CSS animation duration */
  duration?: number;
};

const pad = (n: number) => String(n).padStart(2, '0');

const GLYPH = 'glyph-size font-black leading-none text-neutral-100';

/** Glyph block laid out so its optical centre sits on the card's middle line. */
function Glyph({ children }: { children: string }) {
  return (
    <div className={`flex h-[200%] items-center justify-center tabular-nums ${GLYPH}`}>
      {children}
    </div>
  );
}

/**
 * One split-flap panel: static top half (new value), static bottom half
 * (old value) and a leaf that folds down on every change.
 */
export default function FlipPanel({ value, label, duration = 600 }: Props) {
  const [current, setCurrent] = useState(value);
  const [next, setNext] = useState(value);
  const [flipping, setFlipping] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (pad(current) === pad(value)) return;

    setNext(value);
    setFlipping(true);

    timer.current = window.setTimeout(() => {
      setCurrent(value);
      setFlipping(false);
    }, duration);

    return () => window.clearTimeout(timer.current);
  }, [value, current, duration]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <div className="flex w-auto flex-col items-center">
      <div
        className="flip-scene relative w-auto select-none overflow-hidden rounded-[1.5rem] bg-[#0b0b0d] shadow-[0_2px_0_rgba(255,255,255,0.04)]"
        style={{ aspectRatio: '3 / 4', height: 'var(--panel-h, 20rem)' }}
        role="timer"
        aria-label={`${label} ${pad(value)}`}
      >
        {/* upper half — always the new value */}
        <div className="flip-face absolute inset-x-0 top-0 h-1/2 overflow-hidden rounded-t-[1.5rem] bg-[#161618]">
          <Glyph>{pad(next)}</Glyph>
        </div>

        {/* lower half — holds the old value while the leaf is in flight */}
        <div className="flip-face absolute inset-x-0 bottom-0 h-1/2 overflow-hidden rounded-b-[1.5rem] bg-[#0d0d0f]">
          <div className="-translate-y-1/2">
            <Glyph>{pad(flipping ? current : next)}</Glyph>
          </div>
        </div>

        {/* the leaf */}
        {flipping && (
          <div
            className="flip-scene absolute inset-x-0 top-0 z-30 h-1/2 origin-bottom [transform-style:preserve-3d]"
            style={{ animation: `leaf ${duration}ms cubic-bezier(0.4, 0, 0.2, 1) forwards` }}
          >
            <div className="flip-face absolute inset-0 overflow-hidden rounded-t-[1.5rem] bg-[#161618]">
              <Glyph>{pad(current)}</Glyph>
            </div>

            <div className="flip-face flip-face-back absolute inset-0 overflow-hidden rounded-b-[1.5rem] bg-[#0d0d0f]">
              <div className="-translate-y-1/2">
                <Glyph>{pad(next)}</Glyph>
              </div>
            </div>
          </div>
        )}

        {/* seam */}
        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-50 h-px bg-black/80" />
      </div>

      <p className="mt-5 text-[0.65rem] font-medium uppercase tracking-[0.4em] text-neutral-500 [@media(max-height:560px)]:mt-2 [@media(max-height:560px)]:text-[0.55rem] [@media(max-height:560px)]:tracking-[0.3em]">
        {label}
      </p>
    </div>
  );
}