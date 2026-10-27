/**
 * Planificateur de synchronisation différée.
 *
 * La sync ne démarre jamais pendant le paint initial : elle attend
 * requestIdleCallback (fallback setTimeout pour Safari) puis vérifie
 * connexion + cooldown avant de charger le module de sync.
 */

export interface DeferredSyncOptions {
  requestIdleFn?: (_cb: () => void) => number;
  cancelIdleFn?: (_id: number) => void;
  fallbackDelayMs?: number;
  maxAgeHours?: number;
  isOnline?: () => boolean;
  checkRecentSync?: (_maxAgeHours: number) => Promise<boolean>;
  loadSyncModule?: () => Promise<{ smartSync: (_opts?: object) => Promise<unknown> }>;
  addOnlineListener?: (_cb: () => void) => () => void;
}

export interface DeferredSyncHandle {
  cancel: () => void;
}

const DEFAULT_FALLBACK_DELAY_MS = 5000;

function defaultRequestIdle(callback: () => void): number {
  const ric = (globalThis as unknown as { requestIdleCallback?: (_cb: () => void) => number })
    .requestIdleCallback;
  if (typeof ric === 'function') {
    return ric.call(globalThis, callback);
  }
  return Number(
    setTimeout(callback, DEFAULT_FALLBACK_DELAY_MS) as unknown as number,
  );
}

function defaultCancelIdle(id: number): void {
  const cic = (globalThis as unknown as { cancelIdleCallback?: (_id: number) => void })
    .cancelIdleCallback;
  if (typeof cic === 'function') {
    cic.call(globalThis, id);
    return;
  }
  clearTimeout(id);
}

export function scheduleDeferredSync(options: DeferredSyncOptions = {}): DeferredSyncHandle {
  const {
    requestIdleFn = defaultRequestIdle,
    cancelIdleFn = defaultCancelIdle,
    fallbackDelayMs = DEFAULT_FALLBACK_DELAY_MS,
    maxAgeHours = 24,
    isOnline = () => (typeof navigator !== 'undefined' ? navigator.onLine : true),
    checkRecentSync = async () => false,
    loadSyncModule = async () => {
      const mod = await import('./activity-sync');
      return mod as unknown as { smartSync: (_opts?: object) => Promise<unknown> };
    },
    addOnlineListener = (cb: () => void) => {
      if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
        window.addEventListener('online', cb);
        return () => window.removeEventListener('online', cb);
      }
      return () => {};
    },
  } = options;

  let idleId: number | null = null;
  let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
  let cancelled = false;
  let removeOnlineListener: (() => void) | null = null;

  const run = async () => {
    if (cancelled) return;
    if (!isOnline()) return;
    try {
      if (await checkRecentSync(maxAgeHours)) return;
    } catch {
      return;
    }
    if (cancelled) return;
    try {
      const mod = await loadSyncModule();
      if (cancelled) return;
      await mod.smartSync();
    } catch {
      // Sync différée : jamais bloquante, erreurs silencieuses.
    }
  };

  const scheduleWithFallback = () => {
    try {
      idleId = requestIdleFn(() => {
        idleId = null;
        void run();
      });
    } catch {
      fallbackTimer = setTimeout(() => {
        fallbackTimer = null;
        void run();
      }, fallbackDelayMs);
    }
  };

  const cancel = () => {
    cancelled = true;
    if (removeOnlineListener !== null) {
      try {
        removeOnlineListener();
      } catch {
        // Ignorer : annulation best-effort.
      }
      removeOnlineListener = null;
    }
    if (idleId !== null) {
      try {
        cancelIdleFn(idleId);
      } catch {
        // Ignorer : annulation best-effort.
      }
      idleId = null;
    }
    if (fallbackTimer !== null) {
      clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
  };

  const armOnlineReschedule = () => {
    if (removeOnlineListener !== null || cancelled) return;
    try {
      removeOnlineListener = addOnlineListener(() => {
        if (cancelled) return;
        if (!isOnline()) return;
        if (removeOnlineListener !== null) {
          try {
            removeOnlineListener();
          } catch {
            // Ignorer : annulation best-effort.
          }
          removeOnlineListener = null;
        }
        scheduleWithFallback();
      });
    } catch {
      // Listener online indisponible : sync différée abandonnée sans bloquer.
    }
  };

  if (!isOnline()) {
    armOnlineReschedule();
    return { cancel };
  }

  // Safari sans requestIdleCallback : le défaut ci-dessus bascule sur setTimeout.
  scheduleWithFallback();
  armOnlineReschedule();

  return { cancel };
}
