import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BaseGeometryTool } from '../../../../src/controllers/Core/States/BaseGeometryTool';
import { app, setState } from '../../../../src/controllers/Core/App';

vi.mock('../../../../src/controllers/Core/App', () => {
    const setState = vi.fn();
    const app = {
        tool: { name: 'base', currentStep: 'start' },
        workspace: {
            lastKnownMouseCoordinates: { x: 10, y: 10 }
        },
        upperCanvasLayer: {
            removeAllObjects: vi.fn(),
        },
        addListener: vi.fn(),
        removeListener: vi.fn(),
    };
    return { app, setState };
});

vi.mock('../../../../src/controllers/Core/Objects/Coordinates', () => ({
    Coordinates: class {
        constructor(props) {
            this.x = props.x;
            this.y = props.y;
        }
    }
}));

describe('BaseGeometryTool', () => {
    let tool;

    beforeEach(() => {
        vi.clearAllMocks();
        tool = new BaseGeometryTool('test', 'Test Title');
    });

    it('validates input correctly', () => {
        expect(tool.validateInput('test')).toBe(true);
        
        const originalWorkspace = app.workspace;
        app.workspace = null;
        expect(tool.validateInput('test')).toBe(false);
        app.workspace = originalWorkspace;
    });

    it('shows error notification', () => {
        const spy = vi.spyOn(window, 'dispatchEvent');
        tool.showErrorNotification('error message');
        expect(spy).toHaveBeenCalledWith(expect.objectContaining({
            type: 'show-notif'
        }));
    });

    it('gets valid mouse coordinates', () => {
        const coords = tool.getValidMouseCoordinates();
        expect(coords.x).toBe(10);
        expect(coords.y).toBe(10);
    });

    it('sets state safely', () => {
        tool.safeSetState('new-step', { extra: 'data' });
        expect(setState).toHaveBeenCalledWith(expect.objectContaining({
            tool: expect.objectContaining({ currentStep: 'new-step', extra: 'data' })
        }));
    });

    it('cleans up tool state', () => {
        tool.points = [1, 2];
        tool.cleanupTool();
        expect(tool.points).toEqual([]);
        expect(app.upperCanvasLayer.removeAllObjects).toHaveBeenCalled();
    });

    it('executes action safely', async () => {
        const mockAction = vi.fn();
        await tool.safeExecuteAction(mockAction);
        expect(mockAction).toHaveBeenCalled();
    });

    it('handles action failure safely', async () => {
        const mockAction = vi.fn().mockRejectedValue(new Error('fail'));
        await tool.safeExecuteAction(mockAction);
        expect(setState).toHaveBeenCalledWith(expect.objectContaining({
            tool: expect.objectContaining({ currentStep: 'error' })
        }));
    });
});
