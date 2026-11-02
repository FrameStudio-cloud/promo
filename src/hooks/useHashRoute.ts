import { useCallback, useEffect, useState } from 'react';

export type Route = 'timer' | 'tasks';

/** `#`, `#/` and `#/timer` are all the timer; `#/tasks…` is the tasks page. */
const parse = (): Route => {
  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  return hash.startsWith('tasks') ? 'tasks' : 'timer';
};

/**
 * Tiny hash router — no dependency, works offline, and the phone's back
 * button moves between the timer and the tasks page for free.
 */
export function useHashRoute(): [Route, (route: Route) => void] {
  const [route, setRoute] = useState<Route>(parse);

  useEffect(() => {
    const onHash = () => setRoute(parse());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = useCallback((target: Route) => {
    const hash = `#/${target}`;
    if (window.location.hash === hash) return;
    window.location.hash = hash;
  }, []);

  return [route, navigate];
}
