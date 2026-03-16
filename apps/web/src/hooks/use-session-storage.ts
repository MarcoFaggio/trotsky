"use client";

import { useState, useEffect, useCallback } from "react";

export function useSessionStorage<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(defaultValue);

  useEffect(() => {
    try {
      const item = sessionStorage.getItem(key);
      if (item !== null) {
        setStoredValue(JSON.parse(item));
      }
    } catch {
      // sessionStorage not available (SSR) or parse error
    }
  }, [key]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const nextValue = value instanceof Function ? value(prev) : value;
        try {
          sessionStorage.setItem(key, JSON.stringify(nextValue));
        } catch {
          // quota exceeded or unavailable
        }
        return nextValue;
      });
    },
    [key]
  );

  return [storedValue, setValue];
}
