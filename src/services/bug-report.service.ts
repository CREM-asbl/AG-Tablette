/**
 * Service de rapportage d'erreurs sélectif avec capture de sauvegarde complète
 *
 * Politique:
 * - Pas de capture automatique/globale (trop bruyant)
 * - Appels explicites seulement aux points critiques métier
 * - Capture optionnelle de la sauvegarde complète (état + historique) pour S0/S1
 * - Anonyme (pas d'ID utilisateur direct), dédupliqué, throttlé
 * - Silencieux en PROD, off en DEV
 * - Base légale: intérêt légitime (stabilité/qualité)
 */

import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  addDoc,
  collection,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  serverTimestamp,
} from 'firebase/firestore';
import config from '../firebase/firebase-config.json';

export type Severity = 'S0' | 'S1' | 'S2' | 'S3';
export type Mode = 'silent' | 'off';
export type ErrorSource =
  | 'file-load'
  | 'file-save'
  | 'canvas-render'
  | 'sync'
  | 'offline-cache'
  | 'tangram'
  | 'activity'
  | 'unknown';

interface BugReportState {
  mode: Mode;
  sampleRate: number; // 0.0-1.0, fraction d'erreurs S2/S3 à envoyer
  maxPerSession: number; // limite total par session
  minIntervalMs: number; // throttle global entre envois
  lastSentAt: number;
  sentByFingerprint: Map<string, number>; // empreinte -> nb envois
  sentCount: number;
}

const state: BugReportState = {
  mode: 'off', // par défaut, attendre init
  sampleRate: 0.2, // 20% des S2/S3
  maxPerSession: 10,
  minIntervalMs: 5000,
  lastSentAt: 0,
  sentByFingerprint: new Map(),
  sentCount: 0,
};

/**
 * Initialiser le service (à appeler au bootstrap de l'app)
 * @param options Surcharges de configuration
 */
export function initBugReporting(options?: Partial<BugReportState>) {
  if (options) {
    Object.assign(state, options);
  }
  if (import.meta.env.DEV) {
    state.mode = 'off'; // jamais reporter en dev
  }
}

/**
 * Collecter le contexte applicatif anonyme
 */
