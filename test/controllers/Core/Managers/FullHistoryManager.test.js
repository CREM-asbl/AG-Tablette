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
  },
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

import { app, setState } from '../../../../src/controllers/Core/App';
import { FullHistoryManager } from '../../../../src/controllers/Core/Managers/FullHistoryManager';
import { appActions } from '../../../../src/store/appState';

describe('FullHistoryManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    app.fullHistory.index = 0;
    app.fullHistory.actionIndex = 0;
    app.fullHistory.numberOfActions = 1;
    app.fullHistory.isRunning = true;
    app.fullHistory.steps = [];
  });

  it('syncs appActions on tool-updated step', () => {
    app.fullHistory.steps = [
      {
        type: 'tool-updated',
        detail: {
          name: 'move',
          currentStep: 'listen',
          selectedTemplate: 'segment',
        },
      },
    ];

    FullHistoryManager.executeStep(0);

    expect(setState).toHaveBeenCalledWith({
      tool: { ...app.fullHistory.steps[0].detail },
    });
    expect(appActions.setActiveTool).toHaveBeenCalledWith('move');
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('listen');
    expect(appActions.setToolState).toHaveBeenCalledWith({
      selectedTemplate: 'segment',
    });
  });

  it('syncs appActions on settings-changed step', () => {
    app.fullHistory.steps = [
      {
        type: 'settings-changed',
        detail: {
          gridShown: true,
          gridSize: 20,
        },
      },
    ];

    FullHistoryManager.executeStep(0);

    expect(setState).toHaveBeenCalledWith({
      settings: { ...app.fullHistory.steps[0].detail },
    });
    expect(appActions.updateSettings).toHaveBeenCalledWith({
      gridShown: true,
      gridSize: 20,
    });
  });

  it('syncs tangram state on add-fullstep with tangram payload', () => {
    vi.useFakeTimers();
    app.fullHistory.steps = [
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

    FullHistoryManager.executeStep(0);
    vi.advanceTimersByTime(600);

    expect(appActions.setTangramState).toHaveBeenCalledWith({
      isSilhouetteShown: true,
    });

    vi.useRealTimers();
  });
});
