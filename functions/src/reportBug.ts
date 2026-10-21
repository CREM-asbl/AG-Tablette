/**
 * Firebase Function : signalement d'erreurs → issue GitHub + Firestore.
 *
 * Le token GitHub est lu via `functions.config().github.token` (Secret Manager).
 * Configuration : `firebase functions:config:put github.token="ghp_..."`
 * Scope requis : repo (création d'issues)
 */

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import type { CallableRequest } from 'firebase-functions/v2/https';
import { BugReportPayload, BugReportResult } from './types';

const GITHUB_REPO = 'CREM-asbl/AG-Tablette';
const GITHUB_API = 'https://api.github.com';

function getGitHubToken(): string {
  const token = functions.config().github?.token;
  if (!token) {
    throw new Error(
      'GitHub token manquant. Configurez avec : firebase functions:config:put github.token="ghp_..."',
    );
  }
  return token;
}

function severityLabel(severity: string): string {
  switch (severity) {
    case 'S0':
      return 'P0 - critique';
    case 'S1':
      return 'P1 - haut';
    case 'S2':
      return 'P2 - moyen';
    case 'S3':
      return 'P3 - bas';
    default:
      return severity;
  }
}

function buildIssueBody(payload: BugReportPayload): string {
  const lines: string[] = [];
  lines.push('## Erreur signalée automatiquement');
  lines.push('');
  lines.push(`**Sévérité** : ${severityLabel(payload.severity)}`);
  lines.push(`**Source** : ${payload.source}`);
  lines.push(`**Empreinte** : ${payload.fingerprint}`);
  lines.push(`**Session** : ${payload.sessionId}`);
  lines.push(`**Version app** : ${payload.context.version}`);
  lines.push(`**Route** : ${payload.context.route}`);
  lines.push(`**Outil** : ${payload.context.tool ?? 'N/A'}`);
  lines.push(`**Online** : ${payload.context.online}`);
  lines.push(`**SW actif** : ${payload.context.sw}`);
  lines.push(`**User-Agent** : ${payload.context.userAgent}`);
  lines.push(`**Timestamp** : ${payload.context.timestamp}`);
  lines.push('');
  lines.push('### Message');
  lines.push('```');
  lines.push(payload.message.slice(0, 2000));
  lines.push('```');
  if (payload.stack) {
    lines.push('');
    lines.push('### Stack');
    lines.push('```');
    lines.push(payload.stack.slice(0, 5000));
    lines.push('```');
  }
  if (payload.extra && Object.keys(payload.extra).length > 0) {
    lines.push('');
    lines.push('### Données supplémentaires');
    lines.push('```json');
    lines.push(JSON.stringify(payload.extra, null, 2).slice(0, 2000));
    lines.push('```');
  }
  if (payload.workspaceSave) {
    lines.push('');
    lines.push('### Sauvegarde workspace (S0/S1)');
    lines.push('```json');
    lines.push(JSON.stringify(payload.workspaceSave, null, 2).slice(0, 5000));
    lines.push('```');
  }
  lines.push('');
  lines.push('_Rapport généré automatiquement par AG-Tablette._');
  return lines.join('\n');
}

async function createGitHubIssue(
  payload: BugReportPayload,
  token: string,
): Promise<{ number: number; url: string }> {
  const title = `[Bug ${payload.severity}] ${payload.source} : ${payload.message.slice(0, 120)}`;
  const body = buildIssueBody(payload);

  const response = await fetch(`${GITHUB_API}/repos/${GITHUB_REPO}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'AG-Tablette-BugReporter',
    },
    body: JSON.stringify({ title, body, labels: ['bug', 'auto-report'] }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(
      `GitHub API error ${response.status} : ${text.slice(0, 500)}`,
    );
  }

  const issue = (await response.json()) as { number: number; html_url: string };
  return { number: issue.number, url: issue.html_url };
}

export async function reportBug(
  request: CallableRequest<BugReportPayload>,
): Promise<BugReportResult> {
  const payload = request.data;
  // Validation minimale
  if (!payload || typeof payload !== 'object') {
    throw new functions.https.HttpsError('invalid-argument', 'Payload manquant');
  }
  if (!payload.severity || !payload.message) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'severity et message sont requis',
    );
  }

  // Initialiser Firebase Admin (une seule fois)
  if (admin.apps.length === 0) {
    admin.initializeApp();
  }

  const db = admin.firestore();
  const token = getGitHubToken();

  // 1. Créer l'issue GitHub
  const { number, url } = await createGitHubIssue(payload, token);

  // 2. Enregistrer dans Firestore (historique)
  const bugRef = await db.collection('bugs').add({
    ...payload,
    githubIssueNumber: number,
    githubIssueUrl: url,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return {
    ok: true,
    issueNumber: number,
    issueUrl: url,
    bugDocId: bugRef.id,
  };
}