export async function initializeOfflineSupportBootstrap() {
  const { initOfflineSupport } = await import('../utils/offline-init.js');
  initOfflineSupport();
}