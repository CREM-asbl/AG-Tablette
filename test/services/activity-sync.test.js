import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Unmock the service under test because it is mocked in setup.ts
vi.unmock('@services/activity-sync');

import * as firebaseInit from '../../src/firebase/firebase-init.js';
import {
    getLastSyncInfo,
    isSyncInProgress,
    smartSync,
    syncActivitiesInBackground
} from '../../src/services/activity-sync.js';
import * as indexeddbActivities from '../../src/utils/indexeddb-activities.js';

// Mock dependencies
vi.mock('../../src/firebase/firebase-init.js');
vi.mock('../../src/utils/indexeddb-activities.js');

// Mock syncState with a mutable object for signals
const { mockSyncInProgress } = vi.hoisted(() => {
    return { mockSyncInProgress: { value: false } };
});

vi.mock('../../src/store/syncState.js', () => ({
    syncInProgress: mockSyncInProgress,
    syncProgress: { value: 0 },
    syncVisible: { value: false },
    setSyncProgress: vi.fn(),
    setSyncCompleted: vi.fn(),
}));

describe('Activity Sync Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Reset syncInProgress value
        mockSyncInProgress.value = false;

        // Default mocks
        Object.defineProperty(navigator, 'onLine', {
            configurable: true,
            value: true,
        });

        // Firebase
        firebaseInit.getFilesCount.mockResolvedValue(0);
        firebaseInit.findAllFilesPaged.mockImplementation(async ({ onPage }) => {
            // Par défaut, ne rien faire (pas de fichiers)
        });
        firebaseInit.findAllThemes.mockResolvedValue([]);
        firebaseInit.getModulesDocFromTheme.mockResolvedValue([]);
        firebaseInit.readFileFromServer.mockResolvedValue({});

        // IndexedDB
        indexeddbActivities.getAllActivities.mockResolvedValue([]);
        indexeddbActivities.getSyncMetadata.mockResolvedValue(null);
        indexeddbActivities.isRecentSyncAvailable.mockResolvedValue(false);
        indexeddbActivities.saveActivity.mockResolvedValue();
        indexeddbActivities.saveModule.mockResolvedValue();
        indexeddbActivities.saveSyncMetadata.mockResolvedValue();
        indexeddbActivities.saveTheme.mockResolvedValue();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('isSyncInProgress', () => {
        it('should return the value from syncState', () => {
            mockSyncInProgress.value = true;
            expect(isSyncInProgress()).toBe(true);

            mockSyncInProgress.value = false;
            expect(isSyncInProgress()).toBe(false);
        });
    });

    describe('getLastSyncInfo', () => {
        it('should return null if no metadata exists', async () => {
            indexeddbActivities.getSyncMetadata.mockResolvedValue(null);
            const info = await getLastSyncInfo();
            expect(info).toBeNull();
        });

        it('should return formatted sync info when metadata exists', async () => {
            const now = Date.now();
            const metadata = {
                lastSyncDate: now - 1000,
                syncedFilesCount: 5,
                totalFilesCount: 10,
                totalThemesCount: 2,
                expiryDate: now + 10000,
            };
            indexeddbActivities.getSyncMetadata.mockResolvedValue(metadata);

            const info = await getLastSyncInfo();

            expect(info).toEqual({
                lastSyncDate: new Date(metadata.lastSyncDate),
                syncedFilesCount: 5,
                totalFilesCount: 10,
                totalThemesCount: 2,
                expiryDate: new Date(metadata.expiryDate),
                isExpired: false,
                nextSyncDue: false,
            });
        });

        it('should handle errors gracefully', async () => {
            indexeddbActivities.getSyncMetadata.mockRejectedValue(new Error('DB Error'));
            const info = await getLastSyncInfo();
            expect(info).toBeNull();
        });
    });

    describe('smartSync', () => {
        it('should return "offline" if navigator is offline', async () => {
            Object.defineProperty(navigator, 'onLine', { value: false });
            const result = await smartSync();
            expect(result).toBe('offline');
        });

        it('should return "in_progress" if sync is already running', async () => {
            mockSyncInProgress.value = true;
            const result = await smartSync();
            expect(result).toBe('in_progress');
        });

        it('should return "recent" if sync is recent and not forced', async () => {
            indexeddbActivities.isRecentSyncAvailable.mockResolvedValue(true);
            indexeddbActivities.getSyncMetadata.mockResolvedValue({
                lastSyncDate: Date.now(),
                expiryDate: Date.now() + 10000
            });

            const result = await smartSync();
            expect(result).toBe('recent');
            expect(firebaseInit.findAllFilesPaged).not.toHaveBeenCalled();
        });

        it('should proceed with sync if forced even if recent', async () => {
            indexeddbActivities.isRecentSyncAvailable.mockResolvedValue(true);

            const result = await smartSync({ force: true });
            expect(result).toBe('completed');
            expect(firebaseInit.findAllFilesPaged).toHaveBeenCalled();
        });

        it('should return "completed" after successful sync', async () => {
            const result = await smartSync();
            expect(result).toBe('completed');
        });

        it('should return "error" if sync fails', async () => {
            firebaseInit.getFilesCount.mockRejectedValue(new Error('Network Error'));
            const result = await smartSync();
            expect(result).toBe('error');
        });
    });

    describe('syncActivitiesInBackground', () => {
        it('should not sync if offline', async () => {
            Object.defineProperty(navigator, 'onLine', { value: false });
            await syncActivitiesInBackground();
            expect(firebaseInit.findAllFilesPaged).not.toHaveBeenCalled();
        });

        it('should not sync if already in progress', async () => {
            mockSyncInProgress.value = true;
            await syncActivitiesInBackground();
            expect(firebaseInit.findAllFilesPaged).not.toHaveBeenCalled();
        });

        it('should not sync if recent sync available and not forced', async () => {
            indexeddbActivities.isRecentSyncAvailable.mockResolvedValue(true);
            await syncActivitiesInBackground();
            expect(firebaseInit.findAllFilesPaged).not.toHaveBeenCalled();
        });

        it('should sync files, themes and modules', async () => {
            const serverFiles = [
                { id: 'file1', version: 2 },
                { id: 'file2', version: 1 }
            ];
            const serverThemes = [{ id: 'theme1' }];
            const modules = [{ id: 'mod1' }];

            firebaseInit.getFilesCount.mockResolvedValue(2);
            firebaseInit.findAllFilesPaged.mockImplementation(async ({ onPage }) => {
                await onPage(serverFiles);
            });
            firebaseInit.findAllThemes.mockResolvedValue(serverThemes);
            firebaseInit.getModulesDocFromTheme.mockResolvedValue(modules);

            // Local state: file1 is old, file2 is missing
            indexeddbActivities.getAllActivities.mockResolvedValue([
                { id: 'file1', version: 1 }
            ]);

            await syncActivitiesInBackground(true);

            // Verify file sync
            expect(firebaseInit.readFileFromServer).toHaveBeenCalledWith('file1', expect.objectContaining({ forceDownload: true }));
            expect(firebaseInit.readFileFromServer).toHaveBeenCalledWith('file2', expect.objectContaining({ forceDownload: true }));
            expect(indexeddbActivities.saveActivity).toHaveBeenCalledTimes(2);

            // Verify theme/module sync
            expect(indexeddbActivities.saveTheme).toHaveBeenCalledWith('theme1', serverThemes[0]);
            expect(indexeddbActivities.saveModule).toHaveBeenCalledWith('mod1', modules[0]);

            // Verify completion
            expect(indexeddbActivities.saveSyncMetadata).toHaveBeenCalled();
        });

        it('should skip files that are up to date locally', async () => {
            const serverFiles = [{ id: 'file1', version: 1 }];
            firebaseInit.getFilesCount.mockResolvedValue(1);
            firebaseInit.findAllFilesPaged.mockImplementation(async ({ onPage }) => {
                await onPage(serverFiles);
            });
            indexeddbActivities.getAllActivities.mockResolvedValue([
                { id: 'file1', version: 1 }
            ]);

            await syncActivitiesInBackground(true);

            expect(firebaseInit.readFileFromServer).not.toHaveBeenCalled();
            expect(indexeddbActivities.saveActivity).not.toHaveBeenCalled();
        });

        it('should retry on failure', async () => {
            firebaseInit.getFilesCount
                .mockRejectedValueOnce(new Error('Fail 1'))
                .mockRejectedValueOnce(new Error('Fail 2'))
                .mockRejectedValue(new Error('Persistent Fail'));

            await expect(syncActivitiesInBackground(true)).rejects.toThrow('Persistent Fail');

            // Should have tried multiple times (initial + retries)
            // CONFIG.RETRY_ATTEMPTS is 3, so 3 calls.
            expect(firebaseInit.getFilesCount).toHaveBeenCalledTimes(3);
        }, 10000); // Increase timeout for retries
    });
});
