import { html, fixture, expect } from '@open-wc/testing';
import { appActions, historyState, helpSelected, activeTool } from '../../src/store/appState';
import { tools } from '../../src/store/tools';
import { kit } from '../../src/store/kit';
import { vi, describe, it, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('../../src/controllers/Core/App', () => ({
    app: {
        tool: null,
        fullHistory: { isRunning: false }
    },
    setState: vi.fn()
}));

vi.mock('../../src/controllers/Core/Tools/general', () => ({
    createElem: vi.fn()
}));

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

        element = await fixture(html`<ag-menu></ag-menu>`);
    });

    it('should display default title when no tool is active', async () => {
        const title = element.shadowRoot.querySelector('h3');
        expect(title.textContent.trim()).to.equal('Sélectionnez une fonctionnalité');
    });

    it('should display tool title when tool is active', async () => {
        // Setup tools store with a mock tool
        tools.set([{ name: 'CreateTriangle', title: 'Triangle', type: 'geometryCreator' }]);
        appActions.setActiveTool('CreateTriangle');

        await element.updateComplete;

        const title = element.shadowRoot.querySelector('h3');
        expect(title.textContent.trim()).to.equal('mode: Triangle');
    });

    it('should enable undo/redo buttons based on history state', async () => {
        historyState.set({ canUndo: true, canRedo: true, size: 1, currentIndex: 0 });
        await element.updateComplete;

        const undoBtn = element.shadowRoot.querySelector('icon-button[name="undo"]');
        const redoBtn = element.shadowRoot.querySelector('icon-button[name="redo"]');

        expect(undoBtn.hasAttribute('disabled')).to.be.false;
        expect(redoBtn.hasAttribute('disabled')).to.be.false;
    });

    it('should activate help button when helpSelected is true', async () => {
        appActions.setHelpSelected(true);
        await element.updateComplete;

        const helpBtn = element.shadowRoot.querySelector('icon-button[name="help"]');
        expect(helpBtn.hasAttribute('active')).to.be.true;
    });
});
