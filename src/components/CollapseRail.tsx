type Props = {
  onExpand: () => void;
  done: number;
  total: number;
};

/** Narrow rail shown when the task panel is collapsed. */
export default function CollapseRail({ onExpand, done, total }: Props) {
  return (
    <div className="flex h-full flex-col items-center gap-3 py-3">
      <button
        type="button"
        onClick={onExpand}
        aria-label="Expand task list"
        aria-expanded={false}
        title="Expand task list"
        className="grid size-8 place-items-center rounded-lg border border-white/10 text-neutral-400 transition-colors hover:border-white/25 hover:text-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
      >
        <svg
          viewBox="0 0 16 16"
          className="size-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M10 3 5 8l5 5" />
        </svg>
      </button>

      <span className="mt-1 font-mono text-[0.65rem] text-neutral-600 tabular-nums">
        {done}/{total}
      </span>
    </div>
  );
}