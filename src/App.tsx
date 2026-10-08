import { useCallback } from 'react';
import { ToastProvider, useToast } from 'cite-ui';
import Clock from './components/Clock';
import ControlRail from './components/ControlRail';
import TaskList from './components/TaskList';
import CollapseRail from './components/CollapseRail';
import type { Task } from './lib/tasks';
import { DEFAULT_MINUTES, formatDuration } from './lib/duration';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useFullscreen } from './hooks/useFullscreen';

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
  const [soundOn, setSoundOn] = useLocalStorage('pomo.sound', true);

  const [railOpen, setRailOpen] = useLocalStorage('pomo.railOpen', false);
  const [todoOpen, setTodoOpen] = useLocalStorage('pomo.todoOpen', true);

  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

  const notify = useCallback(
    (msg: string, kind: 'success' | 'info' | 'warning' | 'error' = 'info') => {
      toast[kind](msg);
    },
    [toast],
  );

  const finished = remaining === 0;
  const doneCount = tasks.filter((t) => t.done).length;

  /* start / pause — pressing start at zero runs the duration again */
  const toggleRun = useCallback(() => {
    if (remaining === 0) setRemaining(duration * 60);
    setRunning(!running);
  }, [remaining, duration, running, setRemaining, setRunning]);

  const reset = useCallback(() => {
    setRemaining(duration * 60);
    setRunning(false);
  }, [duration, setRemaining, setRunning]);

  /* nudge the countdown without disturbing the full duration */
  const adjust = useCallback(
    (minutes: number) => {
      setRemaining((prev) => Math.max(0, prev + minutes * 60));
    },
    [setRemaining],
  );

  const setSessionDuration = useCallback(
    (minutes: number) => {
      setDuration(minutes);
      setRemaining(minutes * 60);
      setRunning(false);
    },
    [setDuration, setRemaining, setRunning],
  );

  /* both side panels folded away = give the clock everything */
  const maximised = !railOpen && !todoOpen;

  /* the task column keeps its share only while it is actually open */
  const sideBySide = [
    'landscape:max-lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,30%)]',
    'lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,30%)]',
  ].join(' ');

  return (
    <main
      className={[
        'grid h-full grid-cols-[auto_minmax(0,1fr)] grid-rows-[auto_1fr]',
        'landscape:max-lg:grid-rows-1',
        'lg:grid-rows-1',
        todoOpen
          ? sideBySide
          : 'landscape:max-lg:grid-cols-[auto_minmax(0,1fr)_44px] lg:grid-cols-[auto_minmax(0,1fr)_44px]',
      ].join(' ')}
    >
      {/* CONTROLS — left rail, collapsible */}
      <div className="row-span-2 flex min-h-0 flex-col lg:row-span-1 landscape:max-lg:row-span-1">
        <ControlRail
          collapsed={!railOpen}
          onToggleCollapse={() => setRailOpen(!railOpen)}
          running={running}
          finished={finished}
          onToggleRun={toggleRun}
          onReset={reset}
          onAdjust={adjust}
          soundOn={soundOn}
          onToggleSound={() => {
            const next = !soundOn;
            setSoundOn(next);
            notify(next ? 'Alarm on' : 'Alarm muted', 'info');
          }}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          duration={duration}
          onSetDuration={(minutes) => {
            setSessionDuration(minutes);
            notify(`Set to ${formatDuration(minutes)}`, 'success');
          }}
          notify={notify}
        />
      </div>

      {/* CLOCK */}
      <div className="flex min-h-[70vh] flex-col landscape:max-lg:min-h-0 lg:min-h-0">
        <Clock
          duration={duration}
          remaining={remaining}
          setRemaining={setRemaining}
          running={running}
          setRunning={setRunning}
          soundOn={soundOn}
          onToggleRun={toggleRun}
          onReset={reset}
          maximised={maximised}
          notify={notify}
        />
      </div>

      {/* TASKS — right panel, collapsible */}
      <aside
        className={[
          'relative min-h-0 border-t border-white/5 bg-neutral-900/20',
          'landscape:max-lg:border-t-0 landscape:max-lg:border-l',
          'lg:border-t-0 lg:border-l',
          todoOpen ? '' : 'overflow-hidden',
        ].join(' ')}
      >
        {todoOpen ? (
          <>
            <TaskList tasks={tasks} setTasks={setTasks} notify={notify} />
            <button
              type="button"
              onClick={() => setTodoOpen(false)}
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
        ) : (
          <CollapseRail
            onExpand={() => setTodoOpen(true)}
            done={doneCount}
            total={tasks.length}
          />
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