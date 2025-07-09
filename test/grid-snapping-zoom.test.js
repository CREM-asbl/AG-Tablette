import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock global app avec une fonction factory
vi.mock('../src/controllers/Core/App', () => {
  return {
    app: {
      settings: {
        gridShown: true
      },
      workspace: {
        zoomLevel: 2.0,
        translateOffset: { x: 0, y: 0 }
      },
      gridCanvasLayer: {
        getClosestGridPoint: vi.fn()
      }
    }
  };
});

import { snapCoordinatesToGrid } from '../src/utils/gridSnapping.js';
import { Coordinates } from '../src/controllers/Core/Objects/Coordinates.js';
import { app } from '../src/controllers/Core/App.js';

describe('Grid Snapping Zoom Fix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    app.settings.gridShown = true;
    app.workspace.zoomLevel = 2.0;
  });

  it('should convert coordinates to canvas space before calling getClosestGridPoint', () => {
    // Point de grille en coordonnées canvas que getClosestGridPoint va retourner
    const gridPointInCanvasSpace = new Coordinates({ x: 100, y: 100 });
    app.gridCanvasLayer.getClosestGridPoint.mockReturnValue(gridPointInCanvasSpace);

    // Coordonnées d'entrée en espace monde
    const worldCoordinates = { x: 50, y: 50 };

    // Appel de la fonction
    snapCoordinatesToGrid(worldCoordinates);

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

    // Coordonnées d'entrée en espace monde
    const worldCoordinates = { x: 50, y: 50 };

    // Appel de la fonction
    const result = snapCoordinatesToGrid(worldCoordinates);

    // Vérification que le résultat a été converti en espace monde
    expect(result.x).toBe(75); // 150 / 2 (zoomLevel)
    expect(result.y).toBe(75); // 150 / 2 (zoomLevel)
  });

  it('should handle zoom level 1 correctly', () => {
    app.workspace.zoomLevel = 1.0;
    
    const gridPointInCanvasSpace = new Coordinates({ x: 60, y: 60 });
    app.gridCanvasLayer.getClosestGridPoint.mockReturnValue(gridPointInCanvasSpace);

    const worldCoordinates = { x: 50, y: 50 };
    const result = snapCoordinatesToGrid(worldCoordinates);

    // Avec zoom 1, les coordonnées devraient être identiques
    expect(app.gridCanvasLayer.getClosestGridPoint).toHaveBeenCalledWith(
      expect.objectContaining({
        x: 50, // Pas de changement avec zoom 1
        y: 50
      })
    );
    
    expect(result.x).toBe(60);
    expect(result.y).toBe(60);
  });

  it('should return original coordinates when grid is not shown', () => {
    app.settings.gridShown = false;
    
    const worldCoordinates = { x: 50, y: 50 };
    const result = snapCoordinatesToGrid(worldCoordinates);

    // Ne devrait pas appeler getClosestGridPoint
    expect(app.gridCanvasLayer.getClosestGridPoint).not.toHaveBeenCalled();
    
    // Devrait retourner les coordonnées originales
    expect(result.x).toBe(50);
    expect(result.y).toBe(50);
  });

  it('should handle high zoom levels correctly', () => {
    app.workspace.zoomLevel = 0.5; // Zoom out (dézoom)
    
    const gridPointInCanvasSpace = new Coordinates({ x: 30, y: 30 });
    app.gridCanvasLayer.getClosestGridPoint.mockReturnValue(gridPointInCanvasSpace);

    const worldCoordinates = { x: 50, y: 50 };
    const result = snapCoordinatesToGrid(worldCoordinates);

    // Vérification de la conversion avec un zoom < 1
    expect(app.gridCanvasLayer.getClosestGridPoint).toHaveBeenCalledWith(
      expect.objectContaining({
        x: 25, // 50 * 0.5 (zoomLevel)
        y: 25
      })
    );
    
    expect(result.x).toBe(60); // 30 / 0.5
    expect(result.y).toBe(60); // 30 / 0.5
  });
});
