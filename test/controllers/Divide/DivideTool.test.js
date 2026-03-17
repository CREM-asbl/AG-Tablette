import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app, setState } from '../../../src/controllers/Core/App';
import { Segment } from '../../../src/controllers/Core/Objects/Segment';
import * as generalTools from '../../../src/controllers/Core/Tools/general';
import { DivideTool } from '../../../src/controllers/Divide/DivideTool';
import { helpConfigRegistry } from '../../../src/services/HelpConfigRegistry';
import { appActions } from '../../../src/store/appState';

vi.mock('@lit-labs/signals', () => ({
  computed: vi.fn((cb) => ({ get: cb })),
  signal: vi.fn((val) => ({ get: () => val, set: vi.fn() })),
}));

vi.mock('../../../src/controllers/Core/App', () => {
  const setState = vi.fn();
  const app = {
    tool: { name: 'divide', currentStep: 'selectObject', firstPointIds: [] },
    settings: {
      numberOfDivisionParts: 2,
      referenceDrawColor: '#00ff00',
      referenceDrawColor2: '#0000ff',
    },
    workspace: {
      selectionConstraints: { points: {}, shapes: {}, segments: {} },
    },
    mainCanvasLayer: {
      shapes: [],
    },
    upperCanvasLayer: {
      removeAllObjects: vi.fn(),
      points: [{ id: 'upper-p1' }],
      shapes: [],
    },
    addListener: vi.fn(() => 'listener-id'),
    removeListener: vi.fn(),
  };
  return { app, setState };
});

vi.mock('../../../src/store/appState', () => ({
  activeTool: { get: vi.fn(() => 'divide') },
  currentStep: { get: vi.fn(() => 'selectObject') },
  toolState: { get: vi.fn(() => ({})) },
  createWatcher: vi.fn(() => vi.fn()),
  appActions: {
    setActiveTool: vi.fn(),
    setToolState: vi.fn(),
    setCurrentStep: vi.fn(),
  },
}));

vi.mock('../../../src/controllers/Core/Objects/Point', () => ({
  Point: class {
    constructor(props) {
      this.id = props.id || 'point-' + Math.random();
      this.coordinates = props.coordinates;
      this.shape = props.shape;
      this.segmentIds = props.segmentIds || [];
    }
  },
}));

vi.mock('../../../src/controllers/Core/Objects/Segment', () => ({
  Segment: class {
    constructor() {
      this.id = 'segment-id';
      this.shape = {};
      this.isArc = () => false;
      this.getSVGPath = () => 'M 0 0';
    }
  },
}));

vi.mock('../../../src/controllers/Core/Objects/Shapes/ArrowLineShape', () => ({
  ArrowLineShape: class { },
}));

vi.mock('../../../src/controllers/Core/Objects/Shapes/LineShape', () => ({
  LineShape: class {
    constructor() {
      this.id = 'line-' + Math.random();
    }
  },
}));

vi.mock('../../../src/controllers/Core/Objects/Shapes/GeometryObject', () => ({
  GeometryObject: class {
    constructor(props) {
      Object.assign(this, props);
    }
  },
}));

vi.mock('../../../src/controllers/Core/Tools/general', () => ({
  findObjectById: vi.fn(),
  removeObjectById: vi.fn(),
}));

describe('DivideTool', () => {
  let tool;

  beforeEach(() => {
    vi.clearAllMocks();
    helpConfigRegistry.clear();
    tool = new DivideTool();
  });

  it('switches to divide when selecting a segment', () => {
    app.tool.currentStep = 'selectObject';
    const segment = new Segment();

    tool.objectSelected(segment);

    expect(tool.mode).toBe('segment');
    expect(appActions.setToolState).toHaveBeenCalledWith({});
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('divide');
    expect(setState).toHaveBeenCalledWith({
      tool: expect.objectContaining({
        name: 'divide',
        currentStep: 'divide',
      }),
    });
  });

  it('switches to selectSecondPoint when selecting first points', () => {
    app.tool.currentStep = 'selectObject';
    const points = [{ id: 'p1' }, { id: 'p2' }];

    tool.objectSelected(points);

    expect(tool.firstPointIds).toEqual(['p1', 'p2']);
    expect(appActions.setToolState).toHaveBeenCalledWith({ firstPointIds: ['p1', 'p2'] });
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('selectSecondPoint');
  });

  it('returns to selectObject when same point is selected twice', () => {
    app.tool.currentStep = 'selectSecondPoint';
    tool.firstPointIds = ['p1'];
    const sameCoords = { dist: vi.fn(() => 0) };
    vi.mocked(generalTools.findObjectById).mockReturnValue({ coordinates: sameCoords });

    tool.objectSelected([{ coordinates: sameCoords }]);

    expect(generalTools.removeObjectById).toHaveBeenCalledWith('upper-p1');
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('selectObject');
  });
});
