/**
 * TDD Phase 3 — ouverture parallèle dans openFileFromServer
 *
 * Bug Trello « serveur file » : « Chargement des fichiers… » traîne alors que
 * l'élément est déjà en cache. Cause : chaîne entièrement séquentielle —
 * doc Firestore → imports des contrôleurs → loadEnvironnement →
 * readFileFromServer → parseFile. Chaque await additionne sa latence.
 *
 * Stratégie testée : charger les contrôleurs pendant la lecture du doc, et
 * charger l'environnement pendant la lecture du fichier (Promise.all),
 * en conservant l'ordre parseFile et le show-notif en cas d'erreur.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';

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

const ctrl = vi.hoisted(() => ({
  loadEnvironnement: vi.fn(),
  parseFile: vi.fn(),
  envFactoryCalled: false,
}));

// Premier import du module Environment = début réel du chargement des contrôleurs
vi.mock('../../src/controllers/Core/Environment.js', () => {
  ctrl.envFactoryCalled = true;
  return { loadEnvironnement: ctrl.loadEnvironnement };
});

vi.mock('../../src/controllers/Core/Managers/OpenFileManager.js', () => ({
  OpenFileManager: { parseFile: ctrl.parseFile },
  parseFile: ctrl.parseFile,
}));

import { openFileFromServer } from '../../src/firebase/firebase-init.js';
import { app } from '../../src/controllers/Core/App';
import * as firestore from 'firebase/firestore';
import * as storage from 'firebase/storage';

function setNavigatorOnLine(value) {
  Object.defineProperty(navigator, 'onLine', { configurable: true, value });
}

beforeAll(() => {
  app.started = true;
});

beforeEach(() => {
  vi.clearAllMocks();
  setNavigatorOnLine(true);
  // doc Firestore en cache local : présent immédiatement
  firestore.getDocFromCache.mockResolvedValue({
    exists: () => true,
    data: () => ({ environment: 'env-3', title: 'Activité 3' }),
  });
  // fichier déjà en IndexedDB : servable sans réseau
  idb.getActivity.mockResolvedValue({
    data: { source: 'local' },
    timestamp: Date.now(),
  });
  idb.saveActivity.mockResolvedValue(undefined);
  // rafraîchissement de fond : serveur plus ancien que le local → stop immédiat
  storage.getMetadata.mockResolvedValue({
    updated: new Date(1000).toISOString(),
  });
  ctrl.loadEnvironnement.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('openFileFromServer — Phase 3 : lectures parallèles', () => {
  it('charge les contrôleurs pendant la lecture du doc Firestore', async () => {
    let resolveDoc;
    firestore.getDocFromCache.mockReturnValue(
      new Promise((resolve) => {
        resolveDoc = resolve;
      }),
    );

    const opening = openFileFromServer('p3-parallel-imports');

    // doc toujours en attente : les imports doivent déjà avoir démarré
    await vi.waitFor(() => expect(ctrl.envFactoryCalled).toBe(true));

    resolveDoc({
      exists: () => true,
      data: () => ({ environment: 'env-3', title: 'Activité 3' }),
    });
    await opening;
    expect(ctrl.parseFile).toHaveBeenCalledWith(
      { source: 'local' },
      'p3-parallel-imports',
    );
  });

  it("lit le fichier pendant que l'environnement se charge", async () => {
    let resolveEnv;
    ctrl.loadEnvironnement.mockReturnValue(
      new Promise((resolve) => {
        resolveEnv = resolve;
      }),
    );

    const opening = openFileFromServer('p3-parallel-env-file');

    // loadEnvironnement encore bloqué : readFileFromServer doit déjà avoir lu l'IDB
    await vi.waitFor(() =>
      expect(idb.getActivity).toHaveBeenCalledWith('p3-parallel-env-file'),
    );

    resolveEnv();
    await opening;
    expect(ctrl.parseFile).toHaveBeenCalledWith(
      { source: 'local' },
      'p3-parallel-env-file',
    );
  });

  it('signale « Fichier non trouvé » quand le doc est introuvable hors ligne', async () => {
    setNavigatorOnLine(false);
    firestore.getDocFromCache.mockRejectedValue(new Error('miss'));
    const notif = vi.fn();
    window.addEventListener('show-notif', notif);

    await openFileFromServer('p3-introuvable');

    window.removeEventListener('show-notif', notif);
    expect(notif).toHaveBeenCalledTimes(1);
    expect(notif.mock.calls[0][0].detail.message).toContain('Fichier non trouvé');
  });
});
