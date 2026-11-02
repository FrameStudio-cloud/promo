import { useCallback, useEffect, useMemo } from 'react';
import { ToastProvider, useToast } from 'cite-ui';
import Clock from './components/Clock';
import ControlRail from './components/ControlRail';
import TaskList from './components/TaskList';
import CollapseRail from './components/CollapseRail';
import TasksPage from './pages/TasksPage';
import type { Task } from './lib/tasks';
import { logSession, normalizeTasks } from './lib/tasks';
import { DEFAULT_MINUTES, formatDuration } from './lib/duration';
import { playChime } from './lib/audio';
import { useCountdown } from './hooks/useCountdown';
import { useHashRoute } from './hooks/useHashRoute';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useFullscreen } from './hooks/useFullscreen';

const STARTER: Task[] = [
  {
    id: 'seed-1',
    text: 'Try the tasks page',
    done: false,
    color: '#6366f1',
    createdAt: 3,
    subtasks: [
      { id: 'seed-1-a', text: 'Open a task and add a few steps', done: false },
      { id: 'seed-1-b', text: 'Mark the target — focus on it', done: false },
      { id: 'seed-1-c', text: 'Finish a session and see it logged', done: false },
    ],
    sessions: 0,
    focusMinutes: 0,
  },
  {
    id: 'seed-2',
    text: 'Review the plan before starting',
    done: false,
    color: '#22c55e',
    createdAt: 2,
    subtasks: [],
    sessions: 0,
    focusMinutes: 0,
  },
  {
    id: 'seed-3',
    text: 'Break — stand up, stretch, refill water',
    done: false,
    color: '#f59e0b',
    createdAt: 1,
    subtasks: [],
    sessions: 0,
    focusMinutes: 0,
  },
];

function Shell() {
  const { toast } = useToast();

  const [storedTasks, setStoredTasks] = useLocalStorage<Task[]>('pomo.tasks', STARTER);

  /* fill in fields older stored tasks predate — both for rendering and for
     every updater, so old installs are healed on their first write */
  const setTasks = useCallback(
    (updater: (prev: Task[]) => Task[]) =>
      setStoredTasks((raw) => updater(normalizeTasks(raw))),
    [setStoredTasks],
  );
  const tasks = useMemo(() => normalizeTasks(storedTasks), [storedTasks]);
  const [duration, setDuration] = useLocalStorage('pomo.duration', DEFAULT_MINUTES);
  const [remaining, setRemaining] = useLocalStorage('pomo.remaining', duration * 60);
  const [running, setRunning] = useLocalStorage('pomo.running', false);
  const [soundOn, setSoundOn] = useLocalStorage('pomo.sound', true);
  const [focusTaskId, setFocusTaskId] = useLocalStorage<string | null>(
    'pomo.focusTaskId',
    null,
  );

  /* the task focus sessions log onto, if the id still resolves */
  const focusTask = useMemo(
    () => tasks.find((t) => t.id === focusTaskId) ?? null,
    [tasks, focusTaskId],
  );

  /* drop the focus mark if its task is gone */
  useEffect(() => {
    if (focusTaskId && !focusTask) setFocusTaskId(null);
  }, [focusTaskId, focusTask, setFocusTaskId]);

  const [railOpen, setRailOpen] = useLocalStorage('pomo.railOpen', false);
  const [todoOpen, setTodoOpen] = useLocalStorage('pomo.todoOpen', true);

  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
  const [route, navigate] = useHashRoute();

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

  /* focus mark — tap again to clear */
  const setFocus = useCallback(
    (id: string) => setFocusTaskId((prev) => (prev === id ? null : id)),
    [setFocusTaskId],
  );

  /* the countdown itself — lifted here so it survives page changes */
  const onComplete = useCallback(() => {
    if (soundOn) playChime();
    if (focusTask) {
      setTasks((prev) => logSession(prev, focusTask.id, duration));
      notify(
        `Time's up — ${formatDuration(duration)} logged to "${focusTask.text}"`,
        'success',
      );
    } else {
      notify(`Time's up — ${formatDuration(duration)} done`, 'success');
    }
  }, [soundOn, focusTask, duration, setTasks, notify]);

  useCountdown({ running, remaining, setRemaining, setRunning, onComplete });

  /* ---------------- the tasks page ---------------- */

  if (route === 'tasks') {
    return (
      <TasksPage
        tasks={tasks}
        setTasks={setTasks}
        focusTaskId={focusTaskId}
        focusTask={focusTask}
        onSetFocus={setFocus}
        remaining={remaining}
        running={running}
        onToggleRun={toggleRun}
        onOpenTimer={() => navigate('timer')}
        notify={notify}
      />
    );
  }

  /* ---------------- the timer ---------------- */

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
          onOpenTasks={() => navigate('tasks')}
        />
      </div>

      {/* CLOCK */}
      <div className="flex min-h-[70vh] flex-col landscape:max-lg:min-h-0 lg:min-h-0">
        <Clock
          remaining={remaining}
          running={running}
          onToggleRun={toggleRun}
          onReset={reset}
          maximised={maximised}
          focusTask={focusTask}
          onOpenTasks={() => navigate('tasks')}
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
            <TaskList
              tasks={tasks}
              setTasks={setTasks}
              focusTaskId={focusTaskId}
              onSetFocus={setFocus}
              onOpenTasks={() => navigate('tasks')}
              notify={notify}
            />
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
