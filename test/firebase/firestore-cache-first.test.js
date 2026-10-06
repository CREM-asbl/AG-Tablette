/**
 * TDD Phase 2 — cache Firestore local d'abord
 *
 * Bug Trello « serveur file » : la chaîne de lecture passe par
 * getFileDocFromFilename / getFilesDocFromModule qui sont server-first
 * (getDoc / getDocs sans lecture du cache local). Avec persistentLocalCache,
 * getDocFromCache / getDocsFromCache lisent localement (rapide) : on doit les
 * tenter AVANT tout aller-retour réseau.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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
  getDocFromCache: vi.fn(),
  getDocs: vi.fn(),
  getDocsFromCache: vi.fn(),
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

import {
  getFileDocFromFilename,
  getFilesDocFromModule,
} from '../../src/firebase/firebase-init.js';
import * as firestore from 'firebase/firestore';

function setNavigatorOnLine(value) {
  Object.defineProperty(navigator, 'onLine', { configurable: true, value });
}

beforeEach(() => {
  vi.clearAllMocks();
  setNavigatorOnLine(true);
  idb.getActivity.mockResolvedValue(null);
  idb.saveActivity.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getFileDocFromFilename — Phase 2 : cache Firestore local d\'abord', () => {
  it('sert le doc depuis getDocFromCache sans appel réseau (getDoc non appelé)', async () => {
    firestore.getDocFromCache.mockResolvedValue({
      exists: () => true,
      data: () => ({ environment: 'env-a', title: 'Activité A' }),
    });

    const result = await getFileDocFromFilename('p2-doc-cache-hit');

    expect(result).toMatchObject({
      id: 'p2-doc-cache-hit',
      environment: 'env-a',
      title: 'Activité A',
    });
    expect(firestore.getDoc).not.toHaveBeenCalled();
  });

  it('repli serveur (getDoc) quand le cache local n\'a pas le doc', async () => {
    firestore.getDocFromCache.mockRejectedValue(
      new Error('Failed to get document from cache.'),
    );
    firestore.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ environment: 'env-b' }),
    });

    const result = await getFileDocFromFilename('p2-doc-cache-miss');

    expect(result).toMatchObject({ id: 'p2-doc-cache-miss', environment: 'env-b' });
    expect(firestore.getDoc).toHaveBeenCalled();
  });

  it('hors ligne + cache vide : retourne null sans appel serveur', async () => {
    setNavigatorOnLine(false);
    firestore.getDocFromCache.mockRejectedValue(
      new Error('Failed to get document from cache.'),
    );

    const result = await getFileDocFromFilename('p2-doc-offline');

    expect(result).toBeNull();
    expect(firestore.getDoc).not.toHaveBeenCalled();
  });
});

describe('getFilesDocFromModule — Phase 2 : cache Firestore local d\'abord', () => {
  it('sert la liste depuis getDocsFromCache sans appel réseau (getDocs non appelé)', async () => {
    const cachedDocs = [
      { id: 'f1', data: () => ({ name: 'Fichier 1' }) },
      { id: 'f2', data: () => ({ name: 'Fichier 2' }) },
    ];
    firestore.getDocsFromCache.mockResolvedValue({
      forEach: (cb) => cachedDocs.forEach(cb),
    });

    const result = await getFilesDocFromModule('module-ref');

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ id: 'f1', name: 'Fichier 1' });
    expect(firestore.getDocs).not.toHaveBeenCalled();
  });

  it('repli serveur (getDocs) quand le cache local est vide ou absent', async () => {
    firestore.getDocsFromCache.mockRejectedValue(
      new Error('Failed to get documents from cache.'),
    );
    const serverDocs = [{ id: 'f3', data: () => ({ name: 'Fichier 3' }) }];
    firestore.getDocs.mockResolvedValue({
      forEach: (cb) => serverDocs.forEach(cb),
    });

    const result = await getFilesDocFromModule('module-ref-2');

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 'f3', name: 'Fichier 3' });
    expect(firestore.getDocs).toHaveBeenCalled();
  });
});