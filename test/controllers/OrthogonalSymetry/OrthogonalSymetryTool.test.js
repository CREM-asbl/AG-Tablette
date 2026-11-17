import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrthogonalSymetryTool } from '../../../src/controllers/OrthogonalSymetry/OrthogonalSymetryTool';
import { helpConfigRegistry } from '../../../src/services/HelpConfigRegistry';
import { app } from '../../../src/controllers/Core/App';
import { appActions } from '../../../src/store/appState';
import { SelectManager } from '../../../src/controllers/Core/Managers/SelectManager';
import { ShapeManager } from '../../../src/controllers/Core/Managers/ShapeManager';
import * as generalTools from '../../../src/controllers/Core/Tools/general';

vi.mock('@lit-labs/signals', () => ({
  computed: vi.fn((cb) => ({ get: cb })),
  signal: vi.fn((val) => ({ get: () => val, set: vi.fn() })),
}));

// Valid ID format: 8 chars + layer index (0=main) + type index (0=shape, 1=segment, 2=point)
const MAIN_SHAPE_ID = '1234567800';
const MAIN_SEGMENT_ID = '1234567801';
const MAIN_POINT_ID = '1234567802';

const createMockCoords = (x, y) => ({
    x, y,
    substract: vi.fn(() => createMockCoords(0, 0)),
    add: vi.fn(() => createMockCoords(0, 0)),
    multiply: vi.fn(() => createMockCoords(0, 0)),
    angleWith: vi.fn(() => 0),
});

vi.mock('../../../src/controllers/Core/App', () => {
  const app = {
    tool: { name: 'orthogonalSymetry', currentStep: 'start' },
    environment: { name: 'Geometrie' },
    settings: {
      geometryTransformationAnimation: false,
      referenceDrawColor: '#0000ff',
      referenceDrawColor2: '#00ff00',
    },
    workspace: {
      lastKnownMouseCoordinates: { x: 10, y: 10 },
      orthogonalSymetryLastCharacteristicElements: [],
      selectionConstraints: {
          points: {},
          shapes: {},
          segments: {}
      }
    },
    upperCanvasLayer: {
      removeAllObjects: vi.fn(),
      shapes: [],
      points: []
    },
    mainCanvasLayer: {
        shapes: [],
        segments: [],
        points: []
    },
    fastSelectionConstraints: {
        mousedown_all_shape: { shapes: {} }
    },
    addListener: vi.fn(() => 'listener-id'),
    removeListener: vi.fn(),
  };
  return { app, setState: vi.fn() };
});

vi.mock('../../../src/store/appState', () => ({
  activeTool: { get: vi.fn(() => 'orthogonalSymetry') },
  currentStep: { get: vi.fn(() => 'start') },
  createWatcher: vi.fn(() => vi.fn()),
  appActions: {
    setActiveTool: vi.fn(),
    setCurrentStep: vi.fn(),
    setToolState: vi.fn(),
  }
}));

vi.mock('../../../src/controllers/Core/Managers/SelectManager', () => {
    return {
        SelectManager: {
            selectObject: vi.fn(),
            getEmptySelectionConstraints: vi.fn(() => ({ points: {}, shapes: {}, segments: {} })),
        }
    };
});

vi.mock('../../../src/controllers/Core/Objects/Segment', () => ({
    Segment: class {
        constructor() {
            this.id = MAIN_SEGMENT_ID;
            this.isArc = () => false;
            this.getAngleWithHorizontal = () => 0;
            this.projectionOnSegment = vi.fn(() => ({x:0, y:0}));
            this.getSVGPath = () => 'M 0 0';
        }
    }
}));

vi.mock('../../../src/controllers/Core/Managers/ShapeManager', () => ({
  ShapeManager: {
    getAllBindedShapes: vi.fn((s) => [s]),
    getShapeIndex: vi.fn(() => 0),
  }
}));

vi.mock('../../../src/controllers/Core/Managers/GroupManager', () => ({
    GroupManager: {
        addGroup: vi.fn()
    }
}));

vi.mock('../../../src/controllers/Core/Objects/Point', () => ({
    Point: class {
        constructor(props) {
            this.id = 'p1';
            this.coordinates = props.coordinates;
        }
    }
}));

vi.mock('../../../src/controllers/Core/Objects/CharacteristicElements', () => ({
    CharacteristicElements: class {
        constructor(props) {
            this.type = props.type;
            this.elementIds = props.elementIds;
        }
        equal() { return false; }
        get firstElement() {
            const { findObjectById } = require('../../../src/controllers/Core/Tools/general');
            return findObjectById(this.elementIds[0]);
        }
    }
}));

vi.mock('../../../src/controllers/Core/Objects/Shapes/GeometryObject', () => ({
    GeometryObject: class {
        constructor(props) {
            Object.assign(this, props);
        }
    }
}));

