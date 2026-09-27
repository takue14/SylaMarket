export function vibrate(pattern: number | number[] = 15) {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // no-op — some browsers throw if called outside a user gesture context
  }
}