import { useEffect, useState } from 'react';

const DEV_DEBUG_STORAGE_KEY = 'phonetiq:devDebugEnabled';

function getStorage() {
  if (
    typeof window !== 'undefined' &&
    window.localStorage &&
    typeof window.localStorage.getItem === 'function' &&
    typeof window.localStorage.setItem === 'function'
  ) {
    return window.localStorage;
  }

  return null;
}

function readStoredDebugEnabled() {
  const storage = getStorage();
  if (!storage) return null;

  const raw = storage.getItem(DEV_DEBUG_STORAGE_KEY);
  if (raw === null) return null;
  return raw === '1';
}

export function useDevDebugMode() {
  const isDevelopment = import.meta.env.DEV;

  const [debugEnabled, setDebugEnabled] = useState(() => {
    if (!isDevelopment) return false;
    const stored = readStoredDebugEnabled();
    return stored ?? true;
  });

  useEffect(() => {
    if (!isDevelopment) return;

    const storage = getStorage();
    if (!storage) return;

    storage.setItem(DEV_DEBUG_STORAGE_KEY, debugEnabled ? '1' : '0');
  }, [debugEnabled, isDevelopment]);

  return {
    debugEnabled: isDevelopment ? debugEnabled : false,
    setDebugEnabled: isDevelopment ? setDebugEnabled : () => {},
  } as const;
}
