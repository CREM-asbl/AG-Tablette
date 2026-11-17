import { app } from '@controllers/Core/App';
import { CreateQuadrilateralTool } from '@controllers/CreateQuadrilateral/CreateQuadrilateralTool';
import { appActions } from '@store/appState';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@controllers/Core/App', () => ({
  app: {
    upperCanvasLayer: {
      removeAllObjects: vi.fn(),
      shapes: [],
    },
    mainCanvasLayer: {
      shapes: [],
    },
    tool: {
      selectedTemplate: { name: 'Square' },
    },
    settings: {
      temporaryDrawColor: '#000',
    },
    addListener: vi.fn(),
    removeListener: vi.fn(),
  },
  setState: vi.fn(),
}));

vi.mock('@store/appState', () => ({
  appActions: {
    setToolState: vi.fn(),
    setCurrentStep: vi.fn(),
    setToolUiState: vi.fn(),
    addNotification: vi.fn(),
  },
  selectedTemplate: {
    get: vi.fn(() => ({ name: 'Square' })),
  },
  currentStep: {
    get: vi.fn(() => 'drawPoint'),
  },
  settings: {
    get: vi.fn(() => ({ temporaryDrawColor: '#000' })),
  },
  activeTool: {
    get: vi.fn(() => 'createQuadrilateral'),
  }
}));

describe('CreateQuadrilateralTool', () => {
  let tool;

  beforeEach(() => {
    vi.clearAllMocks();
    tool = new CreateQuadrilateralTool();
    tool.quadrilateralDef = {
      numberOfPointsRequired: 2,
      constraints: [
        vi.fn(() => ({ isFree: true })),
        vi.fn(() => ({ isFree: true })),
      ],
      finishShape: vi.fn(),
    };
  });

  it('should not crash when pointNumber is out of constraints bounds', () => {
    // Simuler un appel avec pointNumber = 2 (hors limites pour Square)
    expect(() => tool.getConstraints(2)).not.toThrow();
    expect(tool.constraints).toEqual({ isFree: true });
  });

  it('should call constraint function when within bounds', () => {
    tool.getConstraints(1);
    expect(tool.quadrilateralDef.constraints[1]).toHaveBeenCalled();
  });
});
