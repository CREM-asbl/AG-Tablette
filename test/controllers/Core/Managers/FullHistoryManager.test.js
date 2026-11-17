import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../../src/controllers/Core/App', () => {
  const app = {
    settings: {},
    history: {
      startSituation: {},
      startSettings: {},
    },
    fullHistory: {
      index: 0,
      actionIndex: 0,
      numberOfActions: 0,
      isRunning: true,
      isPlaying: false,
      timeoutId: null,
      steps: [],
    },
    workspace: {
      initFromObject: vi.fn(),
      lastKnownMouseCoordinates: { x: 0, y: 0 },
    },
  };

  return {
    app,
    setState: vi.fn(),
  };
});

vi.mock('../../../../src/store/appState', () => ({
  appActions: {
    setActiveTool: vi.fn(),
    setCurrentStep: vi.fn(),
    setToolState: vi.fn(),
    updateSettings: vi.fn(),
    bumpCanvasRedraw: vi.fn(),
    setTangramState: vi.fn(),
    setFullHistoryState: vi.fn(),
    addNotification: vi.fn(),
    setHistoryState: vi.fn(),
    setStepSinceSave: vi.fn(),
  },
  historyState: {
    get: vi.fn(() => ({ startSituation: {}, startSettings: {} })),
  },
  fullHistoryState: {
    get: vi.fn(() => ({ index: 0, actionIndex: 0, steps: [], isRunning: true })),
  },
  settings: {
    get: vi.fn(() => ({})),
  },
  tangramState: {
    get: vi.fn(() => ({})),
  }
}));

vi.mock('../../../../src/controllers/Core/Objects/Coordinates', () => ({
  Coordinates: class {
    constructor({ x, y }) {
      this.x = x;
      this.y = y;
    }
  },
}));

vi.mock('../../../../src/controllers/Core/Tools/utils', () => ({
  createElem: vi.fn(),
}));

vi.mock('../../../../src/controllers/Core/Managers/SelectManager', () => ({
  SelectManager: {
    selectObject: vi.fn(),
  },
}));

vi.mock('../../../../src/store/gridStore', () => ({
  gridStore: {
    setGridType: vi.fn(),
    setGridSize: vi.fn(),
    setIsVisible: vi.fn(),
  },
}));

import { app } from '../../../../src/controllers/Core/App';
import { FullHistoryManager } from '../../../../src/controllers/Core/Managers/FullHistoryManager';
import { appActions, fullHistoryState } from '../../../../src/store/appState';

