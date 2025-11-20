import { beforeEach, describe, expect, it, vi } from 'vitest';
import 'fake-indexeddb/auto';
import * as IDBUtils from '../../src/utils/indexeddb-activities.js';
import { CACHE_CONFIG } from '../../src/utils/cache-config.js';

describe('IndexedDB Activities Utils', () => {
    beforeEach(async () => {
        // Clear all object stores instead of deleting DB to avoid blocking issues
        // fake-indexeddb can hang on deleteDatabase if connections aren't perfectly closed
        const db = await IDBUtils.openDB();
        const storeNames = Array.from(db.objectStoreNames);

        if (storeNames.length > 0) {
            const tx = db.transaction(storeNames, 'readwrite');
            const promises = storeNames.map(storeName => {
                return new Promise((resolve, reject) => {
                    const req = tx.objectStore(storeName).clear();
                    req.onsuccess = () => resolve();
                    req.onerror = () => reject(req.error);
                });
            });
            await Promise.all(promises);
        }

        db.close();
        vi.clearAllMocks();
    });

    describe('openDB', () => {
        it('should open the database successfully', async () => {
            const db = await IDBUtils.openDB();
            expect(db).toBeDefined();
            expect(db.name).toBe('agTabletteDB');
            expect(db.objectStoreNames.contains('activities')).toBe(true);
            expect(db.objectStoreNames.contains('themes')).toBe(true);
            expect(db.objectStoreNames.contains('modules')).toBe(true);
            expect(db.objectStoreNames.contains('sync_metadata')).toBe(true);
            db.close();
        });
    });

    describe('saveActivity & getActivity', () => {
        it('should save and retrieve an activity', async () => {
            const activityId = 'test-activity';
            const activityData = { name: 'Test Activity', shapes: [] };

            await IDBUtils.saveActivity(activityId, activityData);

            const retrieved = await IDBUtils.getActivity(activityId);
            expect(retrieved).toBeDefined();
            expect(retrieved.id).toBe(activityId);
            expect(retrieved.data).toEqual(activityData);
        });

        it('should handle compression if enabled', async () => {
            // Force compression enabled for this test
            const originalCompression = CACHE_CONFIG.COMPRESSION_ENABLED;
            CACHE_CONFIG.COMPRESSION_ENABLED = true;

            const activityId = 'compressed-activity';
            const activityData = { name: 'Compressed', data: 'x'.repeat(100) };

            await IDBUtils.saveActivity(activityId, activityData);
            const retrieved = await IDBUtils.getActivity(activityId);

            expect(retrieved.data).toEqual(activityData);

            // Verify raw data in DB is compressed (string)
            const db = await IDBUtils.openDB();
            const tx = db.transaction('activities', 'readonly');
            const store = tx.objectStore('activities');
        });

        describe('Themes and Modules', () => {
            it('should save and retrieve a theme', async () => {
                const id = 'theme-1';
                const data = { color: 'red' };
                await IDBUtils.saveTheme(id, data);
                const retrieved = await IDBUtils.getTheme(id);
                expect(retrieved).toEqual(data);
            });

            it('should save and retrieve a module', async () => {
                const id = 'module-1';
                const data = { type: 'geometry' };
                await IDBUtils.saveModule(id, data);
                const retrieved = await IDBUtils.getModule(id);
                expect(retrieved).toEqual(data);
            });

            it('should get all themes', async () => {
                await IDBUtils.saveTheme('t1', { v: 1 });
                await IDBUtils.saveTheme('t2', { v: 2 });
                const all = await IDBUtils.getAllThemes();
                expect(all).toHaveLength(2);
            });

            it('should get all modules', async () => {
                await IDBUtils.saveModule('m1', { v: 1 });
                const all = await IDBUtils.getAllModules();
                expect(all).toHaveLength(1);
            });
        });

        describe('Sync Metadata', () => {
            it('should save and retrieve sync metadata', async () => {
                const metadata = {
                    lastSyncDate: Date.now(),
                    serverFiles: ['f1'],
                };
                await IDBUtils.saveSyncMetadata(metadata);
                const retrieved = await IDBUtils.getSyncMetadata();
                expect(retrieved.serverFiles).toEqual(['f1']);
            });

            it('should return null if metadata expired', async () => {
                const metadata = {
                    lastSyncDate: Date.now(),
                    expiryDate: Date.now() - 1000, // Expired
                };
                await IDBUtils.saveSyncMetadata(metadata);
                const retrieved = await IDBUtils.getSyncMetadata();
                expect(retrieved).toBeNull();
            });

            it('should check if recent sync is available', async () => {
                await IDBUtils.saveSyncMetadata({
                    lastSyncDate: Date.now(),
                    expiryDate: Date.now() + 10000,
                });
                const isRecent = await IDBUtils.isRecentSyncAvailable(1); // 1 hour
                expect(isRecent).toBe(true);
            });

            it('should clear expired metadata', async () => {
                await IDBUtils.saveSyncMetadata({
                    lastSyncDate: Date.now(),
                    expiryDate: Date.now() - 1000,
                });
                const cleared = await IDBUtils.clearExpiredSyncMetadata();
                expect(cleared).toBe(true);
                const retrieved = await IDBUtils.getSyncMetadata();
                expect(retrieved).toBeNull();
            });
        });

        describe('Cache Statistics', () => {
            it('should return valid statistics', async () => {
                await IDBUtils.saveActivity('a1', { data: 1 });
                await IDBUtils.saveActivity('a2', { data: 2 });

                const stats = await IDBUtils.getCacheStatistics();
                expect(stats.totalActivities).toBe(2);
                expect(stats.usagePercentage).toBeGreaterThanOrEqual(0);
                expect(stats.mostUsedActivities).toBeDefined();
            });
        });
    });
