import { app } from '@controllers/Core/App';
import { ScalarMultiplicationTool } from '@controllers/ScalarMultiplication/ScalarMultiplication';
import { helpConfigRegistry } from '@services/HelpConfigRegistry';
import { appActions } from '@store/appState';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@lit-labs/signals', () => ({
  computed: vi.fn((cb) => ({ get: cb })),
  signal: vi.fn((val) => ({ get: () => val, set: vi.fn() })),
}));

vi.mock('@controllers/Core/App', () => {
  const app = {
    tool: { name: 'scalarMultiplication', currentStep: 'start' },
    settings: {
      scalarNumerator: 2,
      scalarDenominator: 3,
    },
    workspace: {
      selectionConstraints: {},
    },
    fastSelectionConstraints: {
      click_all_shape: {},
    },
    upperCanvasLayer: {
      removeAllObjects: vi.fn(),
    },
    addListener: vi.fn(() => 'listener-id'),
    removeListener: vi.fn(),
  };

  return { app, setState: vi.fn() };
});

vi.mock('@store/appState', () => ({
  activeTool: { get: vi.fn(() => 'scalarMultiplication'), set: vi.fn() },
  currentStep: { get: vi.fn(() => 'start'), set: vi.fn() },
  toolState: { get: vi.fn(() => ({})), set: vi.fn() },
  appActions: {
    setActiveTool: vi.fn(),
    setCurrentStep: vi.fn(),
    setToolState: vi.fn(),
    updateSettings: vi.fn(),
  },
}));

vi.mock('@controllers/Core/Objects/Shapes/ArrowLineShape', () => ({
  ArrowLineShape: class {
    constructor(props) {
      Object.assign(this, props);
      this.id = 'new-arrow-id';
    }
  },
}));

vi.mock('@controllers/Core/Objects/Shapes/GeometryObject', () => ({
  GeometryObject: class {
    constructor(props) {
      Object.assign(this, props);
    }
  },
}));

vi.mock('@controllers/Core/Tools/general', () => ({
  createElem: vi.fn(),
  findObjectById: vi.fn(() => ({
    id: 'vector-1',
    name: 'Vector',
    fillColor: '#000',
    fillOpacity: 1,
    strokeColor: '#000',
    segments: [{ vertexes: [{ x: 0, y: 0 }] }],
    vertexes: [
      { coordinates: { x: 0, y: 0 } },
      {
        coordinates: {
          x: 1,
          y: 0,
          substract: vi.fn(() => ({ multiply: vi.fn(() => ({ x: 2, y: 0 })) })),
        },
      },
    ],
    geometryObject: { geometryMultipliedChildShapeIds: [] },
  })),
}));

vi.mock('@controllers/GeometryTools/recomputeShape', () => ({
  computeConstructionSpec: vi.fn(),
}));

describe('ScalarMultiplicationTool', () => {
  let tool;

  beforeEach(() => {
    vi.clearAllMocks();
    helpConfigRegistry.clear();
    app.tool.currentStep = 'start';
    tool = new ScalarMultiplicationTool();
  });

  it('registers help config and activates tool in start()', () => {
    tool.start();

    expect(helpConfigRegistry.has('scalarMultiplication')).toBe(true);
    expect(appActions.setActiveTool).toHaveBeenCalledWith('scalarMultiplication');
  });

  it('sets selectObject step in signals when entering selectObject()', () => {
    tool.selectObject();

    expect(appActions.setCurrentStep).toHaveBeenCalledWith('selectObject');
  });

  it('returns to selectObject after animation execution', () => {
    vi.useFakeTimers();
    tool.executeAction = vi.fn();

    tool.executeAnimation();
    vi.advanceTimersByTime(250);

    expect(tool.executeAction).toHaveBeenCalled();
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('selectObject');

    vi.useRealTimers();
  });
});
