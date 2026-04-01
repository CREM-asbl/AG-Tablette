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
        numberOfActions: 1
    });

    const promise = FullHistoryManager.executeStep(0);
    vi.advanceTimersByTime(600);
    await promise;

    expect(appActions.setTangramState).toHaveBeenCalledWith({
      isSilhouetteShown: true,
    });

    vi.useRealTimers();
  });
});
