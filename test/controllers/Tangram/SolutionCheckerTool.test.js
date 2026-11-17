import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  appMock,
  setStateMock,
  appActionsMock,
  tangramStateMock,
  silhouetteMock,
} = vi.hoisted(() => ({
  appMock: {
    tangram: { currentStep: 'start', level: 1 },
    fullHistory: { isRunning: false },
    history: { startSituation: null },
    tool: { name: 'otherTool', currentStep: 'start' },
    addListener: vi.fn((eventName) => `${eventName}-id`),
    removeListener: vi.fn(),
    mainCanvasLayer: { shapes: [{ id: 'shape-1', name: 'tangramChecker' }] },
    left_menu: { querySelector: vi.fn(() => null), appendChild: vi.fn() },
    workspace: {
      limited: false,
      zoomLevel: 1,
      setZoomLevel: vi.fn(),
      initFromObject: vi.fn(),
      resetWorkspace: vi.fn(),
      data: { objects: { shapesData: [] }, backObjects: { shapesData: [] } },
    },
    tangramCanvasLayer: {
      style: {},
      removeAllObjects: vi.fn(),
    },
  },
  setStateMock: vi.fn(),
  appActionsMock: {
    setTangramState: vi.fn(),
    setHistoryState: vi.fn(),
    setFullHistoryState: vi.fn(),
    setStepSinceSave: vi.fn(),
  },
  tangramStateMock: {
    get: vi.fn(() => ({ currentStep: 'start' })),
  },
  silhouetteMock: {
    instances: [],
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
    constructor(shapes, loadFromSave, level) {
      silhouetteMock.instances.push({ shapes, loadFromSave, level });
    }
    positionInTangramCanvas() { }
  },
}));

vi.mock('../../../src/controllers/Tangram/TangramManager', () => ({
  TangramManager: {
    initShapes: vi.fn(),
  },
}));

// Les imports dynamiques de popups/composants Lit peuvent se déclencher pendant/juste après le teardown en CI.
// On les neutralise ici pour éviter les EnvironmentTeardownError.
vi.mock('@components/popups/open-popup', () => ({}));
vi.mock('../../../src/controllers/Tangram/state-menu', () => ({}));
vi.mock('../../../src/controllers/Tangram/level-popup.js', () => ({}));

import { SolutionCheckerTool } from '../../../src/controllers/Tangram/SolutionCheckerTool';

