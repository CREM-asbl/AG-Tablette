import { CreateTriangleTool } from '@controllers/CreateTriangle/CreateTriangleTool';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock @lit-labs/signals
vi.mock('@lit-labs/signals', () => ({
    computed: vi.fn((cb) => ({ get: cb })),
}));

// Mock the App module
vi.mock('@controllers/Core/App', () => {
    const setState = vi.fn();
    const app = {
        tool: null,
        upperCanvasLayer: {
            removeAllObjects: vi.fn(),
        },
        workspace: {
            lastKnownMouseCoordinates: { x: 0, y: 0 },
        },
        settings: {
            temporaryDrawColor: '#ff0000',
            referenceDrawColor: '#00ff00',
            referenceDrawColor2: '#0000ff',
        },
        addListener: vi.fn(),
        removeListener: vi.fn(),
    };
    return { app, setState };
});

// Mock appState
vi.mock('@store/appState', () => ({
    appActions: {
        setToolState: vi.fn(),
        setCurrentStep: vi.fn(),
    },
    activeTool: { get: vi.fn(() => 'createTriangle') },
    currentStep: { get: vi.fn(() => 'start') },
    createWatcher: vi.fn((signal, cb) => {
        return vi.fn();
    }),
}));

// Mock dynamic import for trianglesDef
vi.mock('@controllers/CreateTriangle/trianglesDef.js', () => ({
    EquilateralTriangle: {
        numberOfPointsToRequired: 3,
        constraints: [vi.fn(), vi.fn(), vi.fn()],
        finishShape: vi.fn(),
    }
}));

import { app } from '@controllers/Core/App';
import { appActions } from '@store/appState';

describe('CreateTriangleTool', () => {
    let tool;

    beforeEach(() => {
        vi.clearAllMocks();

        app.tool = {
            selectedTemplate: { name: 'EquilateralTriangle' },
        };

        document.querySelector = vi.fn().mockReturnValue({
            appendChild: vi.fn(),
        });
        document.createElement = vi.fn().mockReturnValue({
            family: '',
            templatesNames: [],
            selectedTemplate: null,
            type: '',
            nextStep: '',
        });

        tool = new CreateTriangleTool();
    });

    it('should be defined', () => {
        expect(tool).toBeDefined();
        expect(tool.name).toBe('createTriangle');
        expect(tool.title).toBe('Construire un triangle');
    });

    it('should start correctly', async () => {
        // Mock validateInput to return true
        tool.validateInput = vi.fn().mockReturnValue(true);

        await tool.start();
        expect(document.createElement).toHaveBeenCalledWith('shape-selector');
        expect(document.querySelector).toHaveBeenCalledWith('body');
    });

    it('should initialize drawFirstPoint correctly', async () => {
        vi.useFakeTimers();

        // Mock validateInput to return true
        tool.validateInput = vi.fn().mockReturnValue(true);

        // Mock loadShapeDefinition since it uses dynamic import
        tool.loadShapeDefinition = vi.fn().mockResolvedValue();

        await tool.drawFirstPoint();

        expect(app.upperCanvasLayer.removeAllObjects).toHaveBeenCalled();
        expect(tool.points).toEqual([]);
        expect(tool.segments).toEqual([]);
        expect(tool.numberOfPointsDrawn).toBe(0);

        // Note: BaseShapeCreationTool currently uses setState, so we expect setState to be called
        // After refactor, we will expect appActions.setToolState

        // For now, let's just check that the method completes without error
        // and that it calls loadShapeDefinition
        expect(tool.loadShapeDefinition).toHaveBeenCalled();

        vi.useRealTimers();
    });
});
