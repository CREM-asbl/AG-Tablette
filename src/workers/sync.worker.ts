/**
 * Préparation des lots de synchronisation hors thread principal.
 *
 * Fonctions pures : utilisables depuis un Dedicated Worker (postMessage)
 * ou en fallback direct sur le thread principal (iPad/Safari sans Worker).
 * Aucun import IndexedDB / Firebase / signals ici.
 */
import { compressToUTF16, decompressFromUTF16 } from 'lz-string';

export interface PreparedActivityRecord {
  id: string;
  data: string;
  version: number;
  timestamp: number;
  lastAccess: number;
  accessCount: number;
  compressed: boolean;
}

export function prepareActivityRecord(
  id: string,
  data: unknown,
  version = 1,
  timestamp: number = Date.now(),
  lastAccess: number = Date.now(),
): PreparedActivityRecord {
  const json = JSON.stringify(data);
  return {
    id,
    data: compressToUTF16(json),
    version,
    timestamp,
    lastAccess,
    accessCount: 1,
    compressed: true,
  };
}

export function decompressPayload(compressed: string): string {
  return decompressFromUTF16(compressed) ?? '';
}

export function chunkIntoBatches<T>(items: T[], batchSize = 20): T[][] {
  const size = Math.max(1, Math.min(batchSize, 50));
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}

export function shouldDownloadFile(localVersion: number, serverVersion: number): boolean {
  return serverVersion > localVersion;
}

export function calculateSyncProgress(
  filesProcessed: number,
  totalFiles: number,
  themesProcessed: number,
  totalThemes: number,
): number {
  const fileWeight = 0.7;
  const themeWeight = 0.3;
  const fileProgress = totalFiles > 0 ? (filesProcessed / totalFiles) * fileWeight * 100 : 0;
  const themeProgress = totalThemes > 0 ? (themesProcessed / totalThemes) * themeWeight * 100 : 0;
  return Math.round(fileProgress + themeProgress);
}

export interface WorkerSyncRequest {
  type: 'prepare-batch';
  batchId: number;
  files: Array<{ id: string; data: unknown; version: number }>;
}

export interface WorkerSyncResponse {
  type: 'batch-ready';
  batchId: number;
  records?: PreparedActivityRecord[];
}

function yieldToEventLoop(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

export async function processBatch(
  request: WorkerSyncRequest,
  onYield?: () => Promise<void>,
): Promise<WorkerSyncResponse> {
  const records: PreparedActivityRecord[] = [];
  for (const file of request.files) {
    records.push(prepareActivityRecord(file.id, file.data, file.version));
    await (onYield ? onYield() : yieldToEventLoop());
  }
  return { type: 'batch-ready', batchId: request.batchId, records };
}

export type SyncWorkerMessage = WorkerSyncRequest;
export type SyncWorkerReply = WorkerSyncResponse;
