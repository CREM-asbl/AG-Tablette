// Setup pour les tests Vitest - mocks des APIs browser
import { vi } from 'vitest';

// Mock IndexedDB pour éviter les erreurs dans JSDOM
global.indexedDB = {
  open: vi.fn(() => ({
    result: { transaction: vi.fn() },
    onerror: vi.fn(),
    onsuccess: vi.fn(),
  })),
  deleteDatabase: vi.fn(),
} as any;

// Mock dialog.showModal() pour les popups
Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
  value: vi.fn(),
  writable: true,
});

Object.defineProperty(HTMLDialogElement.prototype, 'close', {
  value: vi.fn(),
  writable: true,
});

// Mock focus() pour les éléments
Object.defineProperty(HTMLElement.prototype, 'focus', {
  value: vi.fn(),
  writable: true,
});

// Mock Firebase auth pour éviter les erreurs
vi.mock('@db/firebase-init', () => ({
  findAllThemes: vi.fn(() => Promise.resolve([])),
  findAllFiles: vi.fn(() => Promise.resolve([])),
  downloadFileZip: vi.fn(() => Promise.resolve()),
}));

vi.mock('@services/activity-sync', () => ({
  getLastSyncInfo: vi.fn(() => Promise.resolve(null)),
}));

vi.mock('@store/notions', () => ({
  cachedThemes: {
    get: vi.fn(() => []),
    set: vi.fn(),
  },
  selectedSequence: {
    get: vi.fn(() => ''),
  },
}));

vi.mock('@store/syncState', () => ({
  syncInProgress: { value: false },
}));

// Mock window.dev_mode
Object.defineProperty(window, 'dev_mode', {
  value: true,
  writable: true,
});