import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CentralSymetryTool } from '../../../src/controllers/CentralSymetry/CentralSymetryTool';
import { helpConfigRegistry } from '../../../src/services/HelpConfigRegistry';
import { app } from '../../../src/controllers/Core/App';
import { appActions } from '../../../src/store/appState';
import { SelectManager } from '../../../src/controllers/Core/Managers/SelectManager';
import { ShapeManager } from '../../../src/controllers/Core/Managers/ShapeManager';

vi.mock('@lit-labs/signals', () => ({
  computed: vi.fn((cb) => ({ get: cb })),
  signal: vi.fn((val) => ({ get: () => val, set: vi.fn() })),
}));

vi.mock('../../../src/controllers/Core/App', () => {
  const app = {
    tool: { name: 'centralSymetry', currentStep: 'start' },
    environment: { name: 'Geometrie' },
    settings: {
      geometryTransformationAnimation: false,
      referenceDrawColor: '#0000ff',
      referenceDrawColor2: '#00ff00',
    },
    workspace: {
      lastKnownMouseCoordinates: { x: 10, y: 10 },
      centralSymetryLastCharacteristicElements: [],
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
        shapes: []
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
  activeTool: { get: vi.fn(() => 'centralSymetry') },
  currentStep: { get: vi.fn(() => 'start') },
  createWatcher: vi.fn(() => vi.fn()),
  appActions: {
    setActiveTool: vi.fn(),
    setCurrentStep: vi.fn(),
    setToolState: vi.fn(),
  }
}));

vi.mock('../../../src/controllers/Core/Managers/SelectManager', () => ({
  SelectManager: {
    selectObject: vi.fn(),
    getEmptySelectionConstraints: vi.fn(() => ({ points: {}, shapes: {}, segments: {} })),
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
    }
}));

vi.mock('../../../src/controllers/Core/Objects/Shapes/GeometryObject', () => ({
    GeometryObject: class {
        constructor(props) {
            Object.assign(this, props);
        }
    }
}));

vi.mock('../../../src/controllers/Core/Objects/Shapes/SinglePointShape', () => ({
    SinglePointShape: class {
        constructor() {
            this.points = [{ id: 'p-new' }];
        }
    }
}));

describe('CentralSymetryTool', () => {
  let tool;

  beforeEach(() => {
    vi.clearAllMocks();
    helpConfigRegistry.clear();
    app.workspace.selectionConstraints = {
        points: {},
        shapes: {},
        segments: {}
    };
    tool = new CentralSymetryTool();
  });

  it('registers help config in start()', () => {
    vi.useFakeTimers();
    tool.start();
    vi.advanceTimersByTime(100);
    
    expect(helpConfigRegistry.has('centralSymetry')).toBe(true);
    expect(appActions.setActiveTool).toHaveBeenCalledWith('centralSymetry');
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('selectCharacteristicElement');
    vi.useRealTimers();
  });

  it('handles point creation on mouse down', () => {
    tool.canvasMouseDown();
    expect(tool.pointDrawn).toBeDefined();
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('animateCharacteristicElement');
  });

  it('handles center selection on mouse up', () => {
    const mockPoint = { id: 'p-axis', shape: { geometryObject: {} } };
    SelectManager.selectObject.mockReturnValue(mockPoint);
    
    tool.canvasMouseUp();
    
    expect(tool.characteristicElements).toBeDefined();
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('selectObject');
  });

  it('handles object selection and triggers animation', () => {
    const mockShape = { 
        id: 's1', 
        constructor: class { constructor() {} },
        getSVGPath: () => 'M 0 0',
        segments: [],
        vertexes: [],
        geometryObject: { geometryTransformationChildShapeIds: [] }
    };
    
    tool.objectSelected(mockShape);
    
    expect(tool.involvedShapes).toContain(mockShape);
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('central');
  });

  it('executes action and creates symetrical shape', () => {
    const mockShape = { 
        id: 's1', 
        name: 'Triangle',
        constructor: function(props) { 
            Object.assign(this, props); 
            this.points = props.vertexes || [];
        },
        getSVGPath: () => 'M 0 0',
        segments: [],
        vertexes: [{ geometryIsVisible: true }, { geometryIsVisible: true }],
        points: [{ geometryIsVisible: true }, { geometryIsVisible: true }],
        rotate: vi.fn(),
        geometryObject: { 
            geometryTransformationChildShapeIds: [],
            geometryIsVisible: true
        }
    };
    mockShape.constructor.prototype.rotate = vi.fn();

    tool.involvedShapes = [mockShape];
    tool.characteristicElements = { 
        firstElement: { coordinates: { x: 0, y: 0 }, shape: { geometryObject: { geometryTransformationChildShapeIds: [] } } } 
    };
    
    tool._executeAction();
    
    expect(mockShape.geometryObject.geometryTransformationChildShapeIds.length).toBe(1);
  });
});
