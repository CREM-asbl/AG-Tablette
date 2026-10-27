/**
 * TDD — sync différée hors paint initial (Prove-It).
 *
 * Exigences couvertes :
 * 1. Lazy init : aucun chargement du module de sync avant idle (first paint + idle).
 * 2. Worker : roundtrip compression/préparation des lots hors thread principal.
 * 3. Pas de forceDownload systématique : version identique => aucun appel réseau.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.unmock('@db/firebase-init');
vi.unmock('../../src/firebase/firebase-init.js');

import { scheduleDeferredSync } from '../../src/services/sync-scheduler';
import {
  calculateSyncProgress,
  chunkIntoBatches,
  decompressPayload,
  prepareActivityRecord,
  shouldDownloadFile,
} from '../../src/workers/sync.worker';

describe('scheduleDeferredSync — lazy après first paint + idle', () => {
  let idleCallback;
  let idleCancelled;

  const requestIdleFn = (cb) => {
    idleCallback = cb;
    return 42;
  };
  const cancelIdleFn = (id) => {
    idleCancelled = id;
  };

  const flushIdle = async () => {
    const cb = idleCallback;
    idleCallback = null;
    await cb();
  };

  const flushAsync = () => new Promise((resolve) => setTimeout(resolve, 0));

  beforeEach(() => {
    idleCallback = null;
    idleCancelled = null;
  });

  function makeOptions(overrides = {}) {
    return {
      requestIdleFn,
      cancelIdleFn,
      fallbackDelayMs: 5000,
      maxAgeHours: 24,
      isOnline: () => true,
      checkRecentSync: vi.fn(async () => false),
      loadSyncModule: vi.fn(async () => ({ smartSync: vi.fn(async () => 'completed') })),
      addOnlineListener: (cb) => {
        window.addEventListener('online', cb);
        return () => window.removeEventListener('online', cb);
      },
      ...overrides,
    };
  }

  it('ne charge pas le module de sync avant le déclenchement idle', async () => {
    const options = makeOptions();
    const handle = scheduleDeferredSync(options);

    expect(options.loadSyncModule).not.toHaveBeenCalled();

    await flushIdle();

    expect(options.loadSyncModule).toHaveBeenCalledTimes(1);
    handle.cancel();
  });

  it('ne planifie rien en idle quand hors ligne, mais réarme sur retour en ligne', async () => {
    let online = false;
    let idleCb = null;
    const options = makeOptions({
      requestIdleFn: (cb) => {
        idleCb = cb;
        return 7;
      },
      isOnline: () => online,
    });
    const handle = scheduleDeferredSync(options);

    expect(idleCb).toBeNull();
    expect(options.loadSyncModule).not.toHaveBeenCalled();

    online = true;
    window.dispatchEvent(new Event('online'));
    expect(typeof idleCb).toBe('function');

    const cb = idleCb;
    idleCb = null;
    await cb();
    await flushAsync();
    expect(options.loadSyncModule).toHaveBeenCalledTimes(1);
    handle.cancel();
  });

  it('replanifie une sync en idle sur reconnexion', async () => {
    let idleCb = null;
    const smartSync = vi.fn(async () => 'completed');
    const options = makeOptions({
      requestIdleFn: (cb) => {
        idleCb = cb;
        return 9;
      },
      loadSyncModule: vi.fn(async () => ({ smartSync })),
    });
    const handle = scheduleDeferredSync(options);

    const bootCb = idleCb;
    idleCb = null;
    await bootCb();
    await flushAsync();
    expect(smartSync).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new Event('online'));
    expect(typeof idleCb).toBe('function');

    const cb = idleCb;
    idleCb = null;
    await cb();
    await flushAsync();
    expect(smartSync).toHaveBeenCalledTimes(2);
    handle.cancel();
  });

  it('ignore la sync quand une sync récente est disponible (cooldown 24h)', async () => {
    const options = makeOptions({ checkRecentSync: vi.fn(async () => true) });
    const handle = scheduleDeferredSync(options);

    await flushIdle();

    expect(options.checkRecentSync).toHaveBeenCalledWith(24);
    expect(options.loadSyncModule).not.toHaveBeenCalled();
    handle.cancel();
  });

  it('cancel() avant idle empêche tout chargement, même après déclenchement', async () => {
    const options = makeOptions();
    const handle = scheduleDeferredSync(options);
    handle.cancel();

    expect(idleCancelled).toBe(42);
    expect(options.loadSyncModule).not.toHaveBeenCalled();

    await flushIdle();
    expect(options.loadSyncModule).not.toHaveBeenCalled();
  });
});

describe('sync worker — préparation des lots hors thread principal', () => {
  it('roundtrip préparation/compression : données intactes après décompression', () => {
    const payload = { id: 'a', title: 'Activité', shapes: [1, 2, 3] };
    const record = prepareActivityRecord('a', payload, 2, 1000, 2000);

    expect(record.id).toBe('a');
    expect(record.version).toBe(2);
    expect(record.compressed).toBe(true);
    expect(typeof record.data).toBe('string');

    const json = decompressPayload(record.data);
    expect(JSON.parse(json)).toEqual(payload);
  });

  it('découpe les pages en petits lots annulables (10-20 fichiers)', () => {
    const items = Array.from({ length: 45 }, (_, i) => ({ id: `f${i}` }));
    const batches = chunkIntoBatches(items, 20);

    expect(batches).toHaveLength(3);
    expect(batches[0]).toHaveLength(20);
    expect(batches[1]).toHaveLength(20);
    expect(batches[2]).toHaveLength(5);
  });

  it('détecte les téléchargements inutiles par comparaison de version', () => {
    expect(shouldDownloadFile(1, 2)).toBe(true);
    expect(shouldDownloadFile(0, 1)).toBe(true);
    expect(shouldDownloadFile(2, 2)).toBe(false);
    expect(shouldDownloadFile(3, 2)).toBe(false);
  });

  it('calcule la progression pondérée fichiers/thèmes', () => {
    expect(calculateSyncProgress(20, 20, 10, 10)).toBe(100);
    expect(calculateSyncProgress(10, 20, 5, 10)).toBe(50);
    expect(calculateSyncProgress(0, 0, 0, 0)).toBe(0);
  });
});

describe('readFileFromServer — pas de forceDownload systématique', () => {
  let storage;
  let idb;
  let readFileFromServer;
  let fetchMock;

  const setOnLine = (value) => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value });
  };

  beforeEach(async () => {
    vi.resetModules();
    setOnLine(true);

    vi.doMock('firebase/app', () => ({ initializeApp: vi.fn(() => ({})) }));
    vi.doMock('firebase/firestore', () => ({
      initializeFirestore: vi.fn(() => ({})),
      persistentLocalCache: vi.fn(() => ({})),
      collection: vi.fn(),
      doc: vi.fn(),
      getDoc: vi.fn(),
      getDocs: vi.fn(),
      getCountFromServer: vi.fn(),
      limit: vi.fn(),
      orderBy: vi.fn(),
      query: vi.fn(),
      startAfter: vi.fn(),
      where: vi.fn(),
    }));
    vi.doMock('firebase/storage', () => ({
      getStorage: vi.fn(() => ({})),
      ref: vi.fn((_s, filename) => ({ fullPath: filename })),
      getMetadata: vi.fn(),
      getDownloadURL: vi.fn(),
    }));
    vi.doMock('firebase/analytics', () => ({ getAnalytics: vi.fn(() => ({})) }));
    vi.doMock('firebase/performance', () => ({ getPerformance: vi.fn(() => ({})) }));

    idb = {
      getActivity: vi.fn(async () => null),
      saveActivity: vi.fn(async () => undefined),
      getAllModules: vi.fn(async () => []),
      getAllThemes: vi.fn(async () => []),
    };
    vi.doMock('../../src/utils/indexeddb-activities.js', () => idb);

    storage = await import('firebase/storage');
    ({ readFileFromServer } = await import('../../src/firebase/firebase-init.js'));

    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.donothing?.();
    vi.resetModules();
  });

  it('version identique : aucun appel réseau, copie locale servie', async () => {
    idb.getActivity.mockResolvedValue({
      data: { source: 'local' },
      version: 2,
      timestamp: Date.now(),
    });

    const result = await readFileFromServer('same-version.json', { expectedVersion: 2 });

    expect(result).toEqual({ source: 'local' });
    expect(storage.getMetadata).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('version obsolète : téléchargement frais sans flag forceDownload', async () => {
    idb.getActivity.mockResolvedValue({
      data: { source: 'stale' },
      version: 1,
      timestamp: Date.now() - 60_000,
    });
    storage.getMetadata.mockResolvedValue({
      updated: new Date().toISOString(),
    });
    storage.getDownloadURL.mockResolvedValue('https://example.com/fresh.json');
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ source: 'fresh' }) });

    const result = await readFileFromServer('stale-version.json', { expectedVersion: 2 });

    expect(result).toEqual({ source: 'fresh' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, fetchOptions] = fetchMock.mock.calls[0];
    expect(fetchOptions?.cache).not.toBe('reload');
  });
});
