import { app } from '@controllers/Core/App';
import * as generalTools from '@controllers/Core/Tools/general';
import { CreateRegularTool } from '@controllers/CreateRegular/CreateRegularTool';
import { helpConfigRegistry } from '@services/HelpConfigRegistry';
import { appActions } from '@store/appState';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@lit-labs/signals', () => ({
  computed: vi.fn((cb) => ({ get: cb })),
  signal: vi.fn((val) => ({ get: () => val, set: vi.fn() })),
}));

const { appMock } = vi.hoisted(() => ({
  appMock: {
    tool: { name: 'createRegularPolygon', currentStep: 'start' },
    settings: {
      numberOfRegularPoints: 3,
      temporaryDrawColor: '#ff0000',
    },
    upperCanvasLayer: {
      shapes: [],
      segments: [],
      points: [],
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
  }
}));

// Expose app to global for Segment.js and others
window.app = appMock;

vi.mock('@controllers/Core/App', () => {
  const setState = vi.fn();
  return { app: appMock, setState };
});

vi.mock('@store/appState', () => ({
  activeTool: { get: vi.fn(() => 'createRegularPolygon') },
  currentStep: { get: vi.fn(() => 'start') },
  selectedTemplate: { get: vi.fn(() => null) },
  toolState: { get: vi.fn(() => ({})) },
  settings: { get: vi.fn(() => ({ temporaryDrawColor: '#ff0000', numberOfRegularPoints: 3 })) },
  createWatcher: vi.fn(() => vi.fn()),
  appActions: {
    setActiveTool: vi.fn(),
    setCurrentStep: vi.fn(),
    setToolState: vi.fn(),
    setToolUiState: vi.fn(),
    addNotification: vi.fn(),
  },
}));

vi.mock('@controllers/Core/Objects/Point', () => ({
  Point: class {
    constructor(props) {
      this.id = 'p' + Math.random();
      this.coordinates = props.coordinates;
      this.layer = props.layer || 'upper';
      this.segmentIds = []; 
      const layerObj = window.app[this.layer + 'CanvasLayer'];
      if (layerObj && layerObj.points) layerObj.points.push(this);
    }
  }
}));

vi.mock('@controllers/Core/Objects/Shapes/RegularShape', () => ({
  RegularShape: class {
    constructor(props) {
      this.id = 's' + Math.random();
      this.vertexes = [{ adjustedOn: null, segmentIds: [] }, { adjustedOn: null, segmentIds: [] }];
      this.centerCoordinates = { x: 0, y: 0 };
      this.getSVGPath = () => 'M 0 0';
      this.rotate = vi.fn();
      this.translate = vi.fn();
      this.layer = props.layer || 'upper';
      const layerObj = window.app[this.layer + 'CanvasLayer'];
      if (layerObj && layerObj.shapes) layerObj.shapes.push(this);
    }
  }
}));

vi.mock('@controllers/Core/Objects/Shapes/GeometryObject', () => ({
  GeometryObject: class {
    constructor() { }
  }
}));

vi.mock('@controllers/Core/Managers/SelectManager', () => ({
  SelectManager: {
    areCoordinatesInMagnetismDistance: vi.fn(() => false),
    getEmptySelectionConstraints: vi.fn(() => ({ points: {}, segments: {} })),
    selectPoint: vi.fn(),
    selectSegment: vi.fn(),
    areCoordinatesInSelectionDistance: vi.fn(() => false),
  },
}));

vi.mock('@controllers/Core/Tools/general', () => {
    const mockPoint = { id: 'p-mock', segmentIds: [] };
    return {
        createElem: vi.fn(),
        findObjectById: vi.fn(() => mockPoint), 
        removeObjectById: vi.fn(),
        createWatcher: vi.fn(() => vi.fn()),
        uniqId: vi.fn(() => 'test-id'),
    };
});

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
    appMock.upperCanvasLayer.shapes = [];
    appMock.upperCanvasLayer.segments = [];
    appMock.upperCanvasLayer.points = [];
    helpConfigRegistry.clear();
    tool = new CreateRegularTool();
  });

  it('registers help config and opens one popup', () => {
    document.querySelectorAll = vi.fn(() => []);
    tool.start();
    expect(helpConfigRegistry.has('createRegularPolygon')).toBe(true);
    expect(appActions.setActiveTool).toHaveBeenCalledWith('createRegularPolygon');
    expect(generalTools.createElem).toHaveBeenCalledWith('regular-popup');
  });

  it('handles first point creation', () => {
    tool.start();
    tool.canvasMouseDown();
    tool.canvasMouseUp();
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('drawPoint');
  });

  it('handles second point and completes shape', async () => {
    tool.start();
    tool.canvasMouseDown(); // First point
    tool.canvasMouseUp();
    
    tool.canvasMouseDown(); // Second point
    tool.canvasMouseUp();

    await Promise.resolve(); // completeShape
    await Promise.resolve();

    expect(appActions.setCurrentStep).toHaveBeenCalledWith('drawFirstPoint');
  });
});
