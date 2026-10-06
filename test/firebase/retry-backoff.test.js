/**
 * TDD Phase 4 — latence du retryWithBackoff
 *
 * Bug Trello « serveur file » : « Chargement des fichiers… » traîne. Sur un
 * réseau instable, chaque échec Firestore/fetch déclenche un backoff
 * 1000ms + 2000ms = 3s de latence ajoutée avant le prochain essai.
 *
 * Stratégie testée : backoff court (300ms) — 3 tentatives = 900ms max,
 * suffisant pour absorber un blip réseau sans figer l'interface.
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

import { retryWithBackoff } from '../../src/firebase/firebase-init.js';

describe('retryWithBackoff', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('réessaie après échec et retourne le résultat (backoff court)', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('échec 1'))
      .mockRejectedValueOnce(new Error('échec 2'))
      .mockResolvedValueOnce('ok');

    const start = Date.now();
    const result = await retryWithBackoff(fn);
    const elapsed = Date.now() - start;

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
    // Ancien backoff : 1000 + 2000 = 3000ms. Nouveau : 300 + 600 = 900ms.
    expect(elapsed).toBeLessThan(1500);
  });

  it('relance la dernière erreur après épuisement des tentatives', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('boom'));

    await expect(retryWithBackoff(fn)).rejects.toThrow('boom');
    expect(fn).toHaveBeenCalledTimes(3);
  });
});