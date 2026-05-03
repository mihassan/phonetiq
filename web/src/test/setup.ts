import '@testing-library/jest-dom/vitest'

// happy-dom does not implement localStorage; provide a minimal in-memory mock.
const _store = new Map<string, string>();
const localStorageMock: Storage = {
  get length() { return _store.size; },
  key(index: number) { return Array.from(_store.keys())[index] ?? null; },
  getItem(key: string) { return _store.has(key) ? _store.get(key)! : null; },
  setItem(key: string, value: string) { _store.set(key, value); },
  removeItem(key: string) { _store.delete(key); },
  clear() { _store.clear(); },
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: false });
