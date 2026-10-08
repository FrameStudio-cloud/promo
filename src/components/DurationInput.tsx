import { useState } from 'react';
import { formatDuration, parseDuration } from '../lib/duration';

type Props = {
  /** active session length in minutes */
  minutes: number;
  onApply: (minutes: number) => void;
  notify: (msg: string, kind?: 'success' | 'info' | 'warning' | 'error') => void;
};

export default function DurationInput({ minutes, onApply, notify }: Props) {
  // null = field mirrors the active duration; a string = the user is typing
  const [draft, setDraft] = useState<string | null>(null);
  const [unit, setUnit] = useState<'m' | 'h'>('m');

  // 8h reads as "8" + hours, 90m as "90" + minutes
  const wholeHours = minutes % 60 === 0;
  const value = draft ?? String(wholeHours ? minutes / 60 : minutes);
  const activeUnit = draft === null ? (wholeHours ? 'h' : 'm') : unit;

  const submit = () => {
    const parsed = parseDuration(value, activeUnit);
    if (parsed === null) {
      notify('Try something like 8h, 90m or 45', 'warning');
      return;
    }
    onApply(parsed);
    setDraft(null);
    notify(`Set to ${formatDuration(parsed)}`, 'success');
  };

  const toggleUnit = (u: 'm' | 'h') => {
    setUnit(u);
    // freeze the current text so the new unit applies to it
    if (draft === null && value) setDraft(value);
  };

  return (
    <div className="flex items-center justify-center gap-1.5">
      <div className="flex items-center rounded-full border border-white/10 bg-white/[0.03] px-1 py-1 transition-colors focus-within:border-white/30">
        <input
          value={value}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          inputMode="decimal"
          placeholder="8h"
          aria-label="Custom duration"
          className="w-14 bg-transparent px-2 py-1 text-center font-mono text-sm text-neutral-100 placeholder-neutral-700 focus:outline-none"
        />

        <div className="flex items-center gap-0.5">
          {(['m', 'h'] as const).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => toggleUnit(u)}
              aria-pressed={activeUnit === u}
              className={[
                'rounded-full px-2 py-1 text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
                activeUnit === u
                  ? 'bg-white text-neutral-950'
                  : 'text-neutral-500 hover:text-neutral-200',
              ].join(' ')}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={submit}
        className="rounded-full border border-white/10 px-4 py-2 text-xs text-neutral-400 transition-colors hover:border-white/25 hover:text-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
      >
        Set
      </button>
    </div>
  );
}