/* ────────── coalesce overlapping reads without caching authenticated responses ────────── */
export function createReadQueue<T>(read: () => Promise<T>) {
  let running: Promise<T> | undefined, again = false;
  return () => {
    if (running) { again = true; return running; }
    running = Promise.resolve().then(async () => {
      try {
        let value: T;
        do { again = false; value = await read(); } while (again);
        return value!;
      } finally { running = undefined; }
    });
    return running;
  };
}
// Stable references keep unchanged collections from rerendering every poll.
export function reconcileCollections<T extends object>(previous: T, next: T): T {
  let changed = Object.keys(previous).length !== Object.keys(next).length;
  const result = { ...next };
  for (const key of Object.keys(next) as (keyof T)[]) {
    if (JSON.stringify(previous[key]) === JSON.stringify(next[key])) result[key] = previous[key];
    else changed = true;
  }
  return changed ? result : previous;
}