describe('SolutionCheckerTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appMock.fullHistory.isRunning = false;
    appMock.tangram.currentStep = 'start';
    appMock.tangram.level = 1;
    appMock.history.startSituation = null;
    appMock.mainCanvasLayer.shapes = [{ id: 'shape-1', name: 'tangramChecker' }];
    appMock.workspace.limited = false;
    appMock.workspace.zoomLevel = 1;
    appMock.workspace.data = {
      objects: { shapesData: [] },
      backObjects: { shapesData: [] },
    };
    appMock.tangramCanvasLayer.style = {};
    silhouetteMock.instances = [];
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

  it('s abonne et se desabonne aux evenements de menu niveau/recommencer', () => {
    const tool = new SolutionCheckerTool();
    tool.stateMenu = { close: vi.fn() };

    tool.connectedCallback();

    expect(appMock.addListener).toHaveBeenCalledWith('tangram:level-menu-clicked', expect.any(Function));
    expect(appMock.addListener).toHaveBeenCalledWith('tangram:restart-menu-clicked', expect.any(Function));

    tool.disconnectedCallback();

    expect(appMock.removeListener).toHaveBeenCalledWith('tangram:level-menu-clicked', 'tangram:level-menu-clicked-id');
    expect(appMock.removeListener).toHaveBeenCalledWith('tangram:restart-menu-clicked', 'tangram:restart-menu-clicked-id');
  });

  it('initData memorise les backObjects, le zoom initial et le niveau affiche', async () => {
    const tool = new SolutionCheckerTool();
    appMock.workspace.zoomLevel = 1.5;
    appMock.workspace.data = {
      objects: { shapesData: [] },
      backObjects: { shapesData: [{ path: 'M0 0' }] },
    };

    await tool.initData({ fileExtension: 'ags', tangramLevelSelected: 3 });

    expect(tool.backObjects).toEqual({ shapesData: [{ path: 'M0 0' }] });
    expect(tool.fileExtension).toBe('ags');
    expect(tool.initialZoom).toBe(1.5);
    expect(tool.renderedLevel).toBe(3);
    expect(appMock.workspace.limited).toBe(true);
    expect(silhouetteMock.instances.at(-1).level).toBe(3);
    expect(appActionsMock.setTangramState).toHaveBeenCalledWith({ isSilhouetteShown: true, level: 3 });
  });

  it('applyLevel redessine la silhouette et conserve les pieces de l eleve', () => {
    const tool = new SolutionCheckerTool();
    tool.backObjects = { shapesData: [{ path: 'M0 0' }] };
    tool.fileExtension = 'ags';
    tool.initialZoom = 1;
    tool.stateMenu = { level: 1 };
    appMock.workspace.zoomLevel = 2;

    tool.applyLevel(4);

    expect(appMock.workspace.setZoomLevel).toHaveBeenCalledWith(1);
    expect(appMock.tangramCanvasLayer.removeAllObjects).toHaveBeenCalled();
    expect(silhouetteMock.instances.at(-1).level).toBe(4);
    expect(appMock.workspace.limited).toBe(true);
    expect(appMock.tangramCanvasLayer.style).toContain('rgba(255, 0, 0, 0.2)');
    expect(appActionsMock.setTangramState).toHaveBeenCalledWith({ level: 4 });
    expect(tool.stateMenu.level).toBe(4);
    expect(tool.renderedLevel).toBe(4);
    expect(appMock.mainCanvasLayer.shapes).toEqual([{ id: 'shape-1', name: 'tangramChecker' }]);
  });

  it('applyLevel desactive la zone interdite pour un niveau inferieur a 3', () => {
    const tool = new SolutionCheckerTool();
    tool.backObjects = { shapesData: [] };
    tool.initialZoom = 1;
    appMock.workspace.limited = true;
    appMock.tangramCanvasLayer.style = {
      backgroundColor: 'rgba(255, 0, 0, 0.2)',
      zIndex: 10,
    };

    tool.applyLevel(2);

    expect(appMock.workspace.limited).toBe(false);
    expect(appMock.tangramCanvasLayer.style.backgroundColor).toBe('transparent');
    expect(appMock.tangramCanvasLayer.style.zIndex).toBe(0);
  });

  it('applyLevel ne touche pas au zoom quand il est deja celui de depart', () => {
    const tool = new SolutionCheckerTool();
    tool.backObjects = { shapesData: [] };
    tool.initialZoom = 1;
    appMock.workspace.zoomLevel = 1;

    tool.applyLevel(2);

    expect(appMock.workspace.setZoomLevel).not.toHaveBeenCalled();
  });

  it('applyLevel ne fait rien sans backObjects', () => {
    const tool = new SolutionCheckerTool();
    tool.backObjects = null;

    tool.applyLevel(3);

    expect(silhouetteMock.instances).toHaveLength(0);
    expect(appActionsMock.setTangramState).not.toHaveBeenCalled();
  });

  it('applique le niveau choisi depuis le menu', async () => {
    const tool = new SolutionCheckerTool();
    tool.backObjects = { shapesData: [] };
    tool.initialZoom = 1;
    const selectSpy = vi.spyOn(SolutionCheckerTool, 'selectLevel').mockResolvedValue(6);

    await tool.levelMenuHandler();

    expect(selectSpy).toHaveBeenCalledWith(1);
    expect(silhouetteMock.instances.at(-1).level).toBe(6);
    selectSpy.mockRestore();
  });

  it('restartExercise recharge la situation de depart et remet l historique a zero', async () => {
    const tool = new SolutionCheckerTool();
    tool.backObjects = { shapesData: [] };
    tool.initialZoom = 1;
    appMock.history.startSituation = { objects: { shapesData: [] }, zoomLevel: 1 };

    await tool.restartExercise(5);

    expect(appMock.workspace.initFromObject).toHaveBeenCalledWith({ objects: { shapesData: [] }, zoomLevel: 1 });
    expect(appActionsMock.setHistoryState).toHaveBeenCalledWith({
      steps: [],
      currentIndex: -1,
      canUndo: false,
      canRedo: false,
      size: 0,
    });
    expect(appActionsMock.setFullHistoryState).toHaveBeenCalledWith({
      index: 0,
      actionIndex: 0,
      numberOfActions: 0,
      steps: [],
    });
    expect(appActionsMock.setStepSinceSave).toHaveBeenCalledWith(false);
    expect(silhouetteMock.instances.at(-1).level).toBe(5);
    expect(appActionsMock.setHistoryState).toHaveBeenLastCalledWith({
      startSituation: appMock.workspace.data,
    });
  });

  it('restartExercise utilise resetWorkspace sans situation de depart', async () => {
    const tool = new SolutionCheckerTool();
    tool.backObjects = { shapesData: [] };
    tool.initialZoom = 1;

    await tool.restartExercise(2);

    expect(appMock.workspace.resetWorkspace).toHaveBeenCalledTimes(1);
    expect(appMock.workspace.initFromObject).not.toHaveBeenCalled();
    expect(silhouetteMock.instances.at(-1).level).toBe(2);
  });

  it('recommence l exercice dans un autre niveau depuis le menu', async () => {
    const tool = new SolutionCheckerTool();
    tool.backObjects = { shapesData: [] };
    tool.initialZoom = 1;
    appMock.history.startSituation = { objects: { shapesData: [] } };
    const selectSpy = vi.spyOn(SolutionCheckerTool, 'selectLevel').mockResolvedValue(3);

    await tool.restartMenuHandler();

    expect(selectSpy).toHaveBeenCalledWith(1);
    expect(appMock.workspace.initFromObject).toHaveBeenCalled();
    expect(silhouetteMock.instances.at(-1).level).toBe(3);
    selectSpy.mockRestore();
  });

  it('re-applique la silhouette si le niveau de l etat differe du niveau affiche', () => {
    const tool = new SolutionCheckerTool();
    tool.backObjects = { shapesData: [] };
    tool.initialZoom = 1;
    tool.renderedLevel = 1;
    tangramStateMock.get.mockReturnValue({ level: 4 });

    tool.tangramLevelHandler();

    expect(silhouetteMock.instances.at(-1).level).toBe(4);
  });

  it('ne re-dessine pas la silhouette si le niveau est inchange', () => {
    const tool = new SolutionCheckerTool();
    tool.backObjects = { shapesData: [] };
    tool.renderedLevel = 2;
    tangramStateMock.get.mockReturnValue({ level: 2 });

    tool.tangramLevelHandler();

    expect(silhouetteMock.instances).toHaveLength(0);
  });
});
