export async function initializeNotionsCacheBootstrap() {
  const module = await import('./notions-cache.service');
  return module.initializeCachesFromIndexedDB();
}