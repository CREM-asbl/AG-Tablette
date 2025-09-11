import { beforeEach, describe, expect, it, vi } from 'vitest';

// Fonction validateAppState isolée pour les tests
function validateAppState(state) {
  const errors = [];

  if (!state.gridStore) {
    errors.push('gridStore is missing');
  }

  if (!state.kit) {
    errors.push('kit is missing');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Fonction prepareSaveData isolée pour les tests
function prepareSaveData(state) {
  return {
    gridStore: state.gridStore || {},
    kit: state.kit || {}
  };
}

// Fonction configureSaveOptions isolée pour les tests
function configureSaveOptions(format) {
  const timestamp = Date.now();
  const extensions = {
    json: '.agg',
    png: '.png',
    svg: '.svg'
  };

  const mimeTypes = {
    json: 'application/json',
    png: 'image/png',
    svg: 'image/svg+xml'
  };

  const descriptions = {
    json: 'Fichier de sauvegarde',
    png: 'Image PNG',
    svg: 'Image SVG'
  };

  const ext = extensions[format] || extensions.json;
  const mimeType = mimeTypes[format] || mimeTypes.json;
  const description = descriptions[format] || descriptions.json;

  return {
    suggestedName: `sauvegarde_${timestamp}${ext}`,
    types: [{
      description,
      accept: {
        [mimeType]: [ext]
      }
    }]
  };
}

describe('SaveFileManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateAppState', () => {
    it('should validate a correct app state', () => {
      const validState = {
        gridStore: { gridData: 'test' },
        kit: { kitData: 'test' }
      };

      const result = validateAppState(validState);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing gridStore', () => {
      const invalidState = {
        kit: { kitData: 'test' }
      };

      const result = validateAppState(invalidState);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('gridStore is missing');
    });

    it('should detect missing kit', () => {
      const invalidState = {
        gridStore: { gridData: 'test' }
      };

      const result = validateAppState(invalidState);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('kit is missing');
    });
  });

  describe('prepareSaveData', () => {
    it('should prepare save data correctly', () => {
      const mockState = {
        gridStore: { gridData: 'testGrid' },
        kit: { kitData: 'testKit' }
      };

      const result = prepareSaveData(mockState);

      expect(result).toHaveProperty('gridStore');
      expect(result).toHaveProperty('kit');
      expect(result.gridStore.gridData).toBe('testGrid');
      expect(result.kit.kitData).toBe('testKit');
    });

    it('should handle empty state', () => {
      const emptyState = {};

      const result = prepareSaveData(emptyState);

      expect(result).toHaveProperty('gridStore');
      expect(result).toHaveProperty('kit');
    });
  });

  describe('configureSaveOptions', () => {
    it('should configure save options for JSON format', () => {
      const result = configureSaveOptions('json');

      expect(result).toEqual({
        suggestedName: expect.stringContaining('.agg'),
        types: [{
          description: 'Fichier de sauvegarde',
          accept: {
            'application/json': ['.agg']
          }
        }]
      });
    });

    it('should configure save options for PNG format', () => {
      const result = configureSaveOptions('png');

      expect(result).toEqual({
        suggestedName: expect.stringContaining('.png'),
        types: [{
          description: 'Image PNG',
          accept: {
            'image/png': ['.png']
          }
        }]
      });
    });

    it('should configure save options for SVG format', () => {
      const result = configureSaveOptions('svg');

      expect(result).toEqual({
        suggestedName: expect.stringContaining('.svg'),
        types: [{
          description: 'Image SVG',
          accept: {
            'image/svg+xml': ['.svg']
          }
        }]
      });
    });

    it('should use default extension when format is unknown', () => {
      const result = configureSaveOptions('unknown');

      expect(result).toEqual({
        suggestedName: expect.stringContaining('.agg'),
        types: [{
          description: 'Fichier de sauvegarde',
          accept: {
            'application/json': ['.agg']
          }
        }]
      });
    });

    it('should include timestamp in suggested name', () => {
      const before = Date.now();
      const result = configureSaveOptions('json');
      const after = Date.now();

      const timestamp = parseInt(result.suggestedName.match(/(\d+)/)[0]);
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });
  });
});