import { useState } from 'react';
import type { Subtask, Task } from '../lib/tasks';
import { readableOn, withAlpha } from '../lib/tasks';
import { formatDuration } from '../lib/duration';

type Props = {
  task: Task;
  focused: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onSetFocus: (id: string) => void;
  onAddSubtask: (taskId: string, text: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onRemoveSubtask: (taskId: string, subtaskId: string) => void;
};

/* ---------- one checklist line inside a task ---------- */

function SubtaskItem({
  sub,
  color,
  onToggle,
  onRemove,
}: {
  sub: Subtask;
  color: string;
  onToggle: () => void;
  onRemove: () => void;
}) {
  return (
    <li className="group/sub flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[0.04]">
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={sub.done}
        aria-label={sub.done ? `Mark "${sub.text}" as not done` : `Mark "${sub.text}" as done`}
        className="grid size-4 shrink-0 place-items-center rounded border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        style={{
          borderColor: sub.done ? color : withAlpha(color, 0.55),
          background: sub.done ? color : 'transparent',
          color: readableOn(color),
        }}
      >
        {sub.done && (
          <svg viewBox="0 0 12 12" className="size-2.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M2.5 6.2 4.8 8.5 9.5 3.8" />
          </svg>
        )}
      </button>

      <p
        className={[
          'min-w-0 flex-1 text-xs leading-snug break-words transition-colors duration-300',
          sub.done ? 'text-neutral-500 line-through' : 'text-neutral-200',
        ].join(' ')}
      >
        {sub.text}
      </p>

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Delete step "${sub.text}"`}
        className="grid size-5 shrink-0 place-items-center rounded text-neutral-600 opacity-0 transition-all hover:text-red-300 focus-visible:opacity-100 group-hover/sub:opacity-100"
      >
        <svg viewBox="0 0 12 12" className="size-2.5" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
          <path d="M2.5 2.5 9.5 9.5M9.5 2.5 2.5 9.5" />
        </svg>
      </button>
    </li>
  );
}

/* ---------- the task row on the dedicated page ---------- */

export default function TaskRow({
  task,
  focused,
  expanded,
  onToggleExpand,
  onToggle,
  onRemove,
  onSetFocus,
  onAddSubtask,
  onToggleSubtask,
  onRemoveSubtask,
}: Props) {
  const [step, setStep] = useState('');

  const subDone = task.subtasks.filter((s) => s.done).length;
  const subTotal = task.subtasks.length;

  const bits: string[] = [];
  if (subTotal) bits.push(`${subDone}/${subTotal} steps`);
  if (task.sessions) {
    const label = `${task.sessions} session${task.sessions === 1 ? '' : 's'}`;
    bits.push(task.focusMinutes ? `${label} · ${formatDuration(task.focusMinutes)}` : label);
  }

  const addStep = (e: React.FormEvent) => {
    e.preventDefault();
    const value = step.trim();
    if (!value) return;
    onAddSubtask(task.id, value);
    setStep('');
  };

  return (
    <li
      className={[
        'group relative overflow-hidden rounded-xl border transition-all duration-300 ease-out',
        'shadow-[0_1px_2px_rgba(0,0,0,0.4)]',
        task.done
          ? 'opacity-40 saturate-50'
          : 'hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(0,0,0,0.45)]',
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
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: task.color, opacity: task.done ? 0.35 : 1 }}
      />

      {/* focus ring — steady outline, no motion for something read often */}
      {focused && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-xl"
          style={{ boxShadow: `inset 0 0 0 1.5px ${task.color}` }}
        />
      )}

      <div className="flex items-start gap-3 px-4 pt-3.5 pr-2">
        {/* checkbox */}
        <button
          type="button"
          onClick={() => onToggle(task.id)}
          aria-pressed={task.done}
          aria-label={task.done ? `Mark "${task.text}" as not done` : `Mark "${task.text}" as done`}
          className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          style={{
            borderColor: task.done ? task.color : withAlpha(task.color, 0.65),
            background: task.done ? task.color : 'transparent',
            color: readableOn(task.color),
          }}
        >
          {task.done && (
            <svg viewBox="0 0 12 12" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.5 6.2 4.8 8.5 9.5 3.8" />
            </svg>
          )}
        </button>

        {/* text + meta — clicking opens the checklist */}
        <div
          className="min-w-0 flex-1 cursor-pointer select-none py-0.5"
          onClick={onToggleExpand}
        >
          <p
            className={[
              'text-sm leading-snug font-medium break-words transition-colors duration-300',
              task.done ? 'text-neutral-400 line-through decoration-2' : 'text-neutral-50',
            ].join(' ')}
          >
            {task.text}
          </p>

          {(focused || bits.length > 0) && !task.done && (
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[0.65rem] uppercase tracking-wider text-neutral-500">
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
              {bits.length > 0 && <span className="tabular-nums">{bits.join(' · ')}</span>}
            </p>
          )}

          {subTotal > 0 && !task.done && (
            <div className="mt-2 h-1 max-w-[260px] overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full w-full origin-left rounded-full transition-transform duration-300 ease-out motion-reduce:transition-none"
                style={{
                  transform: `scaleX(${subTotal ? subDone / subTotal : 0})`,
                  background: task.color,
                }}
              />
            </div>
          )}
        </div>

        {/* actions */}
        <div className="flex shrink-0 items-center gap-0.5">
          {!task.done && (
            <button
              type="button"
              onClick={() => onSetFocus(task.id)}
              aria-pressed={focused}
              aria-label={focused ? `Stop focusing on "${task.text}"` : `Focus on "${task.text}"`}
              title={focused ? 'Stop focusing' : 'Log focus sessions to this task'}
              className={[
                'grid size-7 place-items-center rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 active:scale-95',
                focused
                  ? ''
                  : 'text-neutral-500 hover:bg-white/10 hover:text-neutral-200',
              ].join(' ')}
              style={
                focused
                  ? { background: task.color, color: readableOn(task.color) }
                  : undefined
              }
            >
              <svg viewBox="0 0 12 12" className="size-4" aria-hidden>
                <circle cx="6" cy="6" r="4.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
                <circle cx="6" cy="6" r="1.7" fill="currentColor" />
              </svg>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleExpand}
            aria-expanded={expanded}
            aria-controls={`steps-${task.id}`}
            aria-label={expanded ? `Collapse "${task.text}"` : `Expand "${task.text}"`}
            title={expanded ? 'Collapse' : 'Expand'}
            className="grid size-7 place-items-center rounded-lg text-neutral-500 transition-colors hover:bg-white/5 hover:text-neutral-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            <svg
              viewBox="0 0 16 16"
              className={[
                'size-3.5 transition-transform duration-200 ease-out motion-reduce:transition-none',
                expanded ? 'rotate-180' : '',
              ].join(' ')}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M4 6l4 4 4-4" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => onRemove(task.id)}
            aria-label={`Delete "${task.text}"`}
            className="grid size-7 place-items-center rounded-lg text-neutral-500 opacity-0 transition-all hover:bg-white/10 hover:text-red-300 focus-visible:opacity-100 group-hover:opacity-100"
          >
            <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
              <path d="M2.5 2.5 9.5 9.5M9.5 2.5 2.5 9.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* the checklist — a grid-rows accordion so height animates without JS */}
      <div
        id={`steps-${task.id}`}
        className={[
          'grid transition-[grid-template-rows] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none',
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        ].join(' ')}
      >
        <div className="overflow-hidden">
          <div
            className={[
              'pl-[3.25rem] pr-4 pt-1 pb-3.5 transition-opacity duration-200 motion-reduce:transition-none',
              expanded ? 'opacity-100 delay-75' : 'opacity-0',
            ].join(' ')}
          >
            <ul className="space-y-0.5">
              {task.subtasks.map((sub) => (
                <SubtaskItem
                  key={sub.id}
                  sub={sub}
                  color={task.color}
                  onToggle={() => onToggleSubtask(task.id, sub.id)}
                  onRemove={() => onRemoveSubtask(task.id, sub.id)}
                />
              ))}

              {subTotal === 0 && (
                <li className="px-2 py-1.5 text-xs text-neutral-600">
                  No steps yet — break this task into pieces
                </li>
              )}
            </ul>

            <form onSubmit={addStep} className="mt-2 flex gap-1.5">
              <input
                value={step}
                onChange={(e) => setStep(e.target.value)}
                maxLength={120}
                placeholder="Add a step…"
                aria-label={`New step in "${task.text}"`}
                className="h-8 min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 text-xs text-neutral-100 placeholder-neutral-600 transition-colors focus:border-white/30 focus:bg-white/[0.07] focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Add step"
                className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/10 text-sm font-bold text-neutral-100 transition-all hover:bg-white/20 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                +
              </button>
            </form>
          </div>
        </div>
      </div>
    </li>
  );
}
