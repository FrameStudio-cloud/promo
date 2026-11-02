import { useRef } from 'react';
import type { Task } from '../lib/tasks';
import { readableOn, withAlpha } from '../lib/tasks';
import { formatDuration } from '../lib/duration';

type Props = {
  task: Task;
  index: number;
  dragging: boolean;
  isOver: boolean;
  /** this task is the one focus sessions log onto */
  focused: boolean;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onSetFocus: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragEnter: (id: string) => void;
  onDragEnd: () => void;
};

export default function TaskCard({
  task,
  index,
  dragging,
  isOver,
  focused,
  onToggle,
  onRemove,
  onSetFocus,
  onDragStart,
  onDragEnter,
  onDragEnd,
}: Props) {
  const dragDepth = useRef(0);

  const subDone = task.subtasks.filter((s) => s.done).length;
  const subTotal = task.subtasks.length;

  const bits: string[] = [];
  if (subTotal) bits.push(`${subDone}/${subTotal} steps`);
  if (task.sessions) {
    const label = `${task.sessions} session${task.sessions === 1 ? '' : 's'}`;
    bits.push(task.focusMinutes ? `${label} · ${formatDuration(task.focusMinutes)}` : label);
  }

  return (
    <li
      draggable={!task.done}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', task.id);
        onDragStart(task.id);
      }}
      onDragEnter={() => {
        dragDepth.current += 1;
        if (dragDepth.current === 1) onDragEnter(task.id);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }}
      onDragLeave={() => {
        dragDepth.current -= 1;
      }}
      onDrop={(e) => {
        e.preventDefault();
        dragDepth.current = 0;
        onDragEnd();
      }}
      onDragEnd={() => {
        dragDepth.current = 0;
        onDragEnd();
      }}
      className={[
        'group relative overflow-hidden rounded-xl border transition-all duration-300 ease-out',
        'shadow-[0_1px_2px_rgba(0,0,0,0.4)] will-change-transform',
        dragging
          ? 'scale-[1.03] opacity-40 ring-2 ring-white/70'
          : 'opacity-100 hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(0,0,0,0.45)]',
        isOver && !dragging ? 'ring-2 ring-white/80' : '',
        task.done ? 'opacity-40 saturate-50' : '',
      ].join(' ')}
      style={{
        background: task.done
          ? withAlpha(task.color, 0.08)
          : withAlpha(task.color, 0.16),
        borderColor: withAlpha(task.color, task.done ? 0.25 : 0.45),
      }}
    >
      {/* colour rail */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1 transition-opacity duration-300"
        style={{ background: task.color, opacity: task.done ? 0.35 : 1 }}
      />

      {/* focus ring — a steady outline, no motion for something read often */}
      {focused && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-xl"
          style={{ boxShadow: `inset 0 0 0 1.5px ${task.color}` }}
        />
      )}

      <div className="flex items-start gap-3 py-3 pl-4 pr-2">
        {/* checkbox */}
        <button
          type="button"
          onClick={() => onToggle(task.id)}
          aria-pressed={task.done}
          aria-label={task.done ? `Mark "${task.text}" as not done` : `Mark "${task.text}" as done`}
          className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          style={{
            borderColor: task.done ? task.color : withAlpha(task.color, 0.65),
            background: task.done ? task.color : 'transparent',
            color: readableOn(task.color),
            boxShadow: task.done ? 'none' : `0 0 0 0 ${withAlpha(task.color, 0)}`,
          }}
        >
          {task.done && (
            <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.5 6.2 4.8 8.5 9.5 3.8" />
            </svg>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <p
            className={[
              'text-sm leading-snug font-medium break-words transition-colors duration-300',
              task.done ? 'text-neutral-400 line-through decoration-2' : 'text-neutral-50',
            ].join(' ')}
          >
            {task.text}
          </p>
          {!task.done && (
            <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[0.65rem] uppercase tracking-wider text-neutral-500">
              {focused && (
                <span
                  className="flex items-center gap-1.5"
                  style={{ color: task.color }}
                >
                  <span
                    aria-hidden
                    className="size-1.5 rounded-full"
                    style={{ background: task.color }}
                  />
                  Focusing
                </span>
              )}
              {bits.length > 0 ? (
                <span>{bits.join(' · ')}</span>
              ) : (
                !focused && <span>#{index + 1}</span>
              )}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          {/* focus target */}
          {!task.done && (
            <button
              type="button"
              onClick={() => onSetFocus(task.id)}
              aria-pressed={focused}
              aria-label={focused ? `Stop focusing on "${task.text}"` : `Focus on "${task.text}"`}
              title={focused ? 'Stop focusing' : 'Log focus sessions to this task'}
              className={[
                'grid size-6 place-items-center rounded transition-all duration-200 focus:outline-none focus-visible:opacity-100',
                focused
                  ? 'opacity-100'
                  : 'text-neutral-500 opacity-0 hover:bg-white/10 hover:text-neutral-200 group-hover:opacity-100',
              ].join(' ')}
              style={
                focused
                  ? { background: task.color, color: readableOn(task.color) }
                  : undefined
              }
            >
              <svg viewBox="0 0 12 12" className="size-3.5" aria-hidden>
                <circle cx="6" cy="6" r="4.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
                <circle cx="6" cy="6" r="1.7" fill="currentColor" />
              </svg>
            </button>
          )}

          {!task.done && (
            <span
              aria-hidden
              className="grid size-6 cursor-grab place-items-center rounded text-neutral-500 transition-colors group-hover:text-neutral-300 active:cursor-grabbing"
              title="Drag to reorder"
            >
              <svg viewBox="0 0 12 12" className="size-3" fill="currentColor">
                <circle cx="4" cy="2" r="1" />
                <circle cx="8" cy="2" r="1" />
                <circle cx="4" cy="6" r="1" />
                <circle cx="8" cy="6" r="1" />
                <circle cx="4" cy="10" r="1" />
                <circle cx="8" cy="10" r="1" />
              </svg>
            </span>
          )}

          <button
            type="button"
            onClick={() => onRemove(task.id)}
            aria-label={`Delete "${task.text}"`}
            className="grid size-6 place-items-center rounded text-neutral-500 opacity-0 transition-all hover:bg-white/10 hover:text-red-300 focus-visible:opacity-100 group-hover:opacity-100"
          >
            <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
              <path d="M2.5 2.5 9.5 9.5M9.5 2.5 2.5 9.5" />
            </svg>
          </button>
        </div>
      </div>
    </li>
  );
}
