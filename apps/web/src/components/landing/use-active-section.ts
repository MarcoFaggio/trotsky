"use client";

import { useEffect, useState } from "react";

/**
 * Tracks which page section currently sits under the top of the viewport so
 * the nav can mark it. Uses one IntersectionObserver rather than a scroll
 * listener — cheap, and it only fires when a boundary is crossed.
 */
export function useActiveSection(ids: readonly string[]) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (elements.length === 0) return;

    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.set(entry.target.id, entry.boundingClientRect.top);
          } else {
            visible.delete(entry.target.id);
          }
        }
        if (visible.size === 0) {
          setActive(null);
          return;
        }
        // The highest section still in the observation band wins.
        const [topmost] = [...visible.entries()].sort((a, b) => a[1] - b[1]);
        setActive(topmost[0]);
      },
      // A band across the upper-middle of the viewport, so a section becomes
      // active as its heading arrives rather than when its first pixel appears.
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [ids]);

  return active;
}
