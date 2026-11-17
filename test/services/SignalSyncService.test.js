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
});

