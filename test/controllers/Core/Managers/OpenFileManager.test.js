import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mocks des dépendances
vi.doMock('@controllers/Core/App', () => ({
  app: {
    environment: {
      name: 'Geometrie',
      extensions: ['.ag', '.ags']
    },
    mainCanvasLayer: {
      removeAllObjects: vi.fn()
    },
    defaultState: {
      fullHistory: {},
      history: {}
    }
  },
  setState: vi.fn()
}));

vi.doMock('@store/gridStore', () => ({
  gridStore: {
    setGridType: vi.fn(),
    setGridSize: vi.fn(),
    setGridOpacity: vi.fn(),
    setIsVisible: vi.fn()
  }
}));

vi.doMock('@store/kit', () => ({
  setFamiliesVisibility: vi.fn()
}));

vi.doMock('@store/tools', () => ({
  setToolsVisibility: vi.fn()
}));

vi.doMock('@controllers/Core/Tools/general', () => ({
  createElem: vi.fn(),
  getExtension: vi.fn((filename) => filename ? filename.split('.').pop() : ''),
  addInfoToId: vi.fn((id, layer, type) => `${layer}_${type}_${id}`)
}));

vi.doMock('@controllers/Core/Tools/version-migration', () => ({
  applyMigrations: vi.fn()
}));

// Mock de WorkspaceManager
vi.doMock('./WorkspaceManager.js', () => ({
  setWorkspaceFromObject: vi.fn()
}));

// Mock de window et des APIs
const mockShowOpenFilePicker = vi.fn();
const mockDispatchEvent = vi.fn();
const mockCustomEvent = vi.fn();

global.window = {
  showOpenFilePicker: mockShowOpenFilePicker,
  dispatchEvent: mockDispatchEvent,
  CustomEvent: mockCustomEvent,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
};

// Mock de l'app global
global.app = {
  environment: {
    name: 'Geometrie',
    extensions: ['.ag', '.ags']
  },
  mainCanvasLayer: {
    removeAllObjects: vi.fn()
  },
  defaultState: {
    fullHistory: {},
    history: {}
  }
};

// Importer après les mocks
import { OpenFileManager } from '@controllers/Core/Managers/OpenFileManager.js';

describe('OpenFileManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset des mocks
    mockShowOpenFilePicker.mockResolvedValue([{ getFile: vi.fn(() => ({ text: vi.fn(() => '{}') })) }]);
    mockCustomEvent.mockImplementation((type, options) => ({ type, ...options }));
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('openFile', () => {
    it('should use native file picker when available', async () => {
      await OpenFileManager.openFile();
      expect(mockShowOpenFilePicker).toHaveBeenCalled();
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'file-opened',
          detail: { method: 'new', file: expect.any(Array) }
        })
      );
    });

    it('should fallback to old method when native not available', async () => {
      delete global.window.showOpenFilePicker;
      await OpenFileManager.openFile();
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'show-file-selector'
        })
      );
    });
  });

  describe('newReadFile', () => {
    it('should parse valid JSON file', async () => {
      const mockFileHandle = {
        getFile: vi.fn(() => ({
          text: vi.fn(() => JSON.stringify({
            appVersion: '2.0.0',
            envName: 'Geometrie',
            workspaceData: { objects: { shapesData: [], segmentsData: [], pointsData: [] } }
          }))
        }))
      };

      await OpenFileManager.newReadFile(mockFileHandle);
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'file-parsed'
        })
      );
    });

    it('should handle file read error', async () => {
      const mockFileHandle = {
        getFile: vi.fn(() => {
          throw new Error('Read error');
        })
      };

      await OpenFileManager.newReadFile(mockFileHandle);
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'show-notif',
          detail: { message: expect.stringContaining('Erreur lors de la lecture') }
        })
      );
    });
  });

  describe('oldReadFile', () => {
    it('should parse file from FileReader', () => {
      const mockFile = { name: 'test.ag' };
      const mockReader = {
        onload: null,
        onerror: null,
        readAsText: vi.fn(() => {
          mockReader.onload({
            target: {
              result: JSON.stringify({
                appVersion: '2.0.0',
                envName: 'Geometrie',
                workspaceData: { objects: { shapesData: [], segmentsData: [], pointsData: [] } }
              })
            }
          });
        })
      };

      global.FileReader = vi.fn(() => mockReader);

      OpenFileManager.oldReadFile(mockFile);
      expect(mockReader.readAsText).toHaveBeenCalledWith(mockFile);
    });
  });

  describe('validateFileContent', () => {
    it('should reject unsupported version', () => {
      const result = OpenFileManager.validateFileContent({
        appVersion: '1.0.0',
        envName: 'Geometrie'
      });
      expect(result).toBe(false);
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'show-notif',
          detail: { message: expect.stringContaining('n\'est plus prise en charge') }
        })
      );
    });

    it('should reject wrong environment', () => {
      const result = OpenFileManager.validateFileContent({
        appVersion: '2.0.0',
        envName: 'WrongEnv'
      });
      expect(result).toBe(false);
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'show-notif',
          detail: { message: expect.stringContaining('Impossible d\'ouvrir ce fichier') }
        })
      );
    });

    it('should accept valid file', () => {
      const result = OpenFileManager.validateFileContent({
        appVersion: '2.0.0',
        envName: 'Geometrie'
      });
      expect(result).toBe(true);
    });
  });

  describe('transformToNewIdSystem', () => {
    it('should transform shape IDs', () => {
      const objects = {
        shapesData: [{ id: 'shape1', segmentIds: [], pointIds: [] }],
        segmentsData: [],
        pointsData: []
      };

      OpenFileManager.transformToNewIdSystem(objects, 'layer1');
      expect(objects.shapesData[0].id).toBe('layer1_shape_shape1');
    });

    it('should transform segment IDs', () => {
      const objects = {
        shapesData: [{ segmentIds: ['seg1'] }],
        segmentsData: [{ id: 'seg1', vertexIds: [] }],
        pointsData: []
      };

      OpenFileManager.transformToNewIdSystem(objects, 'layer1');
      expect(objects.segmentsData[0].id).toBe('layer1_segment_seg1');
      expect(objects.shapesData[0].segmentIds[0]).toBe('layer1_segment_seg1');
    });

    it('should transform point IDs', () => {
      const objects = {
        shapesData: [{ pointIds: ['point1'] }],
        segmentsData: [{ vertexIds: ['point1'] }],
        pointsData: [{ id: 'point1' }]
      };

      OpenFileManager.transformToNewIdSystem(objects, 'layer1');
      expect(objects.pointsData[0].id).toBe('layer1_point_point1');
      expect(objects.shapesData[0].pointIds[0]).toBe('layer1_point_point1');
      expect(objects.segmentsData[0].vertexIds[0]).toBe('layer1_point_point1');
    });
  });

  describe('parseFile', () => {
    it('should handle empty file content', async () => {
      await OpenFileManager.parseFile('', 'test.ag');
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'show-notif',
          detail: { message: expect.stringContaining('fichier vide') }
        })
      );
    });

    it('should handle invalid JSON', async () => {
      await OpenFileManager.parseFile('invalid json', 'test.ag');
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'show-notif',
          detail: { message: expect.stringContaining('Impossible d\'ouvrir ce fichier') }
        })
      );
    });
  });
});