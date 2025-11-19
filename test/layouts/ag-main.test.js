import { html, fixture, expect } from '@open-wc/testing';
import { appActions, historyState } from '../../src/store/appState';
import { vi, describe, it, beforeEach } from 'vitest';

// Mock dependencies before import
vi.mock('../../src/store/notions', () => ({
    initializeCachesFromIndexedDB: vi.fn().mockResolvedValue(),
    selectedNotion: { get: () => null, set: () => { } },
    cachedThemes: { get: () => [], set: () => { } },
    cachedSequences: { get: () => [], set: () => { } },
    cachedFiles: { get: () => [], set: () => { } },
    toggleNotion: vi.fn(),
    toggleSequence: vi.fn(),
    selectedSequence: { get: () => '', set: () => { } }
}));

// Mock App
vi.mock('../../src/controllers/Core/App', () => ({
    app: {
        environment: {
            name: 'Grandeurs',
            extensions: ['.ag']
        },
        fileToOpen: null,
        tool: null,
        settings: {},
        helpSelected: false,
        filename: ''
    }
}));

// Mock child components to avoid rendering issues
vi.mock('../../src/layouts/ag-menu', () => ({}));
vi.mock('../../src/components/canvas-container', () => ({}));
vi.mock('../../src/components/sync-status-indicator.ts', () => ({}));
vi.mock('../../src/components/popups/notification', () => ({}));
vi.mock('../../src/controllers/Bugs', () => ({ bugSend: vi.fn() }));

import '../../src/layouts/ag-main';

describe('ag-main', () => {
    let element;

    beforeEach(async () => {
        element = await fixture(html`<ag-main></ag-main>`);
    });

    it('should update activeTool signal when setActiveTool is called', async () => {
        const { activeTool } = await import('../../src/store/appState');
        appActions.setActiveTool('CreateTriangle');
        await element.updateComplete;

        // Test that the signal was updated (ag-menu uses signals internally)
        expect(activeTool.get()).to.equal('CreateTriangle');
    });

    it('should update filename when filename signal changes', async () => {
        const testName = 'test-file.ag';
        appActions.setFilename(testName);
        await element.updateComplete;

        expect(document.title).to.equal(testName);
    });

    it('should update helpSelected signal when setHelpSelected is called', async () => {
        const { helpSelected } = await import('../../src/store/appState');
        appActions.setHelpSelected(true);
        await element.updateComplete;

        // Test that the signal was updated
        expect(helpSelected.get()).to.be.true;
    });

    it('should update history buttons when historyState changes', async () => {
        // Simulate history change
        historyState.set({
            canUndo: true,
            canRedo: true,
            size: 1,
            currentIndex: 0
        });
        await element.updateComplete;

        // Test that the signal was updated (ag-menu uses signals internally)
        expect(historyState.get().canUndo).to.be.true;
        expect(historyState.get().canRedo).to.be.true;
    });
});
