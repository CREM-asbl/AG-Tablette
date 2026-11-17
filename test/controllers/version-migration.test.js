import { describe, it, expect } from 'vitest';
import { 
  compareVersions, 
  scalePathString, 
  migrateShapeScale, 
  needsScaleMigration, 
  applyMigrations 
} from '../../src/controllers/Core/Tools/version-migration.js';

describe('Version Migration', () => {
  describe('compareVersions', () => {
    it('should compare versions correctly', () => {
      expect(compareVersions('1.4.8', '1.4.9')).toBe(-1); // 1.4.8 < 1.4.9
      expect(compareVersions('1.4.9', '1.4.9')).toBe(0);   // 1.4.9 = 1.4.9
      expect(compareVersions('1.5.0', '1.4.9')).toBe(1);   // 1.5.0 > 1.4.9
      expect(compareVersions('1.4.6 beta 1', '1.4.9')).toBe(-1); // 1.4.6 < 1.4.9
      expect(compareVersions('1.4.9', '1.5.0')).toBe(-1); // 1.4.9 < 1.5.0
    });
  });

  describe('scalePathString', () => {
    it('should scale SVG path coordinates', () => {
      const originalPath = "L 32.729729724572 18.8975 L 65.459459449144 0 V -37.795";
      const scaleFactor = 0.756; // 37.8/50
      const scaledPath = scalePathString(originalPath, scaleFactor);
      
      // Vérifier que les nombres ont été modifiés (avec une tolérance pour les décimales)
      expect(scaledPath).toContain('24.743'); // 32.729729724572 * 0.756 ≈ 24.743
      expect(scaledPath).toContain('14.286'); // 18.8975 * 0.756 ≈ 14.286
    });

    it('should handle empty or invalid paths', () => {
      expect(scalePathString('', 0.756)).toBe('');
      expect(scalePathString(null, 0.756)).toBe(null);
      expect(scalePathString(undefined, 0.756)).toBe(undefined);
    });
  });

  describe('needsScaleMigration', () => {
    it('should identify files that need migration', () => {
      const oldGrandeursFile = {
        appVersion: '1.4.6 beta 1',
        envName: 'Grandeurs'
      };
      expect(needsScaleMigration(oldGrandeursFile)).toBe(true);

      const oldCubesFile = {
        appVersion: '1.4.9',
        envName: 'Cubes'
      };
      expect(needsScaleMigration(oldCubesFile)).toBe(true);

      const newFile = {
        appVersion: '1.5.0',
        envName: 'Grandeurs'
      };
      expect(needsScaleMigration(newFile)).toBe(false);

      const otherEnvFile = {
        appVersion: '1.4.0',
        envName: 'Tangram'
      };
      expect(needsScaleMigration(otherEnvFile)).toBe(false);
    });
  });

  describe('migrateShapeScale', () => {
    it('should scale workspace data correctly', () => {
      const workspaceData = {
        objects: {
          shapesData: [{
            id: 'shape1',
            path: "M 0 0 L 50 0 L 50 -50 L 0 -50 Z",
            coordinates: { x: 100, y: 200 }
          }],
          pointsData: [{
            id: 'point1',
            coordinates: { x: 150, y: 250 }
          }]
        },
        zoomLevel: 1,
        offset: { x: 50, y: 100 }
      };

      const scaleFactor = 0.756;
      migrateShapeScale(workspaceData, scaleFactor);

      // Vérifier que les coordonnées ont été mises à l'échelle
      expect(workspaceData.objects.shapesData[0].coordinates.x).toBe(75.6); // 100 * 0.756
      expect(workspaceData.objects.shapesData[0].coordinates.y).toBe(151.2); // 200 * 0.756
      expect(workspaceData.objects.pointsData[0].coordinates.x).toBe(113.4); // 150 * 0.756
      expect(workspaceData.objects.pointsData[0].coordinates.y).toBe(189); // 250 * 0.756

      // Vérifier que le zoom a été ajusté
      expect(workspaceData.zoomLevel).toBeCloseTo(1.323, 3); // 1 / 0.756

      // Vérifier que l'offset a été mis à l'échelle
      expect(workspaceData.offset.x).toBe(37.8); // 50 * 0.756
      expect(workspaceData.offset.y).toBe(75.6); // 100 * 0.756
    });
  });

  describe('applyMigrations', () => {
    it('should apply migration to eligible files', () => {
      const saveObject = {
        appVersion: '1.4.6 beta 1',
        envName: 'Cubes',
        workspaceData: {
          objects: {
            shapesData: [{
              path: "L 50 0 L 100 -50 Z",
              coordinates: { x: 100, y: 100 }
            }]
          },
          zoomLevel: 1
        }
      };

      applyMigrations(saveObject);

      // Vérifier que la migration a été appliquée
      const shape = saveObject.workspaceData.objects.shapesData[0];
      expect(shape.coordinates.x).toBe(75.6); // 100 * 0.756
      expect(shape.coordinates.y).toBe(75.6); // 100 * 0.756
      expect(saveObject.workspaceData.zoomLevel).toBeCloseTo(1.323, 3); // 1 / 0.756
    });

    it('should not modify files that do not need migration', () => {
      const saveObject = {
        appVersion: '1.5.0',
        envName: 'Grandeurs',
        workspaceData: {
          objects: {
            shapesData: [{
              path: "L 50 0 L 100 -50 Z",
              coordinates: { x: 100, y: 100 }
            }]
          },
          zoomLevel: 1
        }
      };

      const originalPath = saveObject.workspaceData.objects.shapesData[0].path;
      const originalCoords = { ...saveObject.workspaceData.objects.shapesData[0].coordinates };
      const originalZoom = saveObject.workspaceData.zoomLevel;

      applyMigrations(saveObject);

      // Vérifier que rien n'a été modifié car version 1.5.0 >= 1.5
      expect(saveObject.workspaceData.objects.shapesData[0].path).toBe(originalPath);
      expect(saveObject.workspaceData.objects.shapesData[0].coordinates).toEqual(originalCoords);
      expect(saveObject.workspaceData.zoomLevel).toBe(originalZoom);
    });
  });
});
