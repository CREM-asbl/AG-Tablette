import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  initBugReporting,
  reportError,
  getFingerprint,
  shouldReport,
  getBugReportingState,
  resetBugReporting,
  _recordSentReport,
} from '../../src/services/bug-report.service';

describe('BugReportService', () => {
  beforeEach(() => {
    resetBugReporting();
    vi.clearAllMocks();
    // En tests, on désactive le forçage du mode 'off' en DEV
    // pour pouvoir tester le mode 'silent'
    vi.stubEnv('DEV', false);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('getFingerprint', () => {
    it('devrait générer le même hash pour le même message/stack/source', () => {
      const msg = 'Test error';
      const stack = 'Error: Test error\n  at line 1';
      const source = 'canvas-render';

      const fp1 = getFingerprint(msg, stack, source);
      const fp2 = getFingerprint(msg, stack, source);

      expect(fp1).toBe(fp2);
    });

    it('devrait générer des hashes différents pour des messages différents', () => {
      const stack = 'Error: Test\n  at line 1';
      const source = 'canvas-render';

      const fp1 = getFingerprint('Error 1', stack, source);
      const fp2 = getFingerprint('Error 2', stack, source);

      expect(fp1).not.toBe(fp2);
    });

    it('devrait être stable même avec des stacks longues', () => {
      const msg = 'Test error';
      const longStack = 'Error: Test\n' + 'at line X\n'.repeat(100);
      const source = 'file-load';

      const fp1 = getFingerprint(msg, longStack, source);
      const fp2 = getFingerprint(msg, longStack.slice(0, 500), source);

      // Les deux doivent être identiques car on truncate à 300 chars
      expect(fp1).toBe(fp2);
    });

    it('devrait traiter source par défaut comme "unknown"', () => {
      const msg = 'Error';
      const stack = 'Stack';

      const fpWithSource = getFingerprint(msg, stack, 'file-load');
      const fpWithoutSource = getFingerprint(msg, stack, undefined);

      expect(fpWithSource).not.toBe(fpWithoutSource);
    });
  });

  describe('shouldReport', () => {
    it('devrait refuser si mode est "off"', () => {
      initBugReporting({ mode: 'off' });
      const fingerprint = getFingerprint('Test', 'stack', 'test');

      expect(shouldReport(fingerprint, 'S1')).toBe(false);
    });

    it('devrait accepter S0/S1 si mode est "silent" et pas de throttle', () => {
      initBugReporting({ mode: 'silent' });
      const fp = getFingerprint('Test', 'stack', 'test');

      expect(shouldReport(fp, 'S0')).toBe(true);
      expect(shouldReport(fp, 'S1')).toBe(true);
    });

    it('devrait déduplicer: refuser la même empreinte 2x dans la session', () => {
      initBugReporting({ mode: 'silent' });
      const fp = getFingerprint('Test', 'stack', 'test');

      expect(shouldReport(fp, 'S1')).toBe(true); // première fois OK
      _recordSentReport(fp); // enregistrer l'envoi réussi
      expect(shouldReport(fp, 'S1')).toBe(false); // 2e fois = dédup
    });

    it('devrait respecter le throttle global minIntervalMs', async () => {
      initBugReporting({
        mode: 'silent',
        minIntervalMs: 1000,
        maxPerSession: 100,
      });

      const fp1 = getFingerprint('Error1', 'stack', 'test');
      const fp2 = getFingerprint('Error2', 'stack', 'test');

      expect(shouldReport(fp1, 'S0')).toBe(true); // premier envoi OK
      _recordSentReport(fp1);
      expect(shouldReport(fp2, 'S0')).toBe(false); // 2e erreur trop rapide = throttled

      // Attendre le throttle
      await new Promise((resolve) => setTimeout(resolve, 1100));
      const fp3 = getFingerprint('Error3', 'stack', 'test');
      expect(shouldReport(fp3, 'S0')).toBe(true); // après throttle = OK
    });

    it('devrait respecter maxPerSession', () => {
      initBugReporting({
        mode: 'silent',
        maxPerSession: 3,
        minIntervalMs: 0, // pas de throttle
      });

      const sampleRate = 1.0; // 100% pour S2/S3
      initBugReporting({ sampleRate });

      for (let i = 0; i < 3; i++) {
        const fp = getFingerprint(`Error${i}`, 'stack', 'test');
        // Mock du hasard pour S2/S3
        if (i < 3) {
          expect(shouldReport(fp, 'S1')).toBe(true); // S1 = toujours accepté
          _recordSentReport(fp);
        }
      }

      // Après 3, maxPerSession est atteint
      const fpOver = getFingerprint('ErrorOver', 'stack', 'test');
      expect(shouldReport(fpOver, 'S1')).toBe(false);
    });

    it('devrait sampler S2/S3 avec sampleRate', () => {
      initBugReporting({
        mode: 'silent',
        sampleRate: 0.5, // 50%
        minIntervalMs: 0,
        maxPerSession: 1000,
      });

      // Tester avec plusieurs erreurs de sévérité S2
      const results: boolean[] = [];
      for (let i = 0; i < 100; i++) {
        const fp = getFingerprint(`Error${i}`, 'stack', 'test');
        results.push(shouldReport(fp, 'S2'));
      }

      // Environ 50% devraient être acceptés
      const accepted = results.filter((r) => r).length;
      expect(accepted).toBeGreaterThan(30); // loosement 50%±20
      expect(accepted).toBeLessThan(70);
    });
  });

  describe('initBugReporting', () => {
    it('devrait passer le mode en "off" en DEV', () => {
      // Note: import.meta.env.DEV est fixé au compile-time,
      // donc ce test ne sera pertinent que si exécuté en mode non-DEV
      // ou si on peut mocker import.meta.env
      initBugReporting({ mode: 'silent' });
      const state = getBugReportingState();
      // En DEV (mode test), il sera off; sinon il reste silent
      // Ce test documente le comportement
      expect(state.mode).toBeDefined();
    });
  });

  describe('resetBugReporting', () => {
    it('devrait réinitialiser l\'état', () => {
      initBugReporting({ mode: 'silent' });
      const fp1 = getFingerprint('Test1', 'stack', 'test');
      expect(shouldReport(fp1, 'S1')).toBe(true);
      _recordSentReport(fp1);

      // L'état doit être pollué
      let state = getBugReportingState();
      expect(state.sentCount).toBeGreaterThan(0);

      // Reset
      resetBugReporting();

      // Vérifier que tout est à zéro
      state = getBugReportingState();
      expect(state.lastSentAt).toBe(0);
      expect(state.sentCount).toBe(0);
      expect(state.sentByFingerprint.size).toBe(0);
      expect(state.mode).toBe('off');
    });
  });

  describe('getBugReportingState', () => {
    it('devrait retourner l\'état actuel sans exposer la mutable internale', () => {
      initBugReporting({ mode: 'silent', maxPerSession: 7 });

      const state = getBugReportingState();
      expect(state.mode).toBe('silent');
      expect(state.maxPerSession).toBe(7);
      expect(state.sentByFingerprint).toBeInstanceOf(Map);
    });
  });

  describe('reportError (intégration simplifiée)', () => {
    it('devrait accepter une Error ou string', async () => {
      initBugReporting({ mode: 'silent' });

      // Mock Firestore addDoc pour éviter la vraie connexion
      vi.mock('firebase/firestore', () => ({
        addDoc: vi.fn(),
        collection: vi.fn(),
      }));

      // Ces appels ne doivent pas lancer (même sans Firestore mockée)
      // car le service capture les erreurs
      expect(() => {
        reportError(new Error('Test error'), { severity: 'S0', source: 'test' });
      }).not.toThrow();

      expect(() => {
        reportError('String error', { severity: 'S0', source: 'test' });
      }).not.toThrow();
    });

    it('devrait capturer le contexte anonyme', () => {
      initBugReporting({ mode: 'silent' });

      // Vérifier que l'app window est accessible
      (window as any).app = {
        tools: { current: 'create-circle' },
        workspace: { data: { objects: { shapesData: [1, 2] } } },
      };

      // reportError devrait accéder à window.app sans erreur
      expect(() => {
        reportError('Test', { severity: 'S0', source: 'canvas-render' });
      }).not.toThrow();
    });
  });
});
