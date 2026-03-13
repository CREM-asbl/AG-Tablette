import { CreatePointTool } from '@controllers/CreatePoint/CreatePointTool';
import { helpConfigRegistry } from '@services/HelpConfigRegistry';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app, setState } from '@controllers/Core/App';
import { appActions } from '@store/appState';
import { Coordinates } from '@controllers/Core/Objects/Coordinates';
import * as generalTools from '@controllers/Core/Tools/general';

vi.mock('@lit-labs/signals', () => ({
  computed: vi.fn((cb) => ({ get: cb })),
  signal: vi.fn((val) => ({ get: () => val, set: vi.fn() })),
}));

vi.mock('@controllers/Core/App', () => {
  const setState = vi.fn();
  const app = {
    tool: { name: 'createPoint', currentStep: 'start', selectedTemplate: { name: 'Point' } },
    environment: { name: 'Geometrie' },
    upperCanvasLayer: {
      removeAllObjects: vi.fn(),
    },
    gridCanvasLayer: {
      getClosestGridPoint: vi.fn((c) => c),
    },
    workspace: {
      lastKnownMouseCoordinates: { x: 10, y: 10, toCanvasCoordinates: vi.fn(() => ({ x: 10, y: 10 })) },
    },
    fastSelectionConstraints: {
      click_all_segments: {}
    },
    settings: {
      temporaryDrawColor: '#ff0000',
    },
    addListener: vi.fn(() => 'listener-id'),
    removeListener: vi.fn(),
  };
  return { app, setState };
});

vi.mock('@store/appState', () => ({
  activeTool: { get: vi.fn(() => 'createPoint') },
  currentStep: { get: vi.fn(() => 'start') },
  createWatcher: vi.fn(() => vi.fn()),
  appActions: {
    setToolUiState: vi.fn(),
    setActiveTool: vi.fn(),
    setCurrentStep: vi.fn(),
    addNotification: vi.fn(),
  },
}));

vi.mock('@controllers/Core/Objects/Shapes/SinglePointShape', () => ({
  SinglePointShape: class {
    constructor() {
      this.id = 's1';
      this.geometryObject = {};
    }
  }
}));

vi.mock('@controllers/Core/Objects/Shapes/GeometryObject', () => ({
  GeometryObject: class {
    constructor() {
      this.geometryChildShapeIds = [];
    }
  }
}));

vi.mock('@controllers/Core/Objects/Point', () => ({
  Point: class {
    constructor(props) {
      this.coordinates = props.coordinates;
      this.coordinates.toCanvasCoordinates = vi.fn(() => ({
        x: this.coordinates.x,
        y: this.coordinates.y,
        fromCanvasCoordinates: () => this.coordinates
      }));
    }
  }
}));

vi.mock('@controllers/Core/Tools/general', () => ({
  findObjectById: vi.fn(),
}));

vi.mock('@controllers/GeometryTools/recomputeShape', () => ({
  computeConstructionSpec: vi.fn(),
}));

describe('CreatePointTool', () => {
  let tool;

  beforeEach(() => {
    vi.clearAllMocks();
    helpConfigRegistry.clear();
    app.tool.selectedTemplate.name = 'Point';
    tool = new CreatePointTool();
  });

  it('registers help config in start()', () => {
    tool.start();
    expect(helpConfigRegistry.has('createPoint')).toBe(true);
    expect(appActions.setToolUiState).toHaveBeenCalled();
  });

  it('handles drawPoint step', () => {
    tool.drawPoint();
    expect(app.addListener).toHaveBeenCalledWith('canvasMouseDown', expect.any(Function));
  });

  it('creates a simple point on mouse down and up', () => {
    // Mouse down
    tool.canvasMouseDown();
    expect(tool.point).toBeDefined();
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('animatePoint');
    
    // Mouse up
    tool.canvasMouseUp();
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('drawPoint');
  });

  it('creates a PointOnIntersection', () => {
    app.tool.selectedTemplate.name = 'PointOnIntersection';
    const mockSeg1 = { id: 'seg1', shape: { geometryObject: { geometryChildShapeIds: [] } }, intersectionWith: () => [{ x: 5, y: 5 }] };
    const mockSeg2 = { id: 'seg2', shape: { geometryObject: { geometryChildShapeIds: [] } } };
    
    vi.mocked(generalTools.findObjectById).mockImplementation((id) => {
        if (id === 'seg1') return mockSeg1;
        if (id === 'seg2') return mockSeg2;
        return null;
    });

    tool.geometryParentObjectId1 = 'seg1';
    tool.geometryParentObjectId2 = 'seg2';
    
    tool._executeAction();
    
    expect(mockSeg1.shape.geometryObject.geometryChildShapeIds).toContain('s1');
  });
});