function collectContext() {
  return {
    version: (import.meta as any).env?.APP_VERSION ?? 'unknown',
    route: location.pathname,
    tool: (window as any)?.app?.tools?.current ?? (window as any)?.app?.activeTool ?? null,
    online: navigator.onLine,
    sw: !!navigator.serviceWorker?.controller,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Générer une empreinte (fingerprint) de l'erreur pour déduplication
 * Basée sur le message, la stack, la version et la route
 * (pas d'identifiant utilisateur)
 */
export function getFingerprint(
  message: string,
  stack?: string,
  source?: ErrorSource,
): string {
  const normalized = `${message}|${(stack || '').slice(0, 300)}|${source || 'unknown'}`;
  // Simple hash (non-crypto, suffisant pour dédup)
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return String(Math.abs(hash));
}

/**
 * Vérifier si l'erreur doit être envoyée selon les critères de throttle et dédup
 */
export function shouldReport(fingerprint: string, severity: Severity): boolean {
  if (state.mode === 'off') return false;
  if (state.sentCount >= state.maxPerSession) return false;

  const now = Date.now();
  if (now - state.lastSentAt < state.minIntervalMs) return false;

  // Dédup: pas renvoyer 2x la même empreinte dans la session
  const previousCount = state.sentByFingerprint.get(fingerprint) ?? 0;
  if (previousCount > 0) return false;

  // Sampling pour S2/S3 (réduire le bruit)
  if (severity === 'S2' || severity === 'S3') {
    return Math.random() < state.sampleRate;
  }

  // S0/S1 toujours (critique)
  return true;
}

/**
 * Obtenir la connexion Firestore (réutilise l'app existante)
 */
function getDb() {
  const app = getApps().length > 0 ? getApp() : initializeApp(config);
  try {
    return getFirestore(app);
  } catch {
    return initializeFirestore(app, { localCache: persistentLocalCache() });
  }
}

/**
 * Enregistrer un envoi réussi (état interne, appelé par reportError et exporté pour tests)
 */
export function _recordSentReport(fingerprint: string): void {
  state.sentByFingerprint.set(fingerprint, 1);
  state.sentCount++;
  state.lastSentAt = Date.now();
}

/**
 * Générer un hash de session (anonyme, pour regrouper erreurs de la même session)
 * Basé sur l'heure de démarrage + user agent
 */
function getSessionHash(): string {
  if (!(window as any)._sessionHash) {
    const seed = `${Date.now()}-${navigator.userAgent}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = (hash << 5) - hash + char;
    }
    (window as any)._sessionHash = String(Math.abs(hash));
  }
  return (window as any)._sessionHash;
}

/**
 * Capturer la sauvegarde complète de l'application (état + historique)
 * Réutilise la logique de SaveFileManager.prepareSaveData()
 */
function captureWorkspaceSave(): any {
  try {
    const app = (window as any)?.app;
    if (!app?.workspace) return null;

    // Capture minimaliste: juste la structure des données + historique
    if (typeof app.workspace.data === 'object') {
      return {
        appVersion: app.version,
        timestamp: Date.now(),
        envName: app.environment?.name ?? 'unknown',
        workspaceDataStructure: {
          shapesCount: app.workspace.data?.objects?.shapesData?.length ?? 0,
          segmentsCount: app.workspace.data?.objects?.segmentsData?.length ?? 0,
          pointsCount: app.workspace.data?.objects?.pointsData?.length ?? 0,
          backObjectsCount: app.workspace.data?.backObjects?.shapesData?.length ?? 0,
        },
        fullHistory: app.fullHistory ? { ...app.fullHistory } : undefined,
        history: app.history ? { ...app.history } : undefined,
      };
    }
    return null;
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error('[BugReport] Erreur lors de la capture du workspace:', err);
    }
    return null;
  }
}

/**
 * Rapporter une erreur métier critique
 *
 * @param error L'erreur (Error ou string)
 * @param meta Métadonnées: sévérité, source, infos supplémentaires
 *
 * Exemples d'utilisation aux points critiques:
 * ```
 * // Lors du chargement d'un fichier
 * try {
 *   await loadFile(filename);
 * } catch (err) {
 *   reportError(err, { severity: 'S1', source: 'file-load', extra: { filename } });
 * }
 *
 * // Lors du rendu canvas
 * try {
 *   canvas.render();
 * } catch (err) {
 *   reportError(err, { severity: 'S0', source: 'canvas-render' });
 * }
 *
 * // Lors de la sync
 * try {
 *   await sync();
 * } catch (err) {
 *   reportError(err, { severity: 'S1', source: 'sync', extra: { retries: 3 } });
 * }
 * ```
 */
export async function reportError(
  error: Error | string,
  meta?: {
    severity?: Severity;
    source?: ErrorSource;
    extra?: Record<string, any>;
  },
): Promise<void> {
  try {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : '';
    const severity = meta?.severity ?? 'S2';
    const source = meta?.source ?? 'unknown';
    const fingerprint = getFingerprint(message, stack, source);

    if (!shouldReport(fingerprint, severity)) {
      return;
    }

    const db = getDb();
    const ctx = collectContext();

    // Capturer la sauvegarde complète pour S0/S1 (critique)
    let workspaceSave = null;
    if (severity === 'S0' || severity === 'S1') {
      workspaceSave = captureWorkspaceSave();
    }

    // Nettoyer les données supplémentaires (pas de fonctions, objets complexes)
    let cleanedExtra = null;
    if (meta?.extra) {
      try {
        cleanedExtra = JSON.parse(JSON.stringify(meta.extra));
      } catch {
        cleanedExtra = { error: 'unable to serialize extra' };
      }
    }

    // Écrire dans Firestore
    await addDoc(collection(db, 'bugs'), {
      timestamp: serverTimestamp(),
      severity,
      message: message.slice(0, 500),
      stack: (stack || '').slice(0, 2000),
      fingerprint,
      source,
      context: ctx,
      workspaceSave, // sauvegarde complète avec état + historique
      extra: cleanedExtra,
      sessionId: getSessionHash(),
    });

    // Mettre à jour l'état local APRES l'envoi réussi
    state.sentByFingerprint.set(fingerprint, 1);
    state.sentCount++;
    state.lastSentAt = Date.now();

    if (import.meta.env.DEV) {
      console.warn(
        `[BugReport] ${severity} ${source}: ${message} (fp: ${fingerprint})`,
      );
    }
  } catch (reportingError) {
    // Ne jamais laisser le reporter lui-même planter l'app
    if (import.meta.env.DEV) {
      console.error('[BugReport] Erreur lors de l\'envoi du rapport:', reportingError);
    }
  }
}

/**
 * Obtenir l'état actuel (pour tests/debug)
 */
export function getBugReportingState(): BugReportState {
  return {
    ...state,
    sentByFingerprint: new Map(state.sentByFingerprint),
  };
}

/**
 * Réinitialiser l'état (pour tests)
 */
export function resetBugReporting(): void {
  state.lastSentAt = 0;
  state.sentByFingerprint.clear();
  state.sentCount = 0;
  state.mode = 'off';
}
