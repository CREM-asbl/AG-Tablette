import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock de window et des APIs
const mockShowSaveFilePicker = vi.fn();
const mockDispatchEvent = vi.fn();
const mockCustomEvent = vi.fn();

global.window = {
  showSaveFilePicker: mockShowSaveFilePicker,
  dispatchEvent: mockDispatchEvent,
  CustomEvent: mockCustomEvent,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
};

global.document = {
  createElement: vi.fn(() => ({
    href: '',
    download: '',
    target: '_blank',
    click: vi.fn()
  })),
  body: {
    appendChild: vi.fn(),
    removeChild: vi.fn()
  }
};

global.Blob = vi.fn((content, options) => ({
  content,
  options,
  type: options?.type || ''
}));

// Mock des dépendances
vi.mock('@store/gridStore', () => ({
  gridStore: {
    getState: vi.fn(() => ({
      gridType: 'square',
      gridSize: 20,
      gridOpacity: 0.5,
      isVisible: true
    }))
  }
}));

vi.mock('@store/kit', () => ({
  kit: {
    get: vi.fn(() => ({
      families: [
        { name: 'family1', isVisible: true },
        { name: 'family2', isVisible: false }
      ]
    }))
  }
}));

vi.mock('@store/tools', () => ({
  tools: {
    get: vi.fn(() => [
      { name: 'translate', isVisible: true },
      { name: 'create', isVisible: false }
    ])
  }
}));

vi.mock('@controllers/Core/App', () => ({
  setState: vi.fn()
}));

vi.mock('@controllers/Core/Tools/general', () => ({
  createElem: vi.fn(() => ({
    addEventListener: vi.fn(),
    opts: null
  }))
}));

vi.mock('@controllers/Core/Managers/FullHistoryManager', () => ({
  FullHistoryManager: {
    cleanHisto: vi.fn()
  }
}));

// Mock de l'app
const mockApp = {
  version: '2.0.0',
  environment: {
    name: 'Geometrie',
    extensions: ['.ag', '.ags'],
    kit: true
  },
  settings: {
    numberOfDivisionParts: 2,
    shapesDrawColor: '#ff0000',
    shapeOpacity: 0.7
  },
  history: { test: 'history' },
  fullHistory: { test: 'fullHistory' },
  workspace: {
    data: {
      backObjects: { shapesData: [] },
      objects: { shapesData: [], segmentsData: [], pointsData: [] }
    },
    toSVG: vi.fn(() => '<svg></svg>')
  },
  tangram: {
    isSilhouetteShown: false,
    level: 1
  },
  invisibleCanvasLayer: {
    ctx: {
      canvas: { width: 800, height: 600 },
      clearRect: vi.fn(),
      fillStyle: '',
      fillRect: vi.fn(),
      drawImage: vi.fn(),
      toBlob: vi.fn((callback) => callback(new Blob()))
    }
  },
  gridCanvasLayer: { canvas: {} },
  tangramCanvasLayer: null,
  mainCanvasLayer: { canvas: {} }
};

// Importer après les mocks
import { saveFile, initSaveFileEventListener, prepareSaveData, validateAppState } from '@controllers/Core/Managers/SaveFileManager.js';

