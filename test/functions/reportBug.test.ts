import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock firebase-functions avant l'import du handler
const mockConfig = vi.fn(() => ({ github: { token: 'mock-token' } }));

vi.mock('firebase-functions', () => ({
  https: {
    HttpsError: class extends Error {
      code: string;
      constructor(code: string, message: string) {
        super(message);
        this.code = code;
        this.name = 'HttpsError';
      }
    },
    onCall: vi.fn(),
  },
  config: mockConfig,
}));

// Mock firebase-admin
const mockAdd = vi.fn(async () => ({ id: 'mock-doc-id' }));
const mockCollection = vi.fn(() => ({ add: mockAdd }));
const mockGetFirestore = vi.fn(() => ({ collection: mockCollection }));
const mockInitializeApp = vi.fn();

vi.mock('firebase-admin', () => ({
  apps: [],
  initializeApp: mockInitializeApp,
  firestore: {
    getFirestore: mockGetFirestore,
    FieldValue: {
      serverTimestamp: vi.fn(() => new Date()),
    },
  },
}));

// Mock globalThis.fetch pour l'API GitHub
const mockFetch = vi.fn();
globalThis.fetch = mockFetch as any;

// Importer le code compile (lib/) pour eviter les problemes de resolution TS
const { reportBug } = await import('../../functions/lib/reportBug.js');

describe('reportBug Firebase Function', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockAdd.mockClear();
    mockCollection.mockClear();
    mockGetFirestore.mockClear();
    mockInitializeApp.mockClear();
  });

  it('devrait creer l\'issue GitHub et enregistrer dans Firestore', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ number: 42, html_url: 'https://github.com/CREM-asbl/AG-Tablette/issues/42' }),
    });

    const request = {
      data: {
        severity: 'S0',
        message: 'Test error message',
        fingerprint: 'fp-123',
        source: 'canvas-render',
        sessionId: 'session-1',
        context: {
          version: '1.5.2',
          route: '/tool/create-circle',
          tool: 'create-circle',
          online: true,
          sw: false,
          userAgent: 'test-agent',
          timestamp: new Date().toISOString(),
        },
      },
      auth: null,
      app: null,
    } as any;

    const result = await reportBug(request);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/CREM-asbl/AG-Tablette/issues',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-token',
        }),
      }),
    );

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.title).toContain('[Bug S0]');
    expect(body.title).toContain('Test error message');
    expect(body.labels).toEqual(['bug', 'auto-report']);

    expect(mockAdd).toHaveBeenCalledTimes(1);
    expect(mockAdd.mock.calls[0][0].githubIssueNumber).toBe(42);
    expect(mockAdd.mock.calls[0][0].githubIssueUrl).toBe('https://github.com/CREM-asbl/AG-Tablette/issues/42');

    expect(result).toEqual({
      ok: true,
      issueNumber: 42,
      issueUrl: 'https://github.com/CREM-asbl/AG-Tablette/issues/42',
      bugDocId: 'mock-doc-id',
    });
  });

  it('devrait rejeter si le payload est manquant', async () => {
    await expect(reportBug({} as any)).rejects.toThrow();
  });

  it('devrait rejeter si severity ou message manquent', async () => {
    await expect(
      reportBug({ data: { severity: 'S0' } } as any),
    ).rejects.toThrow();
  });

  it('devrait rejeter si le token GitHub est manquant', async () => {
      mockConfig.mockReturnValueOnce({ github: {} });

      await expect(
      reportBug({
        data: {
          severity: 'S0',
          message: 'test',
          fingerprint: 'fp',
          source: 'unknown',
          sessionId: 's',
          context: { version: '1', route: '/', tool: null, online: true, sw: false, userAgent: 'ua', timestamp: '' },
        },
      } as any),
    ).rejects.toThrow(/GitHub token/);
  });

  it('devrait gerer l\'erreur de l\'API GitHub', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Bad credentials',
    });

    await expect(
      reportBug({
        data: {
          severity: 'S1',
          message: 'test',
          fingerprint: 'fp',
          source: 'unknown',
          sessionId: 's',
          context: { version: '1', route: '/', tool: null, online: true, sw: false, userAgent: 'ua', timestamp: '' },
        },
      } as any),
    ).rejects.toThrow(/401/);
  });
});