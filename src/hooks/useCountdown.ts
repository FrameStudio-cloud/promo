import { useEffect, useRef } from 'react';

type Props = {
  running: boolean;
  remaining: number;
  setRemaining: (s: number) => void;
  setRunning: (v: boolean) => void;
  /** fires once when the countdown reaches zero while running */
  onComplete: () => void;
};

/**
 * The wall-clock ticker and its completion, lifted out of <Clock /> so the
 * countdown keeps running while the tasks page is open.
 *
 * The deadline lives in a ref and the interval only depends on `running`, so
 * ticks never restart the effect. A second effect recomputes the deadline when
 * `remaining` changes from outside this hook — pause/resume, ±1 minute. Writes
 * made by the ticker itself are recognised and skipped, which is also what
 * makes nudging while running stick (previously the next tick clobbered it).
 */
export function useCountdown({
  running,
  remaining,
  setRemaining,
  setRunning,
  onComplete,
}: Props) {
  const remainingRef = useRef(remaining);
  const setRemainingRef = useRef(setRemaining);
  const onCompleteRef = useRef(onComplete);

  const endsAtRef = useRef<number | null>(null);
  const lastWriteRef = useRef<number>(-1);
  const prevRunningRef = useRef(false);

  useEffect(() => {
    remainingRef.current = remaining;
  }, [remaining]);

  useEffect(() => {
    setRemainingRef.current = setRemaining;
  }, [setRemaining]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  /* recompute the deadline whenever the session (re)starts or remaining is
     changed from the outside; ignore the ticker's own writes */
  useEffect(() => {
    const justStarted = running && !prevRunningRef.current;
    prevRunningRef.current = running;

    if (!running) return;
    if (!justStarted && remaining === lastWriteRef.current) return;

    endsAtRef.current = Date.now() + remaining * 1000;
  }, [running, remaining]);

  /* the ticker — derived from a wall-clock deadline so it never drifts */
  useEffect(() => {
    if (!running) return;

    const tick = () => {
      const endsAt =
        endsAtRef.current ?? Date.now() + remainingRef.current * 1000;
      const next = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      lastWriteRef.current = next;
      setRemainingRef.current(next);
    };

    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [running]);

  /* reach zero: stop and report once — no auto-advance */
  useEffect(() => {
    if (!running || remaining !== 0) return;
    setRunning(false);
    onCompleteRef.current();
  }, [running, remaining, setRunning]);
}
