import { app, setState } from '../../../src/controllers/Core/App';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// S'assurer que le module n'est pas mocké par d'autres tests
vi.unmock('../../../src/controllers/Core/App');

const { mockAppActions } = vi.hoisted(() => ({
  mockAppActions: {
    setActiveTool: vi.fn(),
    setCurrentStep: vi.fn(),
    setToolState: vi.fn(),
    setSelectedTemplate: vi.fn(),
    updateSettings: vi.fn(),
    setHistoryState: vi.fn(),
    setFullHistoryState: vi.fn(),
    setTangramState: vi.fn(),
    setFilename: vi.fn(),
    setLoading: vi.fn(),
    setStarted: vi.fn(),
    setStepSinceSave: vi.fn(),
  }
}));

// Mock minimal pour les dépendances
vi.mock('../../../src/store/appState', () => ({
  activeTool: { get: vi.fn(() => null) },
  currentStep: { get: vi.fn(() => null) },
  selectedTemplate: { get: vi.fn(() => null) },
  toolState: { get: vi.fn(() => ({})) },
  createWatcher: vi.fn(() => vi.fn()),
  settings: { get: vi.fn(() => ({ magnetismDistance: 20 })) },
  tangramState: { get: vi.fn(() => ({})) },
  historyState: { get: vi.fn(() => ({ index: -1 })) },
  fullHistoryState: { get: vi.fn(() => ({ steps: [] })) },
  stepSinceSave: { get: vi.fn(() => false) },
  filename: { get: vi.fn(() => '') },
  workspaceData: { get: vi.fn(() => ({})) },
  nextGroupColorIdx: { get: vi.fn(() => 0) },
  bugs: { get: vi.fn(() => []) },
  appActions: mockAppActions,
}));

vi.mock('../../../src/store/tools', () => ({
  tools: {
    get: vi.fn(() => [{ name: 'move', title: 'Déplacer', type: 'move' }]),
  },
  resetToolsVisibility: vi.fn(),
}));

vi.mock('../../../src/store/kit', () => ({
  resetKitVisibility: vi.fn(),
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with default values', () => {
    expect(app.settings.magnetismDistance).toBe(20);
    expect(app.started).toBe(false);
    expect(app.history.index).toBe(-1);
  });

  it('setState updates properties and dispatches events', () => {
    const spy = vi.fn();
    window.addEventListener('state-changed', spy);

    setState({ started: true });

    expect(app.started).toBe(true);
    expect(spy).toHaveBeenCalled();
    expect(mockAppActions.setStarted).toHaveBeenCalledWith(true);
  });

  it('setState updates tool info from tools store', () => {
    setState({ tool: { name: 'move', currentStep: 'start' } });

    expect(app.tool.name).toBe('move');
    expect(app.tool.title).toBe('Déplacer');
    
    expect(mockAppActions.setActiveTool).toHaveBeenCalledWith('move');
    expect(mockAppActions.setCurrentStep).toHaveBeenCalledWith('start');
  });

  it('resetSettings calls reset functions', async () => {
    const { resetToolsVisibility } = await import('../../../src/store/tools');
    const { resetKitVisibility } = await import('../../../src/store/kit');

    app.resetSettings();

    expect(resetToolsVisibility).toHaveBeenCalled();
    expect(resetKitVisibility).toHaveBeenCalled();
  });
});
