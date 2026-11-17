export async function initializeOfflineSupportBootstrap() {
  const { initOfflineSupport } = await import('../utils/offline-init.js');
  initOfflineSupport();

  // Sync différée : après first paint + idle, seulement si en ligne et
  // sans sync récente (cooldown 24 h). Jamais bloquante pour le démarrage.
  // Le scheduler réarme une sync en idle sur reconnexion (offline-au-boot
  // ou sync déjà consommée), donc initActivitySync ne fait que poser le
  // listener 'online' sans auto-sync redondante au démarrage.
  try {
    const [{ scheduleDeferredSync }, { isRecentSyncAvailable }, { initActivitySync }] =
      await Promise.all([
        import('./sync-scheduler'),
        import('../utils/indexeddb-activities.js'),
        import('./activity-sync'),
      ]);
    initActivitySync();
    scheduleDeferredSync({
      maxAgeHours: 24,
      checkRecentSync: (maxAgeHours: number) => isRecentSyncAvailable(maxAgeHours),
    });
  } catch {
    // Sync différée best-effort : un échec ne bloque jamais le démarrage.
  }
}