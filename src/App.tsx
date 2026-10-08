import { useCallback } from 'react';
import { ToastProvider, useToast } from 'cite-ui';
import Clock from './components/Clock';
import TaskList from './components/TaskList';
import CollapseRail from './components/CollapseRail';
import type { Task } from './lib/tasks';
import { DEFAULT_MINUTES } from './lib/duration';
import { useLocalStorage } from './hooks/useLocalStorage';

const STARTER: Task[] = [
  { id: 'seed-1', text: 'Pick one task and finish it', done: false, color: '#6366f1', createdAt: 3 },
  { id: 'seed-2', text: 'Review the plan before starting', done: false, color: '#22c55e', createdAt: 2 },
  { id: 'seed-3', text: 'Break — stand up, stretch, refill water', done: false, color: '#f59e0b', createdAt: 1 },
];

function Shell() {
  const { toast } = useToast();

  const [tasks, setTasks] = useLocalStorage<Task[]>('pomo.tasks', STARTER);
  const [duration, setDuration] = useLocalStorage('pomo.duration', DEFAULT_MINUTES);
  const [remaining, setRemaining] = useLocalStorage('pomo.remaining', duration * 60);
  const [running, setRunning] = useLocalStorage('pomo.running', false);
  const [collapsed, setCollapsed] = useLocalStorage('pomo.collapsed', false);

  const notify = useCallback(
    (msg: string, kind: 'success' | 'info' | 'warning' | 'error' = 'info') => {
      toast[kind](msg);
    },
    [toast],
  );

  const doneCount = tasks.filter((t) => t.done).length;

  /* 70/30 side by side whenever there's width for it: a desktop window, or a
     phone held sideways. Portrait phones fall back to the stacked layout. */
  const split = [
    'landscape:max-lg:grid-cols-[70fr_30fr]',
    'lg:grid-cols-[70fr_30fr]',
  ].join(' ');

  return (
    <main
      className={[
        'grid h-full grid-cols-1 transition-[grid-template-columns] duration-300 ease-out',
        collapsed
          ? ['landscape:max-lg:grid-cols-[70fr_minmax(0,44px)]', 'lg:grid-cols-[70fr_minmax(0,56px)]'].join(' ')
          : split,
      ].join(' ')}
    >
      {/* CLOCK — 70% */}
      <div className="min-h-[70vh] landscape:max-lg:min-h-0 lg:min-h-0">
        <Clock
          duration={duration}
          setDuration={setDuration}
          remaining={remaining}
          setRemaining={setRemaining}
          running={running}
          setRunning={setRunning}
          notify={notify}
        />
      </div>

      {/* TODO — 30%, collapsible */}
      <aside
        className={[
          'relative min-h-0 border-t border-white/5 bg-neutral-900/40',
          'landscape:max-lg:border-t-0 landscape:max-lg:border-l',
          'lg:border-t-0 lg:border-l',
          collapsed ? 'overflow-hidden' : '',
        ].join(' ')}
      >
        {collapsed ? (
          <CollapseRail
            collapsed={collapsed}
            onToggle={() => setCollapsed(false)}
            done={doneCount}
            total={tasks.length}
          />
        ) : (
          <>
            <TaskList tasks={tasks} setTasks={setTasks} notify={notify} />

            <button
              type="button"
              onClick={() => setCollapsed(true)}
              aria-label="Collapse task list"
              aria-expanded={true}
              title="Collapse task list"
              className="absolute top-3 right-3 grid size-7 place-items-center rounded-lg text-neutral-600 transition-colors hover:bg-white/5 hover:text-neutral-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              <svg
                viewBox="0 0 16 16"
                className="size-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 3l5 5-5 5" />
              </svg>
            </button>
          </>
        )}
      </aside>
    </main>
  );
}

export default function App() {
  return (
    <ToastProvider position="bottom-right">
      <Shell />
    </ToastProvider>
  );
}