describe('SaveFileManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockShowSaveFilePicker.mockResolvedValue({
      name: 'test.ag',
      createWritable: vi.fn(() => ({
        truncate: vi.fn(),
        write: vi.fn(),
        close: vi.fn()
      }))
    });
    mockCustomEvent.mockImplementation((type, options) => ({ type, ...options }));
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('validateAppState', () => {
    it('should return true for valid app state', () => {
      const result = validateAppState(mockApp);
      expect(result).toBe(true);
    });

    it('should return false when environment is missing', () => {
      const invalidApp = { ...mockApp, environment: null };
      const result = validateAppState(invalidApp);
      expect(result).toBe(false);
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { message: "Erreur : L'environnement n'est pas prêt." }
        })
      );
    });

    it('should return false when kit is required but not loaded', () => {
      const invalidApp = {
        ...mockApp,
        environment: { ...mockApp.environment, kit: true }
      };

      // Mock kit.get() to return null using import
      import('@store/kit').then(({ kit }) => {
        kit.get.mockReturnValueOnce(null);

        const result = validateAppState(invalidApp);
        expect(result).toBe(false);
        expect(mockDispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            detail: { message: "Erreur : Le kit de formes requis n'est pas chargé." }
          })
        );
      });
    });
  });

  describe('prepareSaveData', () => {
    it('should prepare save data correctly', () => {
      const workspace = { data: mockApp.workspace.data };
      const result = prepareSaveData(mockApp, workspace, {
        saveHistory: true,
        permanentHide: false,
        saveSettings: true
      });

      expect(result).toBeDefined();
      expect(result.appVersion).toBe('2.0.0');
      expect(result.envName).toBe('Geometrie');
      expect(result.workspaceData).toBeDefined();
      expect(result.settings).toBeDefined();
      expect(result.history).toBeDefined();
      expect(result.fullHistory).toBeDefined();
    });

    it('should return null when app state is invalid', () => {
      const invalidApp = { ...mockApp, environment: null };
      const workspace = { data: mockApp.workspace.data };
      const result = prepareSaveData(invalidApp, workspace, {
        saveHistory: false,
        permanentHide: false,
        saveSettings: false
      });

      expect(result).toBeNull();
    });

    it('should handle Tangram environment correctly', () => {
      const tangramApp = {
        ...mockApp,
        environment: { ...mockApp.environment, name: 'Tangram' }
      };
      const workspace = { data: mockApp.workspace.data };
      const result = prepareSaveData(tangramApp, workspace, {
        saveHistory: false,
        permanentHide: false,
        saveSettings: false
      });

      expect(result).toBeDefined();
      expect(result.envName).toBe('Tangram');
    });
  });

  describe('configureSaveOptions', () => {
    it('should configure options for Geometrie environment', () => {
      const geometrieEnv = {
        name: 'Geometrie',
        extensions: ['.agl']
      };
      const options = configureSaveOptions(geometrieEnv, {}, 'test');
      expect(options.types[0].description).toBe('État de l\'application (*.agl)');
      expect(options.types[0].accept).toEqual({ 'application/agmobile': ['.agl'] });
    });

    it('should configure options for Grandeurs environment', () => {
      const grandeursEnv = {
        name: 'Grandeurs',
        extensions: ['.agg']
      };
      const options = configureSaveOptions(grandeursEnv, {}, 'test');
      expect(options.types[0].description).toBe('État de l\'application (*.agg)');
      expect(options.types[0].accept).toEqual({ 'application/agmobile': ['.agg'] });
    });

    it('should configure options for Cubes environment', () => {
      const cubesEnv = {
        name: 'Cubes',
        extensions: ['.agc']
      };
      const options = configureSaveOptions(cubesEnv, {}, 'test');
      expect(options.types[0].description).toBe('État de l\'application (*.agc)');
      expect(options.types[0].accept).toEqual({ 'application/agmobile': ['.agc'] });
    });

    it('should configure options for Tangram environment with silhouette', () => {
      const tangramEnv = {
        name: 'Tangram',
        extensions: ['.agt', '.ags']
      };
      const tangramState = { isSilhouetteShown: false };
      const options = configureSaveOptions(tangramEnv, tangramState, 'test');
      expect(options.types[0].description).toBe('Silhouette (*.ags)');
      expect(options.types[0].accept).toEqual({ 'application/agmobile': ['.ags'] });
    });

    it('should configure options for Tangram environment with state', () => {
      const tangramEnv = {
        name: 'Tangram',
        extensions: ['.agt', '.ags']
      };
      const tangramState = { isSilhouetteShown: true };
      const options = configureSaveOptions(tangramEnv, tangramState, 'test');
      expect(options.types[0].description).toBe('État (*.agt)');
      expect(options.types[0].accept).toEqual({ 'application/agmobile': ['.agt'] });
    });

    it('should always include PNG and SVG options', () => {
      const env = { name: 'Test', extensions: ['.test'] };
      const options = configureSaveOptions(env, {}, 'test');
      expect(options.types).toHaveLength(3); // État + PNG + SVG
      expect(options.types[1].description).toBe('Image matricielle (*.png)');
      expect(options.types[2].description).toBe('Image vectorielle (*.svg)');
    });
  });
});