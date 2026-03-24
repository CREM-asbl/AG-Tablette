import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.unmock('../../../src/controllers/Core/App');

import { app, setState, changes } from '../../../src/controllers/Core/App';

vi.mock('../../../src/controllers/Core/Objects/Workspace', () => ({
    Workspace: class {}
}));

vi.mock('../../../src/controllers/Core/Managers/SaveFileManager', () => ({
    initSaveFileEventListener: vi.fn()
}));

vi.mock('../../../src/controllers/Core/Managers/SelectManager', () => ({
    initSelectManager: vi.fn()
}));

vi.mock('../../../src/controllers/Core/Tools/utils', () => ({
    uniqId: vi.fn(() => 'test-id')
}));

vi.mock('../../../src/store/tools', () => ({
    tools: {
        get: vi.fn(() => []),
    },
    resetToolsVisibility: vi.fn(),
}));

vi.mock('../../../src/store/kit', () => ({
    resetKitVisibility: vi.fn(),
}));

import { tools, resetToolsVisibility } from '../../../src/store/tools';
import { resetKitVisibility } from '../../../src/store/kit';

describe('App', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('initializes with default values', () => {
        expect(app.settings.magnetismDistance).toBe(20);
        expect(app.started).toBe(false);
        expect(app.history.index).toBe(-1);
    });

    it('adds and removes listeners', () => {
        const mockFunc = vi.fn();
        const id = app.addListener('test-event', mockFunc);
        
        expect(id).toBe('test-id');
        expect(app.listenerCounter['test-event'][id]).toBe(mockFunc);
        
        const spy = vi.spyOn(window, 'removeEventListener');
        app.removeListener('test-event', id);
        expect(spy).toHaveBeenCalled();
        expect(app.listenerCounter['test-event'][id]).toBeNull();
    });

    it('setState updates properties and dispatches events', () => {
        const spy = vi.spyOn(window, 'dispatchEvent');
        const changesSpy = vi.spyOn(changes, 'set');
        
        setState({ started: true });
        
        expect(app.started).toBe(true);
        expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: 'app-started' }));
        expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: 'state-changed' }));
        expect(changesSpy).toHaveBeenCalledWith({ started: true });
    });

    it('setState updates tool info from tools store', () => {
        vi.mocked(tools.get).mockReturnValue([{ name: 'testTool', title: 'Test Tool Title', type: 'test' }]);
        
        setState({ tool: { name: 'testTool', currentStep: 'start' } });
        
        expect(app.tool.title).toBe('Test Tool Title');
        expect(app.tool.type).toBe('test');
    });

    it('resetSettings calls reset functions', () => {
        app.resetSettings();
        
        expect(resetToolsVisibility).toHaveBeenCalled();
        expect(resetKitVisibility).toHaveBeenCalled();
    });
});
