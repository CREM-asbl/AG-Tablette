import { CreateRegularTool } from '@controllers/CreateRegular/CreateRegularTool';
import { helpConfigRegistry } from '@services/HelpConfigRegistry';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app, setState } from '@controllers/Core/App';
import { appActions } from '@store/appState';
import { SelectManager } from '@controllers/Core/Managers/SelectManager';
import { Coordinates } from '@controllers/Core/Objects/Coordinates';
import * as generalTools from '@controllers/Core/Tools/general';

vi.mock('@lit-labs/signals', () => ({
  computed: vi.fn((cb) => ({ get: cb })),
  signal: vi.fn((val) => ({ get: () => val, set: vi.fn() })),
}));

vi.mock('@controllers/Core/App', () => {
  const setState = vi.fn();
  const app = {
    tool: { name: 'createRegularPolygon', currentStep: 'start' },
    settings: {
      numberOfRegularPoints: 3,
      temporaryDrawColor: '#ff0000',
    },
    upperCanvasLayer: {
      shapes: [],
      removeAllObjects: vi.fn(),
    },
    gridCanvasLayer: {
        getClosestGridPoint: vi.fn(),
    },
    workspace: {
      lastKnownMouseCoordinates: { x: 10, y: 10 },
    },
    addListener: vi.fn(() => 'listener-id'),
    removeListener: vi.fn(),
  };
  return { app, setState };
});

vi.mock('@store/appState', () => ({
  activeTool: { get: vi.fn(() => 'createRegularPolygon') },
  currentStep: { get: vi.fn(() => 'start') },
  createWatcher: vi.fn(() => vi.fn()),
  appActions: {
    setActiveTool: vi.fn(),
    setCurrentStep: vi.fn(),
    addNotification: vi.fn(),
  },
}));

vi.mock('@controllers/Core/Objects/Point', () => ({
  Point: class {
    constructor(props) {
      this.id = 'p' + Math.random();
      this.coordinates = props.coordinates;
    }
  }
}));

vi.mock('@controllers/Core/Objects/Shapes/RegularShape', () => ({
  RegularShape: class {
    constructor(props) {
      this.id = 's' + Math.random();
      this.vertexes = [{ adjustedOn: null }, { adjustedOn: null }];
      this.centerCoordinates = { x: 0, y: 0 };
      this.getSVGPath = () => 'M 0 0';
      this.rotate = vi.fn();
      this.translate = vi.fn();
    }
  }
}));

vi.mock('@controllers/Core/Objects/Shapes/GeometryObject', () => ({
  GeometryObject: class {
    constructor() {}
  }
}));

vi.mock('@controllers/Core/Managers/SelectManager', () => ({
  SelectManager: {
    areCoordinatesInMagnetismDistance: vi.fn(() => false),
    getEmptySelectionConstraints: vi.fn(() => ({ points: {}, segments: {} })),
    selectPoint: vi.fn(),
    selectSegment: vi.fn(),
  },
}));

vi.mock('@controllers/Core/Tools/general', () => ({
  createElem: vi.fn(),
  findObjectById: vi.fn(),
  removeObjectById: vi.fn(),
}));

vi.mock('@controllers/GeometryTools/general', () => ({
  linkNewlyCreatedPoint: vi.fn(),
}));

vi.mock('@controllers/Core/Tools/automatic_adjustment', () => ({
  getShapeAdjustment: vi.fn(() => ({ rotationAngle: 0, translation: { x: 0, y: 0 } })),
}));

describe('CreateRegularTool', () => {
  let tool;

  beforeEach(() => {
    vi.clearAllMocks();
    helpConfigRegistry.clear();
    tool = new CreateRegularTool();
  });

  const createMockPoint = (x, y) => ({
    coordinates: {
        x, y,
        toCanvasCoordinates: vi.fn(() => ({ x, y }))
    },
    adjustedOn: null
  });

  it('registers help config and opens one popup', () => {
    document.querySelectorAll = vi.fn(() => []);
    tool.start();
    expect(helpConfigRegistry.has('createRegularPolygon')).toBe(true);
    expect(generalTools.createElem).toHaveBeenCalledWith('regular-popup');
  });

  it('handles first point creation', () => {
    app.tool.currentStep = 'animateFirstPoint';
    tool.firstPoint = createMockPoint(0, 0);
    
    tool.canvasMouseUp();
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('drawSecondPoint');
  });

  it('handles second point and completes shape', () => {
    tool.firstPoint = createMockPoint(0, 0);
    tool.secondPoint = createMockPoint(100, 0);
    tool.shapeDrawnId = 's-drawn';
    app.tool.currentStep = 'animateSecondPoint';
    
    const mockShapeDrawn = { 
        getSVGPath: () => 'M 0 0', 
        vertexes: [{}, {}], 
        centerCoordinates: { x: 50, y: 50 },
        rotate: vi.fn(),
        translate: vi.fn(),
    };
    vi.mocked(generalTools.findObjectById).mockReturnValue(mockShapeDrawn);
    
    tool.canvasMouseUp();
    
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('drawFirstPoint');
  });
});
