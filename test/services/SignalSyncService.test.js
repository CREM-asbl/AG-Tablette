import { app } from '../../src/controllers/Core/App.js';
import { appActions, activeTool, viewport, settings, historyState } from '../../src/store/appState.js';
import { signalSyncService } from '../../src/services/SignalSyncService.js';
import { describe, it, expect, beforeEach } from 'vitest';

describe('SignalSyncService Integration', () => {
    beforeEach(() => {
        // Reset app state
        app.tool = null;
        app.workspace.zoomLevel = 1;
        app.workspace.translateOffset = { x: 0, y: 0 };
        signalSyncService.init(app);
    });

    it('should sync tool changes', () => {
        const toolName = 'CreateTriangle';
        app.tool = { name: toolName, currentStep: 'start' };

        // Simulate event
        window.dispatchEvent(new CustomEvent('tool-changed', { detail: app }));

        expect(activeTool.get()).toBe(toolName);
    });

    it('should sync viewport changes', () => {
        app.workspace.zoomLevel = 2;
        app.workspace.translateOffset = { x: 100, y: 200 };

        // Simulate event
        window.dispatchEvent(new CustomEvent('refresh'));

        const vp = viewport.get();
        expect(vp.zoom).toBe(2);
        expect(vp.offsetX).toBe(100);
        expect(vp.offsetY).toBe(200);
    });

    it('should sync settings changes', () => {
        app.settings.magnetismDistance = 50;

        // Simulate event
        window.dispatchEvent(new CustomEvent('settings-changed', { detail: app }));

        expect(settings.get().magnetismDistance).toBe(50);
    });

    it('should sync history changes', () => {
        // Test history sync
        app.history = { index: 1, steps: [{}, {}, {}] };
        window.dispatchEvent(new CustomEvent('history-changed'));

        const history = historyState.get();
        expect(history.canUndo).toBe(true);
        expect(history.canRedo).toBe(true);
        expect(history.size).toBe(3);
        expect(history.currentIndex).toBe(1);
    });
});

