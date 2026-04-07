import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  toolsMock,
  appMock,
  setStateMock,
  appActionsMock,
  initShapesMock,
  addListenerSpy,
} = vi.hoisted(() => ({
  toolsMock: {
    get: vi.fn(() => [
      { name: 'translate', isDisable: true },
      { name: 'color', isDisable: false },
    ]),
    set: vi.fn(),
  },
  appMock: {
    isUserWarnedAboutOverlap: true,
    workspace: {
      selectionConstraints: null,
      data: { objects: { shapesData: [] } },
    },
    fastSelectionConstraints: {
      mousedown_all_shape: { mode: 'mousedown_all_shape' },
    },
    history: {
      startSituation: null,
    },
    mainCanvasLayer: {
      shapes: [],
    },
  },
  setStateMock: vi.fn(),
  appActionsMock: {
    setTangramState: vi.fn(),
    setHistoryState: vi.fn(),
  },
  initShapesMock: vi.fn(() => Promise.resolve()),
  addListenerSpy: vi.spyOn(window, 'addEventListener'),
}));

vi.mock('../../../src/store/tools', () => ({
  tools: toolsMock,
}));

vi.mock('../../../src/controllers/Core/App', () => ({
  app: appMock,
}));

vi.mock('../../../src/store/appState', () => ({
  appActions: appActionsMock,
}));

vi.mock('../../../src/controllers/Tangram/TangramManager', () => ({
  TangramManager: {
    initShapes: initShapesMock,
  },
}));

vi.mock('../../../src/controllers/Tangram/Silhouette', () => ({
  Silhouette: class Silhouette { },
}));

import { SilhouetteCreatorTool } from '../../../src/controllers/Tangram/SilhouetteCreatorTool';

describe('SilhouetteCreatorTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appMock.isUserWarnedAboutOverlap = true;
    appMock.workspace.selectionConstraints = null;
  });

  it('initialise creation tangram et synchronise currentStep via signaux', async () => {
    const tool = new SilhouetteCreatorTool();

    await tool.connectedCallback();

    expect(initShapesMock).toHaveBeenCalledWith(true);
    expect(appMock.isUserWarnedAboutOverlap).toBe(false);
    expect(appMock.workspace.selectionConstraints).toEqual(
      appMock.fastSelectionConstraints.mousedown_all_shape,
    );
    expect(appActionsMock.setHistoryState).toHaveBeenCalledWith({
      startSituation: expect.any(Object),
    });
    expect(appActionsMock.setTangramState).toHaveBeenCalledWith({ currentStep: 'start' });
    expect(addListenerSpy).toHaveBeenCalledWith('actions-executed', tool.verifyOverlappingShapes);
    expect(addListenerSpy).toHaveBeenCalledWith('create-silhouette', tool.createSilhouette);
  });
});
