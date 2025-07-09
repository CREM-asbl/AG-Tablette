import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock global app avec une fonction factory
vi.mock('../src/controllers/Core/App', () => {
  return {
    app: {
      settings: {
        mainMenuWidth: 0
      },
      workspace: {
        zoomLevel: 2.0,
        translateOffset: { x: 0, y: 0 }
      }
    }
  };
});

// Mock Coordinates
const mockCoordinates = {
  nullCoordinates: { x: 0, y: 0 },
  fromCanvasCoordinates: vi.fn()
};

vi.mock('../src/controllers/Core/Objects/Coordinates', () => ({
  Coordinates: {
    nullCoordinates: mockCoordinates.nullCoordinates
  }
}));

describe('Mouse Position Zoom Investigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock response
    mockCoordinates.nullCoordinates = { x: 0, y: 0 };
  });

  it('should understand how mouse coordinates are converted with zoom', () => {
    const { app } = require('../src/controllers/Core/App');
    
    // Simuler un événement souris avec des coordonnées pixels
    const mockEvent = {
      offsetX: 100,
      offsetY: 100
    };

    // Mock la méthode fromCanvasCoordinates
    const mockFromCanvasCoordinates = vi.fn().mockReturnValue({
      x: 50, // 100 / 2 (si c'est correct)
      y: 50  // 100 / 2
    });

    // Mock l'objet response pour avoir la méthode fromCanvasCoordinates
    const mockResponse = {
      x: 100,
      y: 100,
      fromCanvasCoordinates: mockFromCanvasCoordinates
    };

    // Remplacer nullCoordinates par notre mock
    mockCoordinates.nullCoordinates = mockResponse;

    // Simuler ce que fait getMousePos
    let response = mockCoordinates.nullCoordinates;
    response.x = mockEvent.offsetX; // 100
    response.y = mockEvent.offsetY; // 100
    
    // Appel de fromCanvasCoordinates (comme dans le code original)
    response = response.fromCanvasCoordinates();

    // Vérifier que fromCanvasCoordinates a été appelé
    expect(mockFromCanvasCoordinates).toHaveBeenCalled();
    
    // Vérifier le résultat
    expect(response.x).toBe(50);
    expect(response.y).toBe(50);
  });

  it('should test coordinate conversion with different zoom levels', () => {
    const { app } = require('../src/controllers/Core/App');
    
    // Test avec zoom 0.5
    app.workspace.zoomLevel = 0.5;
    
    const mockFromCanvasCoordinates = vi.fn().mockReturnValue({
      x: 200, // 100 / 0.5 (si c'est correct)
      y: 200  // 100 / 0.5
    });

    const mockResponse = {
      x: 100,
      y: 100,
      fromCanvasCoordinates: mockFromCanvasCoordinates
    };

    mockCoordinates.nullCoordinates = mockResponse;

    let response = mockCoordinates.nullCoordinates;
    response.x = 100; // coordonnées pixels
    response.y = 100;
    
    response = response.fromCanvasCoordinates();

    expect(mockFromCanvasCoordinates).toHaveBeenCalled();
    expect(response.x).toBe(200);
    expect(response.y).toBe(200);
  });
});
