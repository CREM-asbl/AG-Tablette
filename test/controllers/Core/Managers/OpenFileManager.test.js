import { describe, expect, it, vi } from 'vitest';

// Mocks des dépendances
vi.mock('@controllers/Core/App', () => ({
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
      history: {},
      settings: {}
    },
    settings: {},
    resetSettings: vi.fn()
  },
  setState: vi.fn()
}));

vi.mock('@store/gridStore.js', () => ({
  gridStore: {
    setGridType: vi.fn(),
    setGridSize: vi.fn(),
    setGridOpacity: vi.fn(),
    setIsVisible: vi.fn()
  }
}));

vi.mock('@store/kit.js', () => ({
  setFamiliesVisibility: vi.fn()
}));

vi.mock('@store/tools.js', () => ({
  setToolsVisibility: vi.fn()
}));

vi.mock('@controllers/Core/Tools/general.js', () => {
  const layerOrder = ['upper', 'main', 'tangram', 'grid', 'background', 'invisible'];
  const objectTypeOrder = ['shape', 'segment', 'point'];

  return {
    createElem: vi.fn(),
    getExtension: vi.fn((filename) => filename ? filename.split('.').pop() : ''),
    addInfoToId: vi.fn((id, layer, objectType = undefined) => {
      if (!id) return;
      let objectTypeId = id[9];
      if (id.length == 10)
        id = id.substring(0, 8)
      else
        id = id.substring(id.length - 8, id.length);
      const layerId = layerOrder.indexOf(layer);
      if (objectType) {
        objectTypeId = objectTypeOrder.indexOf(objectType);
      }
      const result = id + layerId + objectTypeId;
      return result;
    })
  };
});

vi.mock('@controllers/Core/Tools/version-migration.js', () => ({
  applyMigrations: vi.fn()
}));

vi.mock('@controllers/Core/Managers/WorkspaceManager.js', () => ({
  setWorkspaceFromObject: vi.fn()
}));

// Mock de window et des APIs
const mockShowOpenFilePicker = vi.fn();
const mockDispatchEvent = vi.fn();

global.window = {
  showOpenFilePicker: mockShowOpenFilePicker,
  dispatchEvent: mockDispatchEvent,
  CustomEvent: vi.fn((type, options) => ({ type, ...options })),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
};

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
    history: {},
    settings: {}
  },
  settings: {},
  resetSettings: vi.fn()
};

global.hasNativeFS = true;

// Importer après les mocks
import { OpenFileManager } from '@controllers/Core/Managers/OpenFileManager.js';

