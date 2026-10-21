/**
 * Types partagés entre le frontend (bug-report.service.ts) et la Function.
 * Définis ici pour éviter la duplication ; le frontend les importe via un chemin relatif.
 */

export type Severity = 'S0' | 'S1' | 'S2' | 'S3';
export type ErrorSource =
  | 'file-load'
  | 'file-save'
  | 'canvas-render'
  | 'sync'
  | 'offline-cache'
  | 'tangram'
  | 'activity'
  | 'unknown';

export interface BugReportPayload {
  severity: Severity;
  message: string;
  stack?: string;
  fingerprint: string;
  source: ErrorSource;
  context: {
    version: string;
    route: string;
    tool: string | null;
    online: boolean;
    sw: boolean;
    userAgent: string;
    timestamp: string;
  };
  workspaceSave?: {
    appVersion?: string;
    timestamp?: number;
    envName?: string;
    workspaceDataStructure?: {
      shapesCount: number;
      segmentsCount: number;
      pointsCount: number;
      backObjectsCount: number;
    };
    fullHistory?: unknown;
    history?: unknown;
  } | null;
  extra?: Record<string, unknown> | null;
  sessionId: string;
}

export interface BugReportResult {
  ok: true;
  issueNumber: number;
  issueUrl: string;
  bugDocId: string;
}