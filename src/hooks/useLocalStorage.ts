import { useLocalStorage as useCiteUiLocalStorage } from 'cite-ui';

/**
 * Typed wrapper around cite-ui's useLocalStorage.
 * Returns [value, setValue, remove] where setValue accepts a value or an updater.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  return useCiteUiLocalStorage(key, initialValue) as [
    T,
    (value: T | ((prev: T) => T)) => void,
    () => void,
  ];
}