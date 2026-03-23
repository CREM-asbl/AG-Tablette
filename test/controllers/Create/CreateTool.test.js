import { app, setState } from '@controllers/Core/App';
import { CreateTool } from '@controllers/Create/CreateTool';
import { appActions } from '@store/appState';
import { getFamily } from '@store/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@lit-labs/signals', () => ({
  computed: vi.fn((cb) => ({ get: cb })),
  signal: vi.fn((val) => ({ get: () => val, set: vi.fn() })),
}));

vi.mock('@controllers/Core/App', () => {
  const setState = vi.fn();
  const app = {
    tool: {
      name: 'create',
      currentStep: 'listen',
      selectedFamily: 'Polygones',
      selectedTemplate: null,
    },
    settings: {
      shapesSize: 2,
    },
    workspace: {
      lastKnownMouseCoordinates: { x: 10, y: 20 },
    },
    upperCanvasLayer: {
      removeAllObjects: vi.fn(),
    },
    addListener: vi.fn(() => 'listener-id'),
    removeListener: vi.fn(),
    nextListenerId: 1,
  };
  return { app, setState };
});

vi.mock('@store/appState', () => ({
  appActions: {
    setActiveTool: vi.fn(),
    setToolState: vi.fn(),
    setCurrentStep: vi.fn(),
    setSelectedTemplate: vi.fn(),
    setToolUiState: vi.fn(),
  },
}));

vi.mock('@store/kit', () => ({
  getFamily: vi.fn(() => ({
    shapeTemplates: [{ name: 'Carre' }],
  })),
}));

vi.mock('@controllers/Core/Objects/Coordinates', () => ({
  Coordinates: {
    nullCoordinates: { x: 0, y: 0 },
  },
}));

vi.mock('@controllers/Core/Objects/Shapes/RegularShape', () => ({
  RegularShape: class {
    constructor() {
      this.size = 1;
      this.isCenterShown = false;
    }

    scale = vi.fn();

    isCircle() {
      return false;
    }

    translate = vi.fn();
  },
}));

vi.mock('@controllers/Core/Objects/Shapes/LineShape', () => ({
  LineShape: class {
    constructor() {
      this.size = 1;
      this.isCenterShown = false;
    }

    scale = vi.fn();

    isCircle() {
      return false;
    }

    translate = vi.fn();
  },
}));

describe('CreateTool', () => {
  let tool;

  beforeEach(() => {
    vi.clearAllMocks();
    app.tool = {
      name: 'create',
      currentStep: 'listen',
      selectedFamily: 'Polygones',
      selectedTemplate: null,
    };
    tool = new CreateTool();
    tool.animate = vi.fn();
  });

  it('réinitialise vers start via appActions si un autre outil est actif', () => {
    app.tool.name = 'move';

    tool.openShapeList();

    expect(appActions.setActiveTool).toHaveBeenCalledWith('create');
    expect(appActions.setToolState).toHaveBeenCalledWith({});
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('start');
  });

  it('passe en listen avec selectedTemplate quand une seule forme est disponible', () => {
    getFamily.mockReturnValueOnce({
      shapeTemplates: [{ name: 'Triangle' }],
    });

    tool.openShapeList();

    expect(appActions.setSelectedTemplate).toHaveBeenCalledWith({ name: 'Triangle' });
    expect(appActions.setActiveTool).toHaveBeenCalledWith('create');
    expect(appActions.setToolState).toHaveBeenCalledWith({ selectedTemplate: { name: 'Triangle' } });
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('listen');
  });

  it('passe en move via appActions au mouse down', () => {
    app.tool.currentStep = 'listen';
    app.tool.selectedTemplate = { name: 'Carre' };

    tool.canvasMouseDown();

    expect(appActions.setActiveTool).toHaveBeenCalledWith('create');
    expect(appActions.setToolState).toHaveBeenCalledWith({});
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('move');
    expect(tool.animate).toHaveBeenCalled();
  });
});
