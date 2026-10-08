'use client';
import { useEffect, useRef } from 'react';

/**
 * Runs `task` every `intervalMs`, but:
 *  - pauses entirely while the tab is hidden,
 *  - runs immediately when the tab becomes visible again,
 *  - backs off (x2, up to 60s) while the task keeps failing,
 *  - never overlaps two runs of the same task.
 */
export function useVisibilityPolling(
  task: () => Promise<unknown> | unknown,
  intervalMs: number,
  enabled: boolean = true
) {
  const taskRef = useRef(task);
  taskRef.current = task; // always call the latest closure, without restarting the timer

  useEffect(() => {
    if (!enabled) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    let delay = intervalMs;
    let running = false;
    let cancelled = false;

    const schedule = () => {
      if (cancelled || document.hidden) return;
      timer = setTimeout(run, delay);
    };

    const run = async () => {
      if (cancelled || running) return;
      running = true;
      try {
        await taskRef.current();
        delay = intervalMs;
      } catch {
        delay = Math.min(delay * 2, 60000);
      } finally {
        running = false;
        schedule();
      }
    };

    const onVisibility = () => {
      if (document.hidden) {
        if (timer) clearTimeout(timer);
        timer = null;
      } else {
        delay = intervalMs;
        run(); // catch up immediately on return
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    run();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [intervalMs, enabled]);
}