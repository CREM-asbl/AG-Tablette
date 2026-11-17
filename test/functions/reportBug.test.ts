import { beforeEach, describe, expect, it, vi } from 'vitest';

// Use vi.hoisted to ensure mocks are set up before imports
const { mockConfig, mockFetch, mockAdd, mockCollection, mockGetFirestore, mockInitializeApp } = vi.hoisted(() => ({
  mockConfig: vi.fn(() => ({ github: { token: 'mock-token' } })),
  mockFetch: vi.fn(),
  mockAdd: vi.fn(async () => ({ id: 'mock-doc-id' })),
  mockCollection: vi.fn(() => ({ add: mockAdd })),
  mockGetFirestore: vi.fn(() => ({ collection: mockCollection })),
  mockInitializeApp: vi.fn(),
}));

// Mock the modules BEFORE any imports - use vi.mock with factory
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

vi.mock('firebase-admin', () => ({
  apps: [],
  initializeApp: mockInitializeApp,
  firestore: vi.fn(() => ({ 
    collection: mockCollection,
    FieldValue: {
      serverTimestamp: vi.fn(() => new Date()),
    },
  })),
  FieldValue: {
    serverTimestamp: vi.fn(() => new Date()),
  },
}));

globalThis.fetch = mockFetch as any;

// Override require cache for BOTH firebase-functions AND firebase-admin BEFORE any imports
const Module = await import('module');
const originalRequire = Module.Module.prototype.require;
Module.Module.prototype.require = function(id: string) {
  if (id === 'firebase-functions') {
    return {
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
    };
  }
  if (id === 'firebase-admin') {
        const mockFirestore = vi.fn(() => ({ 
          collection: mockCollection,
        }));
        mockFirestore.FieldValue = {
          serverTimestamp: vi.fn(() => new Date()),
        };
        return {
          apps: [],
          initializeApp: mockInitializeApp,
          firestore: mockFirestore,
          FieldValue: {
            serverTimestamp: vi.fn(() => new Date()),
          },
        };
      }
  return originalRequire.call(this, id);
};

describe('reportBug Firebase Function', () => {
  let reportBug: any;

  beforeEach(async () => {
    vi.resetModules();
    mockConfig.mockImplementation(() => ({ github: { token: 'mock-token' } }));
    mockFetch.mockReset();
    mockAdd.mockClear();
    mockCollection.mockClear();
    mockGetFirestore.mockClear();
    mockInitializeApp.mockClear();
    
    // Import after mocks are set up and modules reset
    const { reportBug: fresh } = await import('../../functions/lib/reportBug.js');
    reportBug = fresh;
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
    ).rejects.toThrow(/GitHub API error 401/);
  });
});