vi.mock('../../../src/controllers/Core/Objects/Shapes/LineShape', () => ({
    LineShape: class {
        constructor() {
            this.id = MAIN_SHAPE_ID;
            this.segments = [{ isInfinite: false, projectionOnSegment: vi.fn(() => ({x:0, y:0})) }];
        }
    }
}));

vi.mock('../../../src/controllers/Core/Objects/Shapes/SinglePointShape', () => ({
    SinglePointShape: class {
        constructor() {
            this.id = MAIN_SHAPE_ID;
            this.points = [{ id: MAIN_POINT_ID }];
        }
    }
}));

vi.mock('../../../src/controllers/Core/Tools/general', () => ({
    findObjectById: vi.fn(),
    removeObjectById: vi.fn(),
}));

import { Segment } from '../../../src/controllers/Core/Objects/Segment';

describe('OrthogonalSymetryTool', () => {
  let tool;

  beforeEach(() => {
    vi.clearAllMocks();
    helpConfigRegistry.clear();
    app.workspace.selectionConstraints = {
        points: {},
        shapes: {},
        segments: {}
    };
    app.mainCanvasLayer.shapes = [];
    app.mainCanvasLayer.segments = [];
    app.mainCanvasLayer.points = [];
    tool = new OrthogonalSymetryTool();
  });

  it('registers help config in start()', () => {
    vi.useFakeTimers();
    tool.start();
    vi.advanceTimersByTime(100);
    
    expect(helpConfigRegistry.has('orthogonalSymetry')).toBe(true);
    expect(appActions.setActiveTool).toHaveBeenCalledWith('orthogonalSymetry');
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('selectFirstReference');
    vi.useRealTimers();
  });

  it('handles axis selection (segment) on mouse down', () => {
    const mockSegment = new Segment();
    SelectManager.selectObject.mockReturnValue(mockSegment);
    tool.pointsDrawn = [];
    
    tool.canvasMouseDown();
    
    expect(tool.characteristicElements).toBeDefined();
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('selectObject');
  });

  it('handles first point selection on mouse down', () => {
    SelectManager.selectObject.mockReturnValue(null);
    tool.pointsDrawn = [];
    
    tool.canvasMouseDown();
    
    expect(tool.pointsDrawn.length).toBe(1);
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('animateFirstRefPoint');
  });

  it('handles object selection and triggers animation', () => {
    const mockShape = { 
        id: MAIN_SHAPE_ID, 
        constructor: function(props) { Object.assign(this, props); },
        getSVGPath: () => 'M 0 0',
        segments: [],
        vertexes: [],
        geometryObject: { geometryTransformationChildShapeIds: [] }
    };
    
    tool.objectSelected(mockShape);
    
    expect(tool.involvedShapes).toContain(mockShape);
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('ortho');
  });

  it('executes action and creates symetrical shape', () => {
    const mockPoint = {
        id: MAIN_POINT_ID,
        coordinates: createMockCoords(0, 0),
        shape: { geometryObject: { geometryTransformationChildShapeIds: [] } }
    };
    
    const mockShape = { 
        id: MAIN_SHAPE_ID, 
        name: 'Triangle',
        constructor: function(props) { 
            Object.assign(this, props); 
            this.points = props.vertexes || [];
        },
        getSVGPath: () => 'M 0 0',
        segments: [],
        vertexes: [{ coordinates: createMockCoords(0, 0), geometryIsVisible: true }],
        points: [{ coordinates: createMockCoords(0, 0), geometryIsVisible: true }],
        reverse: vi.fn(),
        geometryObject: { 
            geometryTransformationChildShapeIds: [],
            geometryIsVisible: true,
            geometryTransformationCharacteristicElements: { elementIds: [MAIN_POINT_ID] }
        }
    };
    
    const mockAxis = {
        id: MAIN_SHAPE_ID,
        segments: [{
            projectionOnSegment: vi.fn(() => createMockCoords(0, 0))
        }]
    };
    
    vi.mocked(generalTools.findObjectById).mockImplementation((id) => {
        if (id === MAIN_POINT_ID) return mockPoint;
        if (id === MAIN_SHAPE_ID) return mockAxis;
        return null;
    });
    
    vi.spyOn(tool, 'referenceShape', 'get').mockReturnValue(mockAxis);
    tool.involvedShapes = [mockShape];
    tool.characteristicElements = { 
        type: 'axis',
        elementIds: [MAIN_POINT_ID],
        equal: () => false,
        get firstElement() { return mockPoint; }
    };
    
    tool._executeAction();
    
    expect(mockShape.geometryObject.geometryTransformationChildShapeIds.length).toBe(1);
  });
});
