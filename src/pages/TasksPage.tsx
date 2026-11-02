import { useCallback, useEffect, useState } from 'react';
import TaskRow from '../components/TaskRow';
import TimerPill from '../components/TimerPill';
import type { Task } from '../lib/tasks';
import {
  addSubtask,
  makeTask,
  removeSubtask,
  removeTask,
  toggleSubtask,
  toggleTask,
} from '../lib/tasks';

type Props = {
  tasks: Task[];
  setTasks: (updater: (prev: Task[]) => Task[]) => void;
  focusTaskId: string | null;
  focusTask: Task | null;
  onSetFocus: (id: string) => void;
  remaining: number;
  running: boolean;
  onToggleRun: () => void;
  onOpenTimer: () => void;
  notify: (msg: string, kind?: 'success' | 'info' | 'warning' | 'error') => void;
};

/**
 * The dedicated tasks page (#/tasks): the full task list with subtask
 * checklists and focus tracking, plus a live timer pill so a running
 * countdown stays visible while you plan.
 */
export default function TasksPage({
  tasks,
  setTasks,
  focusTaskId,
  focusTask,
  onSetFocus,
  remaining,
  running,
  onToggleRun,
  onOpenTimer,
  notify,
}: Props) {
  const [text, setText] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* Escape goes back to the clock */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (e.key === 'Escape' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        onOpenTimer();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onOpenTimer]);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) {
      notify('Type something first', 'warning');
      return;
    }
    const task = makeTask(value, tasks[0]?.color);
    setTasks((prev) => [task, ...prev]);
    setText('');
    setExpandedId(task.id);
    notify('Task added', 'success');
  };

  const toggle = useCallback(
    (id: string) => setTasks((prev) => toggleTask(prev, id)),
    [setTasks],
  );

  const remove = useCallback(
    (id: string) => {
      setTasks((prev) => removeTask(prev, id));
      setExpandedId((prev) => (prev === id ? null : prev));
      notify('Task deleted', 'info');
    },
    [setTasks, notify],
  );

  const handleAddSubtask = useCallback(
    (taskId: string, value: string) => setTasks((prev) => addSubtask(prev, taskId, value)),
    [setTasks],
  );

  const handleToggleSubtask = useCallback(
    (taskId: string, subtaskId: string) =>
      setTasks((prev) => toggleSubtask(prev, taskId, subtaskId)),
    [setTasks],
  );

  const handleRemoveSubtask = useCallback(
    (taskId: string, subtaskId: string) =>
      setTasks((prev) => removeSubtask(prev, taskId, subtaskId)),
    [setTasks],
  );

  const toggleExpand = useCallback(
    (id: string) => setExpandedId((prev) => (prev === id ? null : id)),
    [],
  );

  const active = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);

  const clearDone = () => {
    if (!done.length) {
      notify('Nothing completed yet', 'warning');
      return;
    }
    setTasks((prev) => prev.filter((t) => !t.done));
    notify(`Cleared ${done.length} completed`, 'info');
  };

  const clearAll = () => {
    if (!tasks.length) {
      notify('List is already empty', 'warning');
      return;
    }
    setTasks(() => []);
    setExpandedId(null);
    notify('List cleared', 'info');
  };

  const rowProps = (task: Task) => ({
    task,
    focused: task.id === focusTaskId,
    expanded: expandedId === task.id,
    onToggleExpand: () => toggleExpand(task.id),
    onToggle: toggle,
    onRemove: remove,
    onSetFocus,
    onAddSubtask: handleAddSubtask,
    onToggleSubtask: handleToggleSubtask,
    onRemoveSubtask: handleRemoveSubtask,
  });

  return (
    <div className="page-enter flex h-full min-h-0 flex-col bg-black">
      {/* header */}
      <header className="flex shrink-0 items-center gap-2 border-b border-white/5 px-3 py-3 sm:px-5">
        <button
          type="button"
          onClick={onOpenTimer}
          aria-label="Back to the timer"
          title="Back to the timer"
          className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/10 text-neutral-400 transition-colors hover:border-white/25 hover:text-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
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

        <h1 className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-300">
          Tasks
        </h1>
        <span className="rounded-full bg-white/5 px-2 py-0.5 font-mono text-[0.65rem] text-neutral-400 tabular-nums">
          {done.length}/{tasks.length}
        </span>

        <span className="flex-1" />

        <TimerPill
          remaining={remaining}
          running={running}
          focusTask={focusTask}
          onToggleRun={onToggleRun}
          onOpenTimer={onOpenTimer}
        />
      </header>

      {/* scroll body */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-4 pt-6 pb-8 sm:px-6">
          <form onSubmit={add} className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={120}
              placeholder="Add a task — e.g. History essay"
              aria-label="New task"
              autoFocus
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 transition-colors focus:border-white/30 focus:bg-white/[0.07] focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Add task"
              className="grid size-10 shrink-0 place-items-center rounded-lg bg-neutral-100 text-lg font-bold text-neutral-900 transition-all hover:bg-white active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              +
            </button>
          </form>

          <p className="mt-2.5 px-1 text-[0.65rem] text-neutral-600">
            Open a task to break it into steps · mark ◎ to log focus sessions to it
          </p>

          {/* active */}
          <ul className="mt-5 space-y-2.5">
            {active.map((task) => (
              <TaskRow key={task.id} {...rowProps(task)} />
            ))}
          </ul>

          {active.length === 0 && done.length > 0 && (
            <p className="mt-5 rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-neutral-500">
              All caught up — everything's completed
            </p>
          )}

          {tasks.length === 0 && (
            <div className="mt-5 rounded-xl border border-dashed border-white/10 px-4 py-12 text-center">
              <p className="text-sm text-neutral-500">No tasks yet</p>
              <p className="mt-1 text-xs text-neutral-600">
                Add one above — then break it into steps
              </p>
            </div>
          )}

          {/* completed */}
          {done.length > 0 && (
            <section className="mt-8">
              <div className="mb-3 flex items-center gap-3">
                <h2 className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-neutral-500">
                  Completed
                </h2>
                <span className="font-mono text-[0.65rem] text-neutral-600 tabular-nums">
                  {done.length}
                </span>
                <span className="h-px flex-1 bg-white/5" />
              </div>

              <ul className="space-y-2.5">
                {done.map((task) => (
                  <TaskRow key={task.id} {...rowProps(task)} />
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      {/* footer */}
      <footer className="flex shrink-0 items-center gap-3 border-t border-white/5 px-5 py-3">
        <button
          type="button"
          onClick={clearDone}
          disabled={!done.length}
          className="text-[0.7rem] text-neutral-500 transition-colors hover:text-neutral-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear done
        </button>
        <span className="flex-1" />
        <button
          type="button"
          onClick={clearAll}
          disabled={!tasks.length}
          className="text-[0.7rem] text-neutral-600 transition-colors hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear all
        </button>
      </footer>
    </div>
  );
}
