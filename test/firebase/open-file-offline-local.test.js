/**
 * TDD — ouverture hors ligne depuis le cache local (IndexedDB)
 *
 * Bug Trello « serveur file » : « Certaines activités ne semblent pas
 * accessibles hors ligne, mais après quelques essais elles sont lentes
 * alors qu'elles sont en cache. »
 *
 * Cause racine : openFileFromServer dépendait du doc Firestore `files`
 * pour l'environnement, même quand le contenu était déjà en IndexedDB.
 * Hors ligne, le doc n'étant pas en cache local → échec « Fichier non
 * trouvé » alors que l'activité existe localement.
 *
 * Fix : lire le contenu local en parallèle du doc, et déduire l'environnement
 * du contenu (envName) quand le doc est indisponible.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';

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
  ctrl.loadEnvironnement.mockResolvedValue(undefined);
  idb.saveActivity.mockResolvedValue(undefined);
  storage.getMetadata.mockResolvedValue({
    updated: new Date(1000).toISOString(),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('openFileFromServer — lecture locale hors ligne', () => {
  it('ouvre une activité hors ligne quand le contenu est en cache local (envName dans le contenu)', async () => {
    setNavigatorOnLine(false);
    // Doc Firestore absent du cache local → getDocFromCache rejette
    firestore.getDocFromCache.mockRejectedValue(new Error('miss'));
    // Contenu local présent avec envName
    idb.getActivity.mockResolvedValue({
      data: { envName: 'env-3', source: 'local', workspaceData: { objects: [] } },
      timestamp: Date.now(),
    });

    const notif = vi.fn();
    window.addEventListener('show-notif', notif);

    await openFileFromServer('activite-locale');

    window.removeEventListener('show-notif', notif);

    // Pas d'erreur notifiée
    expect(notif).not.toHaveBeenCalled();
    // Environnement chargé depuis le contenu local
    expect(ctrl.loadEnvironnement).toHaveBeenCalledWith('env-3');
    // Fichier parsé
    expect(ctrl.parseFile).toHaveBeenCalledWith(
      expect.objectContaining({ envName: 'env-3', source: 'local' }),
      'activite-locale',
    );
  });

  it('n\'appelle pas getDoc (réseau) quand le contenu local suffit hors ligne', async () => {
    setNavigatorOnLine(false);
    firestore.getDocFromCache.mockRejectedValue(new Error('miss'));
    idb.getActivity.mockResolvedValue({
      data: { envName: 'env-3', source: 'local', workspaceData: { objects: [] } },
      timestamp: Date.now(),
    });

    await openFileFromServer('activite-locale-2');

    // getDoc (réseau) ne doit pas être appelé
    expect(firestore.getDoc).not.toHaveBeenCalled();
  });

  it('garde la priorité au doc Firestore pour l\'environnement quand il est disponible', async () => {
    setNavigatorOnLine(true);
    // Doc en cache local avec environment
    firestore.getDocFromCache.mockResolvedValue({
      exists: () => true,
      data: () => ({ environment: 'env-9', title: 'Activité 9' }),
    });
    // Contenu local avec un envName DIFFÉRENT
    idb.getActivity.mockResolvedValue({
      data: { envName: 'env-3', source: 'local', workspaceData: { objects: [] } },
      timestamp: Date.now(),
    });

    await openFileFromServer('activite-doc-prioritaire');

    // L'environnement du doc doit être utilisé
    expect(ctrl.loadEnvironnement).toHaveBeenCalledWith('env-9');
  });

  it('tombe sur le contenu local si le doc n\'a pas d\'environment', async () => {
    setNavigatorOnLine(true);
    // Doc en cache local SANS environment
    firestore.getDocFromCache.mockResolvedValue({
      exists: () => true,
      data: () => ({ title: 'Activité sans env' }),
    });
    idb.getActivity.mockResolvedValue({
      data: { envName: 'env-5', source: 'local', workspaceData: { objects: [] } },
      timestamp: Date.now(),
    });

    await openFileFromServer('activite-doc-sans-env');

    expect(ctrl.loadEnvironnement).toHaveBeenCalledWith('env-5');
  });

  it('signale « Fichier non trouvé » quand ni doc ni contenu local n\'existent', async () => {
    setNavigatorOnLine(false);
    firestore.getDocFromCache.mockRejectedValue(new Error('miss'));
    idb.getActivity.mockResolvedValue(null);

    const notif = vi.fn();
    window.addEventListener('show-notif', notif);

    await openFileFromServer('activite-inexistante');

    window.removeEventListener('show-notif', notif);
    expect(notif).toHaveBeenCalledTimes(1);
    expect(notif.mock.calls[0][0].detail.message).toContain('Fichier non trouvé');
  });

  it('ne télécharge pas le fichier (getDownloadURL) quand le contenu est en cache local', async () => {
    setNavigatorOnLine(false);
    firestore.getDocFromCache.mockRejectedValue(new Error('miss'));
    idb.getActivity.mockResolvedValue({
      data: { envName: 'env-3', source: 'local', workspaceData: { objects: [] } },
      timestamp: Date.now(),
    });

    await openFileFromServer('activite-locale-3');

    expect(storage.getDownloadURL).not.toHaveBeenCalled();
  });
});