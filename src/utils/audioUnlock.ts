// Singleton audio element unlocked during the Join tap (user gesture).
// iOS Safari requires audio.play() to be called synchronously within a user gesture.
// By unlocking here and reusing the same element later, playback works without additional taps.

let _el: HTMLAudioElement | null = null;

export function unlockAudioOnGesture(): void {
  if (!_el) _el = new Audio();
  _el.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
  _el.play().then(() => _el!.pause()).catch(() => {});
}

export function getUnlockedAudioElement(): HTMLAudioElement | null {
  return _el;
}
