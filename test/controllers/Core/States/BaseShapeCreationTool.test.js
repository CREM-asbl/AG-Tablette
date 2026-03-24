import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BaseShapeCreationTool } from '../../../../src/controllers/Core/States/BaseShapeCreationTool';
import { app, setState } from '../../../../src/controllers/Core/App';
import { appActions } from '../../../../src/store/appState';
import { SelectManager } from '../../../../src/controllers/Core/Managers/SelectManager';

vi.mock('@lit-labs/signals', () => ({
    computed: vi.fn((cb) => ({ get: cb })),
    signal: vi.fn((val) => ({ get: () => val, set: vi.fn() })),
}));

vi.mock('../../../../src/controllers/Core/App', () => {
    const setState = vi.fn();
    const app = {
        tool: { name: 'base', currentStep: 'start' },
        workspace: {
            lastKnownMouseCoordinates: { x: 10, y: 10, toCanvasCoordinates: vi.fn(() => ({x:10, y:10})) }
        },
        upperCanvasLayer: {
            removeAllObjects: vi.fn(),
        },
        settings: {
            temporaryDrawColor: '#ff0000',
        },
        addListener: vi.fn(() => 'listener-id'),
        removeListener: vi.fn(),
    };
    return { app, setState };
});

vi.mock('../../../../src/store/appState', () => ({
    appActions: {
        setToolUiState: vi.fn(),
        setToolState: vi.fn(),
        setCurrentStep: vi.fn(),
        addNotification: vi.fn(),
    }
}));

vi.mock('../../../../src/controllers/Core/Managers/SelectManager', () => ({
    SelectManager: {
        areCoordinatesInMagnetismDistance: vi.fn(() => false),
        getEmptySelectionConstraints: vi.fn(() => ({ points: {}, segments: {} })),
        selectPoint: vi.fn(),
        selectSegment: vi.fn(),
    }
}));

vi.mock('../../../../src/controllers/Core/Objects/Coordinates', () => ({
    Coordinates: class {
        constructor(props) {
            this.x = props.x;
            this.y = props.y;
        }
        toCanvasCoordinates() { return { x: this.x, y: this.y }; }
    }
}));

vi.mock('../../../../src/controllers/Core/Objects/Point', () => ({
    Point: class {
        constructor(props) {
            this.id = 'p-' + Math.random();
            this.coordinates = props.coordinates;
        }
    }
}));

vi.mock('../../../../src/controllers/Core/Objects/Segment', () => ({
    Segment: class {
        constructor(props) {
            this.id = 's-' + Math.random();
        }
    }
}));

vi.mock('../../../../src/controllers/Core/Objects/Shapes/RegularShape', () => ({
    RegularShape: class {
        constructor(props) {
            this.id = 'shape-' + Math.random();
            this.layer = props?.layer || 'upper';
            this.segmentIds = props?.segmentIds || [];
            this.pointIds = props?.pointIds || [];
        }
    }
}));

vi.mock('../../../../src/controllers/Core/Tools/general', () => ({
    findObjectsByName: vi.fn(() => []),
    removeObjectById: vi.fn(),
}));

// Concrete class for testing
class MockCreationTool extends BaseShapeCreationTool {
    constructor() {
        super('mock-create', 'Mock Create', 'mock-family', []);
    }
    async loadShapeDefinition() { this.shapeDefinition = {}; }
    numberOfPointsRequired() { return 2; }
    async executeAction() {}
    refreshShapePreview() { this.previewRefreshed = true; }
}

describe('BaseShapeCreationTool', () => {
    let tool;

    beforeEach(() => {
        vi.clearAllMocks();
        tool = new MockCreationTool();
    });

    it('starts correctly', async () => {
        await tool.start();
        expect(appActions.setToolUiState).toHaveBeenCalled();
    });

    it('handles first point drawing', async () => {
        await tool.drawFirstPoint();
        expect(appActions.setCurrentStep).toHaveBeenCalledWith('drawPoint');
        expect(tool.numberOfPointsDrawn).toBe(0);
    });

    it('adds point on mouse down', () => {
        tool.canvasMouseDown();
        expect(tool.numberOfPointsDrawn).toBe(1);
        expect(tool.points.length).toBe(1);
        expect(appActions.setCurrentStep).toHaveBeenCalledWith('animatePoint');
    });

    it('completes shape when required points are drawn', async () => {
        tool.numberOfPointsDrawn = 1;
        tool.points = [{ id: 'p1' }];
        
        // Add second point
        tool.canvasMouseDown();
        expect(tool.numberOfPointsDrawn).toBe(2);
        
        // Mouse up should complete - completeShape() calls safeExecuteAction() which is async
        tool.canvasMouseUp();
        await Promise.resolve(); // flush microtask queue
        await Promise.resolve(); // flush inner async chain
        expect(appActions.setCurrentStep).toHaveBeenCalledWith('drawFirstPoint');
    });

    it('handles magnetism collision and rollback', () => {
        tool.numberOfPointsDrawn = 2;
        tool.points = [
            { id: 'p1', coordinates: { x: 0, y: 0 } },
            { id: 'p2', coordinates: { x: 1, y: 1 } }
        ];
        tool.segments = [{ id: 's1' }];
        
        vi.mocked(SelectManager.areCoordinatesInMagnetismDistance).mockReturnValue(true);
        
        tool.canvasMouseUp();
        expect(appActions.addNotification).toHaveBeenCalled();
        expect(tool.numberOfPointsDrawn).toBe(1);
        expect(tool.points.length).toBe(1);
        expect(tool.segments.length).toBe(0);
        expect(tool.previewRefreshed).toBe(true);
    });

    it('adjusts point position free', () => {
        const mockPoint = { coordinates: { x: 5, y: 5 } };
        tool.constraints = { isFree: true };
        
        tool.adjustPoint(mockPoint);
        expect(SelectManager.getEmptySelectionConstraints).toHaveBeenCalled();
    });

    it('refreshes state upper', () => {
        app.tool.currentStep = 'animatePoint';
        tool.numberOfPointsDrawn = 1;
        tool.points = [{ coordinates: { x: 0, y: 0 } }];
        
        tool.refreshStateUpper();
        expect(tool.previewRefreshed).toBe(true);
    });
});
