import { useCallback, useState } from 'react';
import TaskCard from './TaskCard';
import type { Task } from '../lib/tasks';
import { randomColor, uid } from '../lib/tasks';

type Props = {
  tasks: Task[];
  setTasks: (updater: (prev: Task[]) => Task[]) => void;
  notify: (msg: string, kind?: 'success' | 'info' | 'warning' | 'error') => void;
};

export default function TaskList({ tasks, setTasks, notify }: Props) {
  const [text, setText] = useState('');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) {
      notify('Type something first', 'warning');
      return;
    }

    // every new card gets a random colour, never repeating the previous one
    const color = randomColor(tasks[0]?.color);

    setTasks((prev) => [
      {
        id: uid(),
        text: value,
        done: false,
        color,
        createdAt: Date.now(),
      },
      ...prev,
    ]);
    setText('');
    notify('Task added', 'success');
  };

  const toggle = useCallback(
    (id: string) =>
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
      ),
    [setTasks],
  );

  const remove = useCallback(
    (id: string) => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      notify('Task deleted', 'info');
    },
    [setTasks, notify],
  );

  const handleDragEnter = useCallback(
    (targetId: string) => {
      if (!draggingId || draggingId === targetId) return;
      setOverId(targetId);

      setTasks((prev) => {
        const from = prev.findIndex((t) => t.id === draggingId);
        const to = prev.findIndex((t) => t.id === targetId);
        if (from === -1 || to === -1) return prev;

        const next = [...prev];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        return next;
      });
    },
    [draggingId, setTasks],
  );

  const endDrag = useCallback(() => {
    setDraggingId(null);
    setOverId(null);
  }, []);

  const doneCount = tasks.filter((t) => t.done).length;

  const clearDone = () => {
    if (!doneCount) {
      notify('Nothing completed yet', 'warning');
      return;
    }
    setTasks((prev) => prev.filter((t) => !t.done));
    notify(`Cleared ${doneCount} completed`, 'info');
  };

  const clearAll = () => {
    if (!tasks.length) {
      notify('List is already empty', 'warning');
      return;
    }
    setTasks(() => []);
    notify('List cleared', 'info');
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-baseline justify-between gap-3 px-5 pt-5 pb-3 [@media(max-height:560px)]:px-3 [@media(max-height:560px)]:pt-3 [@media(max-height:560px)]:pb-2">
        <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-300">
          Up next
        </h2>
        <span className="rounded-full bg-white/5 px-2 py-0.5 font-mono text-[0.65rem] text-neutral-400 tabular-nums">
          {doneCount}/{tasks.length}
        </span>
      </header>

      <form onSubmit={add} className="flex gap-2 px-5 [@media(max-height:560px)]:px-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={120}
          placeholder="Add a task…"
          aria-label="New task"
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 transition-colors focus:border-white/30 focus:bg-white/[0.07] focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Add task"
          className="grid size-9 shrink-0 place-items-center rounded-lg bg-neutral-100 text-lg font-bold text-neutral-900 transition-transform hover:bg-white active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          +
        </button>
      </form>

      <p className="px-5 pt-2 pb-1 text-[0.65rem] text-neutral-600 [@media(max-height:560px)]:hidden">
        {tasks.length > 1 ? 'Drag cards to reorder · tick to complete' : 'Tick a card to complete it'}
      </p>

      <ul className="no-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-2 [@media(max-height:560px)]:space-y-1.5 [@media(max-height:560px)]:px-2 [@media(max-height:560px)]:py-1.5">
        {tasks.map((task, i) => (
          <TaskCard
            key={task.id}
            task={task}
            index={i}
            dragging={draggingId === task.id}
            isOver={overId === task.id && draggingId !== task.id}
            onToggle={toggle}
            onRemove={remove}
            onDragStart={setDraggingId}
            onDragEnter={handleDragEnter}
            onDragEnd={endDrag}
          />
        ))}

        {tasks.length === 0 && (
          <li className="rounded-xl border border-dashed border-white/10 px-4 py-10 text-center">
            <p className="text-sm text-neutral-500">No tasks yet</p>
            <p className="mt-1 text-xs text-neutral-600">Add one above to get moving</p>
          </li>
        )}
      </ul>

      <footer className="flex items-center gap-3 border-t border-white/5 px-5 py-3 [@media(max-height:560px)]:px-3 [@media(max-height:560px)]:py-2">
        <button
          type="button"
          onClick={clearDone}
          disabled={!doneCount}
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