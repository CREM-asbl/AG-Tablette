import { fixture, html, oneEvent } from '@open-wc/testing';
import { beforeEach, describe, it, vi, expect } from 'vitest';
import { appActions, historyState, historyActions, activeTool } from '../../src/store/appState';
import { tools } from '../../src/store/tools';
import { app } from '../../src/controllers/Core/App';
import { createElem } from '../../src/controllers/Core/Tools/general';

// Mock dependencies
vi.mock('../../src/controllers/Core/App', () => ({
    app: {
        tool: { name: 'move', title: 'Glisser', selectedFamily: 'move' },
        fullHistory: { isRunning: false },
        left_menu: null
    },
    setState: vi.fn()
}));

vi.mock('../../src/controllers/Core/Tools/general', () => ({
    createElem: vi.fn()
}));

vi.mock('../../src/store/appState', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        historyActions: {
            undo: vi.fn(),
            redo: vi.fn(),
        }
    };
});

// Mock child components
vi.mock('../../src/components/icon-button', () => ({}));
vi.mock('../../src/components/template-toolbar', () => ({}));
vi.mock('../../src/components/toolbar-kit', () => ({}));
vi.mock('../../src/components/toolbar-section', () => ({}));

import '../../src/layouts/ag-menu';

describe('ag-menu', () => {
    let element;

    beforeEach(async () => {
        // Reset store state
        appActions.setActiveTool(null);
        appActions.setHelpSelected(false);
        historyState.set({ canUndo: false, canRedo: false, size: 0, currentIndex: -1 });
        vi.clearAllMocks();

        element = await fixture(html`<ag-menu></ag-menu>`);
    });

    it('should display default title when no tool is active', async () => {
        const title = element.shadowRoot.querySelector('h3');
        expect(title.textContent.trim()).toBe('Sélectionnez une fonctionnalité');
    });

    it('should display tool title when tool is active', async () => {
        // Setup tools store with a mock tool
        tools.set([{ name: 'CreateTriangle', title: 'Triangle', type: 'geometryCreator' }]);
        appActions.setActiveTool('CreateTriangle');

        await element.updateComplete;

        const title = element.shadowRoot.querySelector('h3');
        expect(title.textContent.trim()).toBe('mode: Triangle');
    });

    it('triggers undo action on button click', async () => {
        historyState.set({ canUndo: true, canRedo: false, size: 1, currentIndex: 0 });
        await element.updateComplete;

        const undoBtn = element.shadowRoot.querySelector('icon-button[name="undo"]');
        // Mock target.name for the handler
        element._actionHandle({ target: { name: 'undo' } });

        expect(historyActions.undo).toHaveBeenCalled();
    });

    it('triggers redo action on button click', async () => {
        historyState.set({ canUndo: false, canRedo: true, size: 1, currentIndex: -1 });
        await element.updateComplete;

        element._actionHandle({ target: { name: 'redo' } });

        expect(historyActions.redo).toHaveBeenCalled();
    });

    it('opens settings popup', async () => {
        element._actionHandle({ target: { name: 'settings' } });

        expect(createElem).toHaveBeenCalledWith('settings-popup');
        expect(activeTool.get()).toBeNull();
    });

    it('emits help event on help button click', async () => {
        const promise = oneEvent(window, 'help-button-clicked');
        element._actionHandle({ target: { name: 'help' } });
        const event = await promise;
        
        expect(event.detail.toolname).toBe('move');
    });

    it('renders toolbar sections', async () => {
        const sections = element.shadowRoot.querySelectorAll('toolbar-section');
        expect(sections.length).toBe(5);
        expect(sections[0].getAttribute('title')).toBe('Figures libres');
    });
});
