/**
 * Fonction utilitaire pour débouncer les mises à jour
 * @param fn Fonction à débouncer
 * @param delay Délai en millisecondes
 * @returns Fonction débouncée
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: number | undefined;

  return (...args: Parameters<T>) => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    timeoutId = window.setTimeout(() => {
      fn(...args);
      timeoutId = undefined;
    }, delay);
  };
}

/**
 * Fonction utilitaire pour throttler les mises à jour
 * @param fn Fonction à throttler
 * @param delay Délai en millisecondes
 * @returns Fonction throttlée
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: number | undefined;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall >= delay) {
      lastCall = now;
      fn(...args);
    } else if (timeoutId === undefined) {
      timeoutId = window.setTimeout(() => {
        lastCall = Date.now();
        fn(...args);
        timeoutId = undefined;
      }, delay - timeSinceLastCall);
    }
  };
}
