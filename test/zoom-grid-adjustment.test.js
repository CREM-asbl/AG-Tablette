import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock global app avec une fonction factory
vi.mock('../src/controllers/Core/App', () => {
  return {
    app: {
      tool: {
        selectedTemplate: { name: 'Point' }
      },
      environment: {
        name: 'Geometrie'
      },
      workspace: {
        zoomLevel: 2.0,
        translateOffset: { x: 0, y: 0 }
      },
      gridCanvasLayer: {
        getClosestGridPoint: vi.fn()
      }
    },
    setState: vi.fn()
  };
});

// Mock autres dépendances
vi.mock('../src/controllers/Core/Managers/SelectManager', () => ({
  SelectManager: {}
}));

vi.mock('@controllers/Core/ShapesKits/points.json', () => ({
  default: []
}));

import { CreatePointTool } from '../src/controllers/CreatePoint/CreatePointTool.js';
import { Coordinates } from '../src/controllers/Core/Objects/Coordinates.js';
import { Point } from '../src/controllers/Core/Objects/Point.js';
import { app } from '../src/controllers/Core/App.js';

describe('Zoom Grid Adjustment Fix', () => {
  let createPointTool;
  let testPoint;

  beforeEach(() => {
    vi.clearAllMocks();
    createPointTool = new CreatePointTool();
    
    // Point de test simplifié avec juste les propriétés nécessaires
    testPoint = {
      coordinates: new Coordinates({ x: 50, y: 50 }),
      adjustedOn: undefined
    };
  });

  it('should convert coordinates to canvas space before calling getClosestGridPoint', () => {
    // Configuration du mock pour retourner un point de grille en coordonnées canvas
    const gridPointInCanvasSpace = new Coordinates({ x: 100, y: 100 });
    app.gridCanvasLayer.getClosestGridPoint.mockReturnValue(gridPointInCanvasSpace);

    // Appel de la méthode ajustPoint
    createPointTool.adjustPoint(testPoint);

    // Vérification que getClosestGridPoint a été appelé avec les coordonnées converties en canvas
    expect(app.gridCanvasLayer.getClosestGridPoint).toHaveBeenCalledWith(
      expect.objectContaining({
        x: 100, // 50 * 2 (zoomLevel)
        y: 100  // 50 * 2 (zoomLevel)
      })
    );
  });

  it('should convert grid point result back to world coordinates', () => {
    // Point de grille en coordonnées canvas
    const gridPointInCanvasSpace = new Coordinates({ x: 150, y: 150 });
    app.gridCanvasLayer.getClosestGridPoint.mockReturnValue(gridPointInCanvasSpace);

    // Appel de la méthode ajustPoint
    createPointTool.adjustPoint(testPoint);

    // Vérification que les coordonnées du point ont été mises à jour avec la conversion inverse
    expect(testPoint.coordinates.x).toBe(75); // 150 / 2 (zoomLevel)
    expect(testPoint.coordinates.y).toBe(75); // 150 / 2 (zoomLevel)
  });

  it('should handle zoom level 1 correctly (no zoom)', () => {
    app.workspace.zoomLevel = 1.0;
    
    const gridPointInCanvasSpace = new Coordinates({ x: 60, y: 60 });
    app.gridCanvasLayer.getClosestGridPoint.mockReturnValue(gridPointInCanvasSpace);

    createPointTool.adjustPoint(testPoint);

    // Avec zoom 1, les coordonnées devraient rester identiques
    expect(app.gridCanvasLayer.getClosestGridPoint).toHaveBeenCalledWith(
      expect.objectContaining({
        x: 50, // Pas de changement
        y: 50  // Pas de changement
      })
    );
    
    expect(testPoint.coordinates.x).toBe(60);
    expect(testPoint.coordinates.y).toBe(60);
  });

  it('should handle high zoom levels correctly', () => {
    app.workspace.zoomLevel = 0.5; // Zoom out (dézoom)
    
    const gridPointInCanvasSpace = new Coordinates({ x: 30, y: 30 });
    app.gridCanvasLayer.getClosestGridPoint.mockReturnValue(gridPointInCanvasSpace);

    createPointTool.adjustPoint(testPoint);

    // Vérification de la conversion avec un zoom < 1
    expect(app.gridCanvasLayer.getClosestGridPoint).toHaveBeenCalledWith(
      expect.objectContaining({
        x: 25, // 50 * 0.5 (zoomLevel)
        y: 25  // 50 * 0.5 (zoomLevel)
      })
    );
    
    expect(testPoint.coordinates.x).toBe(60); // 30 / 0.5
    expect(testPoint.coordinates.y).toBe(60); // 30 / 0.5
  });
});
