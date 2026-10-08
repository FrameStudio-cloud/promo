import DurationInput from './DurationInput';

type Props = {
  collapsed: boolean;
  onToggleCollapse: () => void;

  running: boolean;
  finished: boolean;
  onToggleRun: () => void;
  onReset: () => void;
  onAdjust: (minutes: number) => void;

  soundOn: boolean;
  onToggleSound: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;

  duration: number;
  onSetDuration: (minutes: number) => void;
  notify: (msg: string, kind?: 'success' | 'info' | 'warning' | 'error') => void;
};

/* ---------- icons ---------- */

const Svg = ({ d, filled = false }: { d: string; filled?: boolean }) => (
  <svg
    viewBox="0 0 20 20"
    className="size-4"
    fill={filled ? 'currentColor' : 'none'}
    stroke={filled ? 'none' : 'currentColor'}
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d={d} />
  </svg>
);

const ICONS = {
  play: { d: 'M7 4.5 15 10l-8 5.5z', filled: true },
  pause: { d: 'M7.5 5v10M12.5 5v10', filled: false },
  reset: { d: 'M4 10a6 6 0 1 1 1.8 4.3M4 10V6M4 10h4', filled: false },
  plus: { d: 'M10 5v10M5 10h10', filled: false },
  minus: { d: 'M5 10h10', filled: false },
  sound: { d: 'M4 8v4h3l4 3V5L7 8zM14 7.5a3.5 3.5 0 0 1 0 5', filled: false },
  mute: { d: 'M4 8v4h3l4 3V5L7 8zM14 8l3 4M17 8l-3 4', filled: false },
  expand: { d: 'M13 4h3v3M7 16H4v-3M16 4l-4.5 4.5M4 16l4.5-4.5', filled: false },
  collapse: { d: 'M7 4v3H4M13 16v-3h3M4 7l4.5 4.5M16 13l-4.5-4.5', filled: false },
  hourglass: { d: 'M7 3h6M7 17h6M8 3v3.2L10 9l-2 2.8V17M12 3v3.2L10 9', filled: false },
} as const;

/* ---------- buttons ---------- */

const IconButton = ({
  icon,
  label,
  onClick,
  active,
  emphasis,
  showLabel,
}: {
  icon: keyof typeof ICONS;
  label: string;
  onClick: () => void;
  active?: boolean;
  emphasis?: boolean;
  showLabel?: boolean;
}) => {
  const { d, filled } = ICONS[icon];
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={[
        'shrink-0 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60',
        showLabel
          ? 'flex h-9 w-full items-center gap-3 rounded-lg px-3 text-sm'
          : 'grid size-9 place-items-center rounded-lg',
        emphasis
          ? 'bg-neutral-100 text-neutral-950 hover:bg-white active:scale-95'
          : active
            ? 'bg-white/10 text-neutral-100 hover:bg-white/15'
            : 'text-neutral-500 hover:bg-white/5 hover:text-neutral-200',
      ].join(' ')}
    >
      <Svg d={d} filled={filled} />
      {showLabel && <span className="truncate">{label}</span>}
    </button>
  );
};

/**
 * The clock's control rail. Collapsed it is a 56px column of icons; expanded it
 * widens to show labels and the duration field. Either way it stays operable.
 */
export default function ControlRail({
  collapsed,
  onToggleCollapse,
  running,
  finished,
  onToggleRun,
  onReset,
  onAdjust,
  soundOn,
  onToggleSound,
  isFullscreen,
  onToggleFullscreen,
  duration,
  onSetDuration,
  notify,
}: Props) {
  const expand = !collapsed;

  return (
    <div
      className={[
        'flex flex-col items-center gap-2 overflow-x-hidden overflow-y-auto border-r border-white/5 bg-neutral-900/40 py-3',
        'transition-[width] duration-300 ease-out',
        // only the collapsed rail narrows on short screens — expanded needs
        // room for labels and the duration field
        expand ? 'w-[232px] items-stretch px-3' : 'w-14 [@media(max-height:560px)]:w-16',
      ].join(' ')}
    >
      <div className={expand ? 'flex flex-col gap-2' : 'flex flex-col items-center gap-1.5'}>
        <IconButton
          icon={expand ? 'collapse' : 'expand'}
          label={expand ? 'Hide controls' : 'Show controls'}
          onClick={onToggleCollapse}
          active={expand}
          showLabel={expand}
        />

        <div className={expand ? 'my-1 h-px bg-white/10' : 'my-1 h-px w-6 bg-white/10'} />

        <div className={expand ? 'flex flex-col gap-2' : 'flex flex-col items-center gap-1.5'}>
          <IconButton
            icon={running ? 'pause' : 'play'}
            label={running ? 'Pause' : finished ? 'Run again' : 'Start'}
            onClick={onToggleRun}
            emphasis
            showLabel={expand}
          />
          <IconButton icon="reset" label="Reset" onClick={onReset} showLabel={expand} />
        </div>

        <div className={expand ? 'my-1 h-px bg-white/10' : 'my-1 h-px w-6 bg-white/10'} />

        <div className={expand ? 'flex flex-col gap-2' : 'flex flex-col items-center gap-1.5'}>
          <IconButton icon="plus" label="Add a minute" onClick={() => onAdjust(1)} showLabel={expand} />
          <IconButton icon="minus" label="Remove a minute" onClick={() => onAdjust(-1)} showLabel={expand} />
        </div>

        <div className={expand ? 'my-1 h-px bg-white/10' : 'my-1 h-px w-6 bg-white/10'} />

        <div className={expand ? 'flex flex-col gap-2' : 'flex flex-col items-center gap-1.5'}>
          <IconButton
            icon={soundOn ? 'sound' : 'mute'}
            label={soundOn ? 'Mute the alarm' : 'Unmute the alarm'}
            onClick={onToggleSound}
            active={soundOn}
            showLabel={expand}
          />
          <IconButton
            icon="expand"
            label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            onClick={onToggleFullscreen}
            active={isFullscreen}
            showLabel={expand}
          />
        </div>
      </div>

      {/* duration only fits when the rail is open */}
      {expand && (
        <div className="mt-3 border-t border-white/10 pt-3">
          <p className="mb-2 text-[0.6rem] font-medium uppercase tracking-[0.25em] text-neutral-600">
            Duration
          </p>
          <DurationInput minutes={duration} onApply={onSetDuration} notify={notify} />
        </div>
      )}

      {!expand && (
        <div className="mt-auto">
          <IconButton
            icon="hourglass"
            label="Set duration"
            onClick={onToggleCollapse}
          />
        </div>
      )}
    </div>
  );
}