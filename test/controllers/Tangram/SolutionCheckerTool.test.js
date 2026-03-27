import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  appMock,
  setStateMock,
  appActionsMock,
  tangramStateMock,
} = vi.hoisted(() => ({
  appMock: {
    tangram: { currentStep: 'start', level: 1 },
    fullHistory: { isRunning: false },
    tool: { name: 'otherTool', currentStep: 'start' },
    addListener: vi.fn((eventName) => `${eventName}-id`),
    removeListener: vi.fn(),
    mainCanvasLayer: { shapes: [{ id: 'shape-1', name: 'tangramChecker' }] },
    workspace: { limited: false },
    tangramCanvasLayer: {
      style: {},
      removeAllObjects: vi.fn(),
    },
  },
  setStateMock: vi.fn(),
  appActionsMock: {
    setTangramState: vi.fn(),
  },
  tangramStateMock: {
    get: vi.fn(() => ({ currentStep: 'start' })),
  },
}));

vi.mock('../../../src/controllers/Core/App', () => ({
  app: appMock,
  setState: setStateMock,
}));

vi.mock('../../../src/store/appState', () => ({
  appActions: appActionsMock,
  tangramState: tangramStateMock,
}));

vi.mock('../../../src/store/tools', () => ({
  tools: {
    get: vi.fn(() => [
      { name: 'translate', isDisable: false },
      { name: 'color', isDisable: true },
    ]),
    set: vi.fn(),
  },
}));

vi.mock('../../../src/controllers/Core/Managers/GroupManager', () => ({
  GroupManager: { addGroup: vi.fn() },
}));

vi.mock('../../../src/controllers/Core/Objects/Bounds', () => ({
  Bounds: { getOuterBounds: vi.fn(() => ({ minX: 0, maxX: 1, minY: 0, maxY: 1 })) },
}));

vi.mock('../../../src/controllers/Core/Objects/Coordinates', () => ({
  Coordinates: class Coordinates {
    constructor({ x, y }) {
      this.x = x;
      this.y = y;
    }
    dist() {
      return 1;
    }
    angleWith() {
      return 0;
    }
    equal(other) {
      return this.x === other.x && this.y === other.y;
    }
  },
}));

vi.mock('../../../src/controllers/Core/Objects/Segment', () => ({
  Segment: class Segment { },
}));

vi.mock('../../../src/controllers/Core/Objects/ShapeGroup', () => ({
  ShapeGroup: class ShapeGroup {
    constructor() {
      this.shapesIds = [];
    }
  },
}));

vi.mock('../../../src/controllers/Core/Objects/Shapes/RegularShape', () => ({
  RegularShape: class RegularShape {
    constructor() {
      this.bounds = { minX: 0, maxX: 1, minY: 0, maxY: 1 };
    }
    cleanSameDirectionSegment() { }
    homothety() { }
  },
}));

vi.mock('../../../src/controllers/Core/Tools/general.js', () => ({
  createElem: vi.fn(() => ({ onselect: null })),
}));

vi.mock('../../../src/controllers/Tangram/Silhouette', () => ({
  Silhouette: class Silhouette {
    positionInTangramCanvas() { }
  },
}));

vi.mock('../../../src/controllers/Tangram/TangramManager', () => ({
  TangramManager: {
    initShapes: vi.fn(),
  },
}));

import { SolutionCheckerTool } from '../../../src/controllers/Tangram/SolutionCheckerTool';

describe('SolutionCheckerTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appMock.fullHistory.isRunning = false;
    appMock.tangram.currentStep = 'start';
    appMock.mainCanvasLayer.shapes = [{ id: 'shape-1', name: 'tangramChecker' }];
    tangramStateMock.get.mockReturnValue({ currentStep: 'start' });
  });

  it('s abonne et se desabonne aux evenements tangram legacy + signaux', () => {
    const tool = new SolutionCheckerTool();
    tool.stateMenu = { close: vi.fn() };

    tool.connectedCallback();

    expect(appMock.addListener).toHaveBeenCalledWith('tangram-changed', expect.any(Function));
    expect(appMock.addListener).toHaveBeenCalledWith('tangram:state-changed', expect.any(Function));
    expect(appMock.addListener).toHaveBeenCalledWith('objectSelected', expect.any(Function));

    tool.disconnectedCallback();

    expect(appMock.removeListener).toHaveBeenCalledWith('tangram-changed', 'tangram-changed-id');
    expect(appMock.removeListener).toHaveBeenCalledWith('tangram:state-changed', 'tangram:state-changed-id');
    expect(appMock.removeListener).toHaveBeenCalledWith('objectSelected', 'objectSelected-id');
    expect(tool.stateMenu.close).toHaveBeenCalledTimes(1);
  });

  it('declenche check sur evenement tangram:state-changed', () => {
    const tool = new SolutionCheckerTool();
    tool.stateMenu = { check: false };
    tool.check = vi.fn();

    tangramStateMock.get.mockReturnValue({ currentStep: 'check' });

    tool.handler({ type: 'tangram:state-changed' });

    expect(tool.stateMenu.check).toBe(true);
    expect(tool.check).toHaveBeenCalledTimes(1);
  });

  it('bascule en uncheck via signaux quand objet hors solution', () => {
    const tool = new SolutionCheckerTool();

    tool.objectSelected({ id: 'unknown-shape' });

    expect(appActionsMock.setTangramState).toHaveBeenCalledWith({ currentStep: 'uncheck' });
  });
});
