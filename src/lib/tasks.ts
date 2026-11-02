export type Subtask = {
  id: string;
  text: string;
  done: boolean;
};

export type Task = {
  id: string;
  text: string;
  done: boolean;
  color: string;
  createdAt: number;
  /** checklist inside the task — set on the Tasks page */
  subtasks: Subtask[];
  /** completed timer sessions logged while this task was the focus task */
  sessions: number;
  /** total focused minutes across those sessions */
  focusMinutes: number;
};

/** Card palette — picked at random for every new task. */
export const PALETTE = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
  '#0ea5e9',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899',
] as const;

/** Pick a random card colour, avoiding an immediate repeat. */
export function randomColor(avoid?: string): string {
  const pool = PALETTE.filter((c) => c !== avoid);
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Readable foreground for a given background. */
export function readableOn(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  // relative luminance
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? '#0a0a0a' : '#ffffff';
}

/** hex -> rgba with the given alpha */
export function withAlpha(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/* ---------- constructors & migration ---------- */

/** Build a fresh task with the new fields defaulted. */
export function makeTask(text: string, avoidColor?: string): Task {
  return {
    id: uid(),
    text,
    done: false,
    color: randomColor(avoidColor),
    createdAt: Date.now(),
    subtasks: [],
    sessions: 0,
    focusMinutes: 0,
  };
}

/**
 * Fill in fields older stored tasks predate (subtasks, focus stats).
 * Passes untouched tasks through by reference so identity stays stable.
 */
export function normalizeTask(raw: Task): Task {
  if (
    Array.isArray(raw.subtasks) &&
    typeof raw.sessions === 'number' &&
    typeof raw.focusMinutes === 'number'
  ) {
    return raw;
  }

  const subtasks = Array.isArray(raw.subtasks)
    ? raw.subtasks
        .filter((s) => s && typeof s.text === 'string')
        .map((s) => ({ id: s.id || uid(), text: s.text, done: !!s.done }))
    : [];

  return {
    ...raw,
    subtasks,
    sessions: typeof raw.sessions === 'number' ? raw.sessions : 0,
    focusMinutes: typeof raw.focusMinutes === 'number' ? raw.focusMinutes : 0,
  };
}

export const normalizeTasks = (list: Task[]): Task[] =>
  list.map(normalizeTask);

/* ---------- pure task list operations ---------- */

export function toggleTask(tasks: Task[], id: string): Task[] {
  return tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
}

export function removeTask(tasks: Task[], id: string): Task[] {
  return tasks.filter((t) => t.id !== id);
}

/** Credit one completed session onto its focus task. */
export function logSession(
  tasks: Task[],
  id: string,
  minutes: number,
): Task[] {
  return tasks.map((t) =>
    t.id === id
      ? { ...t, sessions: t.sessions + 1, focusMinutes: t.focusMinutes + minutes }
      : t,
  );
}

export function addSubtask(
  tasks: Task[],
  taskId: string,
  text: string,
): Task[] {
  return tasks.map((t) =>
    t.id === taskId
      ? { ...t, subtasks: [...t.subtasks, { id: uid(), text, done: false }] }
      : t,
  );
}

export function toggleSubtask(
  tasks: Task[],
  taskId: string,
  subtaskId: string,
): Task[] {
  return tasks.map((t) =>
    t.id === taskId
      ? {
          ...t,
          subtasks: t.subtasks.map((s) =>
            s.id === subtaskId ? { ...s, done: !s.done } : s,
          ),
        }
      : t,
  );
}

export function removeSubtask(
  tasks: Task[],
  taskId: string,
  subtaskId: string,
): Task[] {
  return tasks.map((t) =>
    t.id === taskId
      ? { ...t, subtasks: t.subtasks.filter((s) => s.id !== subtaskId) }
      : t,
  );
}