describe('FullHistoryManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    app.fullHistory.index = 0;
    app.fullHistory.actionIndex = 0;
    app.fullHistory.numberOfActions = 1;
    app.fullHistory.isRunning = true;
    app.fullHistory.steps = [];

    vi.mocked(fullHistoryState.get).mockReturnValue({
      index: 0,
      actionIndex: 0,
      numberOfActions: 1,
      isRunning: true,
      steps: []
    });
  });

  it('syncs appActions on tool-updated step', async () => {
    const steps = [
      {
        type: 'tool-updated',
        detail: {
          name: 'move',
          currentStep: 'listen',
          selectedTemplate: 'segment',
        },
      },
    ];

    vi.mocked(fullHistoryState.get).mockReturnValue({
      index: 0,
      actionIndex: 0,
      steps: steps,
      isRunning: true
    });

    await FullHistoryManager.executeStep(0);

    expect(appActions.setActiveTool).toHaveBeenCalledWith('move');
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('listen');
    expect(appActions.setToolState).toHaveBeenCalledWith({
      selectedTemplate: 'segment',
    });
  });

  it('keeps animation step payload on tool-updated replay', async () => {
    const steps = [
      {
        type: 'tool-updated',
        detail: {
          name: 'move',
          currentStep: 'move',
          selectedShapeId: 'shape-1',
        },
      },
    ];

    vi.mocked(fullHistoryState.get).mockReturnValue({
      index: 0,
      actionIndex: 0,
      steps: steps,
      isRunning: true
    });

    await FullHistoryManager.executeStep(0);

    expect(appActions.setActiveTool).toHaveBeenCalledWith('move');
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('move');
    expect(appActions.setToolState).toHaveBeenCalledWith({
      selectedShapeId: 'shape-1',
    });
  });

  it('syncs appActions on settings-changed step', async () => {
    const steps = [
      {
        type: 'settings-changed',
        detail: {
          gridShown: true,
          gridSize: 20,
        },
      },
    ];

    vi.mocked(fullHistoryState.get).mockReturnValue({
      index: 0,
      actionIndex: 0,
      steps: steps,
      isRunning: true
    });

    await FullHistoryManager.executeStep(0);

    expect(appActions.updateSettings).toHaveBeenCalledWith({
      gridShown: true,
      gridSize: 20,
    });
  });

  it('syncs tangram state on add-fullstep with tangram payload', async () => {
    vi.useFakeTimers();
    const steps = [
      {
        type: 'add-fullstep',
        detail: {
          actionIndex: 1,
          name: 'Diviser',
          data: {
            tangram: {
              isSilhouetteShown: true,
            },
          },
        },
      },
    ];

    vi.mocked(fullHistoryState.get).mockReturnValue({
      index: 0,
      actionIndex: 0,
      steps: steps,
      isRunning: true,
      numberOfActions: 1,
    });

    const promise = FullHistoryManager.executeStep(0);
    vi.advanceTimersByTime(600);
    await promise;

    expect(appActions.setTangramState).toHaveBeenCalledWith({
      isSilhouetteShown: true,
    });
    expect(appActions.bumpCanvasRedraw).toHaveBeenCalledWith([
      'main',
      'upper',
      'grid',
      'tangram',
    ]);

    vi.useRealTimers();
  });

  it('records timeline-compatible metadata in addStep', () => {
    vi.mocked(fullHistoryState.get).mockReturnValue({
      index: 0,
      actionIndex: 0,
      steps: [],
      isRunning: false,
    });

    FullHistoryManager.addStep('tool-updated', {
      detail: { name: 'create', currentStep: 'drawPoint' },
    });

    expect(appActions.setFullHistoryState).toHaveBeenCalledTimes(1);
    const [arg] = vi.mocked(appActions.setFullHistoryState).mock.calls[0];
    expect(Array.isArray(arg.steps)).toBe(true);
    expect(arg.steps).toHaveLength(1);

    const [recordedStep] = arg.steps;
    expect(recordedStep.type).toBe('tool-updated');
    expect(recordedStep.timelineVersion).toBe(1);
    expect(recordedStep.timelineMeta.schema).toBe('full-history-step');
    expect(recordedStep.timeStamp).toBeTypeOf('number');
    expect(recordedStep.timeDelta).toBe(0);
  });

  it('uses timeDelta for replay delay when available', () => {
    vi.mocked(fullHistoryState.get).mockReturnValue({
      index: 1,
      actionIndex: 0,
      isRunning: true,
      steps: [
        { type: 'tool-updated', detail: {}, timeStamp: 10, timeDelta: 0 },
        { type: 'add-fullstep', detail: {}, timeStamp: 210, timeDelta: 200 },
      ],
    });

    const delay = FullHistoryManager.getReplayDelayAtIndex(1);

    expect(delay).toBe(200);
  });

  it('falls back to timestamp diff when timeDelta is missing', () => {
    vi.mocked(fullHistoryState.get).mockReturnValue({
      index: 1,
      actionIndex: 0,
      isRunning: true,
      steps: [
        { type: 'tool-updated', detail: {}, timeStamp: 10 },
        { type: 'add-fullstep', detail: {}, timeStamp: 260 },
      ],
    });

    const delay = FullHistoryManager.getReplayDelayAtIndex(1);

    expect(delay).toBe(250);
  });

  it('resets replay pointer to zero on moveTo(0)', async () => {
    vi.mocked(fullHistoryState.get).mockReturnValue({
      index: 2,
      actionIndex: 2,
      isRunning: true,
      steps: [
        { type: 'add-fullstep', detail: { actionIndex: 1, data: { settings: {} } } },
        { type: 'add-fullstep', detail: { actionIndex: 2, data: { settings: {} } } },
      ],
    });

    await FullHistoryManager.moveTo(0);

    expect(appActions.setFullHistoryState).toHaveBeenCalledWith({
      actionIndex: 0,
      index: 0,
    });
  });
});
