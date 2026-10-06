/**
 * TDD Phase 1 — cache-first pour readFileFromServer
 *
 * Bug Trello « serveur file » : « Chargement des fichiers… » traîne alors que
 * l'élément est déjà en cache. Cause : getMetadata (aller-retour réseau) bloque
 * AVANT toute lecture IndexedDB, et le moindre écart d'horloge (serveur > local)
 * force un re-téléchargement avec fetch({ cache: 'reload' }).
 *
 * Stratégie testée : stale-while-revalidate — servir la copie locale
 * immédiatement, rafraîchir en arrière-plan sans bloquer.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Annule le mock global de setup.ts pour tester le vrai module
vi.unmock('@db/firebase-init');
vi.unmock('../../src/firebase/firebase-init.js');

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({ name: 'test-app' })),
}));

vi.mock('firebase/firestore', () => ({
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

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
  ref: vi.fn((_storage, filename) => ({ fullPath: filename })),
  getMetadata: vi.fn(),
  getDownloadURL: vi.fn(),
}));

vi.mock('firebase/analytics', () => ({ getAnalytics: vi.fn(() => ({})) }));
vi.mock('firebase/performance', () => ({ getPerformance: vi.fn(() => ({})) }));

const idb = vi.hoisted(() => ({
  getActivity: vi.fn(),
  saveActivity: vi.fn(),
  getAllModules: vi.fn(),
  getAllThemes: vi.fn(),
}));

vi.mock('../../src/utils/indexeddb-activities.js', () => idb);

import { readFileFromServer } from '../../src/firebase/firebase-init.js';
import * as storage from 'firebase/storage';

const NEVER = new Promise(() => {});

let fetchMock;

function setNavigatorOnLine(value) {
  Object.defineProperty(navigator, 'onLine', { configurable: true, value });
}

beforeEach(() => {
  vi.clearAllMocks();
  setNavigatorOnLine(true);
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  idb.getActivity.mockResolvedValue(null);
  idb.saveActivity.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('readFileFromServer — Phase 1 : cache-first local (stale-while-revalidate)', () => {
  it("sert la copie locale sans attendre getMetadata (réseau non bloquant)", async () => {
    // getMetadata ne se résout jamais : si le réseau bloque encore la lecture, timeout
    storage.getMetadata.mockReturnValue(NEVER);
    idb.getActivity.mockResolvedValue({ data: { source: 'local' }, timestamp: Date.now() });

    const result = await readFileFromServer('p1-local-first.json');

    expect(result).toEqual({ source: 'local' });
    // le rafraîchissement réseau part quand même, en arrière-plan
    await vi.waitFor(() => expect(storage.getMetadata).toHaveBeenCalled());
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("télécharge sans fetch({ cache: 'reload' }) qui court-circuite le cache HTTP", async () => {
    storage.getMetadata.mockResolvedValue({
      updated: new Date(Date.now() - 60_000).toISOString(),
    });
    storage.getDownloadURL.mockResolvedValue('https://example.com/p1-download.json');
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ source: 'server' }),
    });

    const result = await readFileFromServer('p1-download.json');

    expect(result).toEqual({ source: 'server' });
    expect(fetchMock).toHaveBeenCalled();
    const [, options] = fetchMock.mock.calls[0];
    expect(options?.cache).not.toBe('reload');
  });

  it("tolère un décalage d'horloge : local de 2 s plus ancien que le serveur reste servi", async () => {
    const now = Date.now();
    idb.getActivity.mockResolvedValue({
      data: { source: 'local' },
      timestamp: now - 2_000,
    });
    storage.getMetadata.mockResolvedValue({ updated: new Date(now).toISOString() });

    const result = await readFileFromServer('p1-clock-skew.json');

    expect(result).toEqual({ source: 'local' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('hors ligne : sert le local sans aucun appel réseau', async () => {
    setNavigatorOnLine(false);
    idb.getActivity.mockResolvedValue({ data: { source: 'offline' }, timestamp: 123 });

    const result = await readFileFromServer('p1-offline.json');

    expect(result).toEqual({ source: 'offline' });
    expect(storage.getMetadata).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
