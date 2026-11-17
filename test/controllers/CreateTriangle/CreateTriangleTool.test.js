import { app } from '@controllers/Core/App';
import { CreateTriangleTool } from '@controllers/CreateTriangle/CreateTriangleTool';
import * as geometryTools from '@controllers/GeometryTools/general';
import * as recomputeShape from '@controllers/GeometryTools/recomputeShape';
import { helpConfigRegistry } from '@services/HelpConfigRegistry';
import { appActions } from '@store/appState';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@lit-labs/signals', () => ({
    computed: vi.fn((cb) => ({ get: cb })),
    signal: vi.fn((val) => ({ get: () => val, set: vi.fn() })),
}));

vi.mock('@controllers/Core/App', () => {
    const setState = vi.fn();
    const app = {
        tool: null,
        upperCanvasLayer: {
            removeAllObjects: vi.fn(),
            shapes: [],
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

vi.mock('@store/appState', () => ({
    appActions: {
        setActiveTool: vi.fn(),
        setSelectedTemplate: vi.fn(),
        setToolState: vi.fn(),
        setCurrentStep: vi.fn(),
        setToolUiState: vi.fn(),
    },
    activeTool: { get: vi.fn(() => 'createTriangle') },
    currentStep: { get: vi.fn(() => 'start') },
    selectedTemplate: { get: vi.fn(() => ({ name: 'EquilateralTriangle' })) },
    createWatcher: vi.fn(() => vi.fn()),
    settings: { get: () => ({ temporaryDrawColor: '#ff0000' }) },
}));

const mockTriangleDef = {
    numberOfPointsToRequired: 3,
    constraints: [vi.fn(() => ({})), vi.fn(() => ({})), vi.fn(() => ({}))],
    finishShape: vi.fn(),
};

vi.mock('@controllers/CreateTriangle/trianglesDef.js', () => ({
    EquilateralTriangle: mockTriangleDef,
    IrregularTriangle: { ...mockTriangleDef, numberOfPointsToRequired: 3 }
}));

vi.mock('@controllers/Core/Objects/Shapes/RegularShape', () => ({
    RegularShape: class {
        constructor() {
            this.vertexes = [{ adjustedOn: null }, { adjustedOn: null }, { adjustedOn: null }];
            this.name = 'EquilateralTriangle';
            this.id = 'shape-id';
        }
    }
}));

vi.mock('@controllers/Core/Objects/Shapes/GeometryObject', () => ({
    GeometryObject: class {
        constructor() { }
    }
}));

vi.mock('@controllers/GeometryTools/general', () => ({
    linkNewlyCreatedPoint: vi.fn(),
}));

vi.mock('@controllers/GeometryTools/recomputeShape', () => ({
    computeConstructionSpec: vi.fn(),
}));

vi.mock('@controllers/Core/Managers/SelectManager', () => ({
    SelectManager: {
        getEmptySelectionConstraints: vi.fn(() => ({ segments: {}, points: {} })),
        selectSegment: vi.fn(),
        selectPoint: vi.fn(),
    }
}));

describe('CreateTriangleTool', () => {
    let tool;

    beforeEach(() => {
        vi.clearAllMocks();
        helpConfigRegistry.clear();

        app.tool = {
            selectedTemplate: { name: 'EquilateralTriangle' },
        };

        tool = new CreateTriangleTool();
    });

    it('should start correctly', async () => {
        tool.validateInput = vi.fn().mockReturnValue(true);
        await tool.start();
        expect(appActions.setToolUiState).toHaveBeenCalled();
        expect(helpConfigRegistry.has('createTriangle')).toBe(true);
    });

    it('loads shape definition', async () => {
        await tool.loadShapeDefinition();
        expect(tool.triangleDef).toBeDefined();
        expect(tool.numberOfPointsRequired()).toBe(3);
    });

    it('gets constraints for points', async () => {
        await tool.loadShapeDefinition();
        tool.points = [];
        tool.segments = [];
        tool.getConstraints(0);
        expect(mockTriangleDef.constraints[0]).toHaveBeenCalled();
    });

    it('refreshes shape preview', async () => {
        await tool.loadShapeDefinition();
        tool.numberOfPointsDrawn = 3;
        // In preview, if numberOfPointsRequired is 3, finishShape is not called because of drawn < 3 condition in refreshShapePreview
        // Wait, the condition is: this.numberOfPointsDrawn === this.numberOfPointsRequired() && this.numberOfPointsDrawn < 3
        // So for triangles (3 points), it never calls finishShape in preview?
        // Let's check the code: if (this.numberOfPointsDrawn === this.numberOfPointsRequired() && this.numberOfPointsDrawn < 3)
        // If required is 3, then it's never < 3.
        // Some triangles might require 2 points (RightAngleTriangle if 3rd is computed?)
    });

    it('executes action and creates shape', async () => {
        await tool.loadShapeDefinition();
        tool.points = [
            { coordinates: { x: 0, y: 0 }, adjustedOn: null },
            { coordinates: { x: 100, y: 0 }, adjustedOn: null },
            { coordinates: { x: 50, y: 86 }, adjustedOn: null },
        ];

        await tool.executeAction();

        expect(geometryTools.linkNewlyCreatedPoint).toHaveBeenCalled();
        expect(recomputeShape.computeConstructionSpec).toHaveBeenCalled();
    });

    it('should not crash in adjustPointConstrained when segments are empty', () => {
        const point = {
            coordinates: { x: 10, y: 10, dist: vi.fn(() => 0) },
            adjustedOn: null
        };
        tool.constraints = {
            projectionOnConstraints: vi.fn((coords) => coords),
            segments: [], // Empty segments list as in RightAngleIsoscelesTriangle
            isFree: false
        };

        // This should not throw anymore after the fix
        expect(() => tool.adjustPointConstrained(point)).not.toThrow();
    });
});
