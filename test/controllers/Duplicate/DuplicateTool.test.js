import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@lit-labs/signals', () => ({
  computed: vi.fn((cb) => ({ get: cb })),
  signal: vi.fn((val) => ({ get: () => val, set: vi.fn() })),
}));

vi.mock('../../../src/controllers/Core/App', () => {
  const setState = vi.fn();
  const createMockCoords = (x, y) => ({
    x, y,
    substract: vi.fn(() => createMockCoords(0, 0)),
    add: vi.fn(() => createMockCoords(0, 0)),
  });
  const app = {
    tool: { name: 'duplicate', currentStep: 'start' },
    workspace: {
      lastKnownMouseCoordinates: createMockCoords(10, 10),
      selectionConstraints: {
        shapes: {},
        points: {},
        segments: {}
      }
    },
    mainCanvasLayer: {
      shapes: [],
    },
    upperCanvasLayer: {
      removeAllObjects: vi.fn(),
      shapes: [],
    },
    settings: {
      automaticAdjustment: true
    },
    addListener: vi.fn(() => 'listener-id'),
    removeListener: vi.fn(),
  };
  return { app, setState };
});

vi.mock('../../../src/store/appState', () => ({
  activeTool: { get: vi.fn(() => 'duplicate') },
  currentStep: { get: vi.fn(() => 'start') },
  toolState: { get: vi.fn(() => ({})) },
  createWatcher: vi.fn(() => vi.fn()),
  appActions: {
    setActiveTool: vi.fn(),
    setCurrentStep: vi.fn(),
    setToolState: vi.fn(),
  },
}));

vi.mock('../../../src/controllers/Core/Managers/ShapeManager', () => ({
  ShapeManager: {
    getAllBindedShapes: vi.fn((s) => [s]),
    addShape: vi.fn(),
  },
}));

vi.mock('../../../src/controllers/Core/Managers/GroupManager', () => ({
  GroupManager: {
    getShapeGroup: vi.fn(),
    addGroup: vi.fn(),
  },
}));

vi.mock('../../../src/controllers/Core/Tools/shapesTools', () => ({
  duplicateShape: vi.fn((s) => ({
    ...s,
    id: s.id + '_copy',
    translate: vi.fn(),
    rotate: vi.fn(),
    getSVGPath: () => 'M 0 0'
  })),
}));

vi.mock('../../../src/controllers/Core/Objects/ShapeGroup', () => ({
  ShapeGroup: class {
    constructor() {
      this.shapesIds = [];
    }
  }
}));

vi.mock('../../../src/controllers/Core/Objects/Shapes/RegularShape', () => {
  function RegularShapeMock(props) {
    this.id = props?.id || 'new-shape-' + Math.random();
    this.name = props?.name || 'Mock';
    this.vertexes = props?.vertexes || [];
    this.segments = props?.segments || [];
    this.points = props?.points || [];
    this.geometryObject = { geometryDuplicateChildShapeIds: [] };
    this.translate = vi.fn();
    this.rotate = vi.fn();
    this.getSVGPath = vi.fn(() => 'M 0 0');
  }
  return { RegularShape: RegularShapeMock };
});

vi.mock('../../../src/controllers/Core/Objects/Shapes/GeometryObject', () => ({
  GeometryObject: class {
    constructor() {
      this.geometryDuplicateChildShapeIds = [];
    }
  }
}));

vi.mock('../../../src/controllers/Core/Tools/automatic_adjustment', () => ({
  getShapeAdjustment: vi.fn(() => ({ rotationAngle: 0, translation: { x: 0, y: 0 } }))
}));

import { app, setState } from '../../../src/controllers/Core/App';
import { ShapeManager } from '../../../src/controllers/Core/Managers/ShapeManager';
import { RegularShape } from '../../../src/controllers/Core/Objects/Shapes/RegularShape';
import { DuplicateTool } from '../../../src/controllers/Duplicate/DuplicateTool';
import { helpConfigRegistry } from '../../../src/services/HelpConfigRegistry';
import { appActions, currentStep } from '../../../src/store/appState';

describe('DuplicateTool', () => {
  let tool;

  beforeEach(() => {
    vi.clearAllMocks();
    helpConfigRegistry.clear();
    tool = new DuplicateTool();
  });

  const createMockCoords = (x, y) => ({
    x, y,
    substract: vi.fn(() => createMockCoords(0, 0)),
    add: vi.fn(() => createMockCoords(0, 0)),
  });

  it('registers help config in start()', () => {
    vi.useFakeTimers();
    tool.start();
    expect(helpConfigRegistry.has('duplicate')).toBe(true);
    vi.advanceTimersByTime(100);
    expect(appActions.setActiveTool).toHaveBeenCalledWith('duplicate');
    expect(appActions.setToolState).toHaveBeenCalledWith({});
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('listen');
    vi.useRealTimers();
  });

  it('handles object selection and switches to move', () => {
    const mockShape = {
      id: 's1',
      name: 'Mock',
      getSVGPath: () => 'M 0 0',
      segments: [],
      vertexes: [],
      points: [],
      translate: vi.fn(),
      rotate: vi.fn(),
      constructor: RegularShape
    };
    app.tool.currentStep = 'listen';

    tool.objectSelected(mockShape);

    expect(tool.involvedShapes).toContain(mockShape);
    expect(appActions.setToolState).toHaveBeenCalledWith({});
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('move');
  });

  it('executes duplication on mouse up', () => {
    const mockShape = {
      id: 's1',
      name: 'Mock',
      translate: vi.fn(),
      rotate: vi.fn(),
      segments: [],
      vertexes: [],
      points: [],
      getSVGPath: () => 'M 0 0',
      geometryObject: { geometryDuplicateChildShapeIds: [] },
      constructor: RegularShape
    };
    tool.involvedShapes = [mockShape];
    tool.startClickCoordinates = createMockCoords(0, 0);
    tool.translateOffset = createMockCoords(0, 0);
    tool.mode = 'shape';
    tool.translation = createMockCoords(5, 5);

    // Ensure both app object and signal mock reflect the 'move' step
    app.tool.currentStep = 'move';
    vi.mocked(currentStep.get).mockReturnValue('move');

    tool.canvasMouseUp();

    expect(ShapeManager.addShape).toHaveBeenCalled();
    expect(appActions.setToolState).toHaveBeenCalledWith({});
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('listen');
    expect(setState).toHaveBeenCalledWith({
      tool: expect.objectContaining({
        name: 'duplicate',
        currentStep: 'listen',
      }),
    });
  });
});