describe('OpenFileManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockShowOpenFilePicker.mockResolvedValue([{ getFile: vi.fn(() => ({ text: vi.fn(() => '{}') })) }]);
  });

  describe('validateFileContent', () => {
    it('should reject unsupported version', () => {
      const result = OpenFileManager.validateFileContent({
        appVersion: '1.0.0',
        envName: 'Geometrie'
      }, { name: 'Geometrie' });
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Version non supportée');
    });

    it('should accept valid file', () => {
      const result = OpenFileManager.validateFileContent({
        appVersion: '2.0.0',
        envName: 'Geometrie',
        workspaceData: {}
      }, { name: 'Geometrie' });
      expect(result.isValid).toBe(true);
      expect(result.error).toBe(null);
    });
  });

  describe('parseJsonContent', () => {
    it('should parse valid JSON string', () => {
      const jsonString = '{"appVersion": "2.0.0", "envName": "Geometrie"}';
      const result = OpenFileManager.parseJsonContent(jsonString);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ appVersion: '2.0.0', envName: 'Geometrie' });
      expect(result.error).toBe(null);
    });

    it('should return object if already parsed', () => {
      const obj = { appVersion: '2.0.0', envName: 'Geometrie' };
      const result = OpenFileManager.parseJsonContent(obj);
      expect(result.success).toBe(true);
      expect(result.data).toBe(obj);
      expect(result.error).toBe(null);
    });

    it('should handle empty string', () => {
      const result = OpenFileManager.parseJsonContent('');
      expect(result.success).toBe(false);
      expect(result.data).toBe(null);
      expect(result.error).toBe('contenu vide');
    });

    it('should handle invalid JSON', () => {
      const invalidJson = '{"appVersion": "2.0.0", invalid}';
      const result = OpenFileManager.parseJsonContent(invalidJson);
      expect(result.success).toBe(false);
      expect(result.data).toBe(null);
      expect(result.error).toBe('JSON invalide');
    });
  });

  describe('updateGeometryReference', () => {
    it('should update geometry object references', () => {
      const geometryObject = {
        geometryChildShapeIds: ['shape1', 'shape2'],
        geometryTransformationChildShapeIds: ['shape3'],
        geometryParentObjectId1: 'shape1',
        geometryDuplicateParentShapeId: 'shape2'
      };

      const result = OpenFileManager.updateGeometryReference(geometryObject, 'shape1', 'shape110');

      expect(result.geometryChildShapeIds).toEqual(['shape110', 'shape2']);
      expect(result.geometryTransformationChildShapeIds).toEqual(['shape3']);
      expect(result.geometryParentObjectId1).toBe('shape110');
      expect(result.geometryDuplicateParentShapeId).toBe('shape2');
    });

    it('should return original object if no geometry object provided', () => {
      const result = OpenFileManager.updateGeometryReference(null, 'shape1', 'shape110');
      expect(result).toBe(null);
    });
  });

  describe('updateReferences', () => {
    it('should update shape references in segments and points', () => {
      const objects = {
        shapesData: [{ id: 'shape1', segmentIds: [], pointIds: [] }],
        segmentsData: [
          { id: 'segment1', shapeId: 'shape1', vertexIds: [] },
          { id: 'segment2', shapeId: 'shape2', vertexIds: [] }
        ],
        pointsData: [
          { id: 'point1', shapeId: 'shape1', segmentIds: [] },
          { id: 'point2', shapeId: 'shape2', segmentIds: [] }
        ]
      };

      const result = OpenFileManager.updateReferences(objects, 'shape1', 'shape110', 'shape');

      expect(result.segmentsData[0].shapeId).toBe('shape110');
      expect(result.segmentsData[1].shapeId).toBe('shape2');
      expect(result.pointsData[0].shapeId).toBe('shape110');
      expect(result.pointsData[1].shapeId).toBe('shape2');
    });

    it('should update segment references in shapes and points', () => {
      const objects = {
        shapesData: [
          { id: 'shape1', segmentIds: ['segment1', 'segment2'], pointIds: [] }
        ],
        segmentsData: [{ id: 'segment1', shapeId: 'shape1', vertexIds: [] }],
        pointsData: [
          { id: 'point1', shapeId: 'shape1', segmentIds: ['segment1'] }
        ]
      };

      const result = OpenFileManager.updateReferences(objects, 'segment1', 'segment111', 'segment');

      expect(result.shapesData[0].segmentIds).toEqual(['segment111', 'segment2']);
      expect(result.pointsData[0].segmentIds).toEqual(['segment111']);
    });
  });

  describe('transformIds', () => {
    it('should transform IDs and update references', () => {
      const objects = {
        shapesData: [{ id: 'shape1', segmentIds: ['segment1'], pointIds: ['point1'] }],
        segmentsData: [{ id: 'segment1', shapeId: 'shape1', vertexIds: ['point1'] }],
        pointsData: [{ id: 'point1', shapeId: 'shape1', segmentIds: ['segment1'] }]
      };

      const result = OpenFileManager.transformIds(objects.shapesData, objects, 'main', 'shape');

      expect(result.shapesData[0].id).toBe('shape110');
      expect(result.segmentsData[0].shapeId).toBe('shape110');
      expect(result.pointsData[0].shapeId).toBe('shape110');
    });
  });
});