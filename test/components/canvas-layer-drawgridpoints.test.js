/**
 * Tests pour drawGridPoints() de CanvasLayer
 * Séparé du fichier principal pour éviter les conflits de mocks
 */

import '@components/canvas-layer';
import { app } from '@controllers/Core/App';
import { gridStore } from '@store/gridStore';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('CanvasLayer - drawGridPoints()', () => {
  let canvasLayerElement;
  let mockCtx;

  beforeEach(() => {
    // Créer l'élément canvas-layer
    canvasLayerElement = document.createElement('canvas-layer');

    // Mock canvas avec dimensions standard
    const mockCanvas = document.createElement('canvas');
    mockCanvas.width = 800;
    mockCanvas.height = 600;

    // Mock du contexte 2D avec spies
    mockCtx = {
      clearRect: vi.fn(),
      fillStyle: '',
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
    };

    mockCanvas.getContext = vi.fn(() => mockCtx);
    canvasLayerElement.canvas = mockCanvas;
    canvasLayerElement.ctx = mockCtx;

    // Mock gridStore par défaut (grille invisible)
    gridStore.getState = vi.fn().mockReturnValue({
      gridType: 'none',
      gridSize: 1,
      isVisible: false,
      gridColor: '#888888',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Comportement de base', () => {
    it('ne devrait pas dessiner si la grille est invisible', () => {
      gridStore.getState.mockReturnValue({
        gridType: 'square',
        gridSize: 1,
        isVisible: false, // Grille non visible
        gridColor: '#888888',
      });

      canvasLayerElement.drawGridPoints();

      expect(mockCtx.arc).not.toHaveBeenCalled();
      expect(mockCtx.fill).not.toHaveBeenCalled();
    });

    it('ne devrait pas dessiner si gridType est "none"', () => {
      gridStore.getState.mockReturnValue({
        gridType: 'none', // Pas de grille
        gridSize: 1,
        isVisible: true,
        gridColor: '#888888',
      });

      canvasLayerElement.drawGridPoints();

      expect(mockCtx.arc).not.toHaveBeenCalled();
    });

    it('devrait définir fillStyle à la couleur de grille', () => {
      gridStore.getState.mockReturnValue({
        gridType: 'square',
        gridSize: 1,
        isVisible: true,
        gridColor: '#FF0000',
      });

      canvasLayerElement.drawGridPoints();

      expect(mockCtx.fillStyle).toBe('#FF0000');
    });
  });

  describe('Grille carrée (square)', () => {
    beforeEach(() => {
      gridStore.getState.mockReturnValue({
        gridType: 'square',
        gridSize: 1, // 1cm
        isVisible: true,
        gridColor: '#888888',
      });
    });

    it('devrait dessiner des points pour une grille carrée', () => {
      canvasLayerElement.drawGridPoints();

      // Avec canvas 800x600, gridSize 1cm (37.8px), zoom 1
      // On devrait avoir ~352 points (22 colonnes x 16 lignes)
      expect(mockCtx.beginPath).toHaveBeenCalled();
      expect(mockCtx.arc).toHaveBeenCalled();
      expect(mockCtx.fill).toHaveBeenCalled();

      // Vérifier qu'on a un nombre raisonnable d'appels
      const arcCalls = mockCtx.arc.mock.calls.length;
      expect(arcCalls).toBeGreaterThan(300);
      expect(arcCalls).toBeLessThan(400);
    });

    it('devrait appeler arc() avec le bon rayon (2 * zoomLevel)', () => {
      canvasLayerElement.drawGridPoints();

      // Vérifier que tous les appels à arc() utilisent le bon rayon
      const firstCall = mockCtx.arc.mock.calls[0];
      const pointRadius = 2 * app.workspace.zoomLevel; // 2 * 1 = 2

      expect(firstCall[2]).toBe(pointRadius); // 3e argument = rayon
      expect(firstCall[3]).toBe(0); // angleStart
      expect(firstCall[4]).toBe(2 * Math.PI); // angleEnd
    });

    it('devrait dessiner correctement avec zoom = 2', () => {
      // Modifier temporairement le zoom
      const originalZoom = app.workspace.zoomLevel;
      app.workspace.zoomLevel = 2;

      canvasLayerElement.drawGridPoints();

      // Avec zoom 2, on a moins de points visibles
      // (le pas de grille est plus grand en pixels)
      const arcCalls = mockCtx.arc.mock.calls.length;
      expect(arcCalls).toBeGreaterThan(50);
      expect(arcCalls).toBeLessThan(150);

      // Restaurer le zoom
      app.workspace.zoomLevel = originalZoom;
    });
  });

  describe('Grilles lignes verticales/horizontales', () => {
    it('devrait dessiner moins de points pour vertical-lines', () => {
      gridStore.getState.mockReturnValue({
        gridType: 'vertical-lines',
        gridSize: 1,
        isVisible: true,
        gridColor: '#888888',
      });

      canvasLayerElement.drawGridPoints();

      // Pour vertical-lines, on dessine une seule colonne
      const arcCalls = mockCtx.arc.mock.calls.length;
      expect(arcCalls).toBeGreaterThan(10);
      expect(arcCalls).toBeLessThan(30);
    });

    it('devrait dessiner moins de points pour horizontal-lines', () => {
      gridStore.getState.mockReturnValue({
        gridType: 'horizontal-lines',
        gridSize: 1,
        isVisible: true,
        gridColor: '#888888',
      });

      canvasLayerElement.drawGridPoints();

      // Pour horizontal-lines, on dessine une seule ligne
      const arcCalls = mockCtx.arc.mock.calls.length;
      expect(arcCalls).toBeGreaterThan(15);
      expect(arcCalls).toBeLessThan(30);
    });
  });

  describe('Grilles triangulaires', () => {
    it('devrait dessiner des points pour vertical-triangle', () => {
      gridStore.getState.mockReturnValue({
        gridType: 'vertical-triangle',
        gridSize: 1,
        isVisible: true,
        gridColor: '#888888',
      });

      canvasLayerElement.drawGridPoints();

      expect(mockCtx.arc).toHaveBeenCalled();
      const arcCalls = mockCtx.arc.mock.calls.length;

      // Grille triangulaire a plus de points
      expect(arcCalls).toBeGreaterThanOrEqual(400);
    });

    it('devrait dessiner des points pour horizontal-triangle', () => {
      gridStore.getState.mockReturnValue({
        gridType: 'horizontal-triangle',
        gridSize: 1,
        isVisible: true,
        gridColor: '#888888',
      });

      canvasLayerElement.drawGridPoints();

      expect(mockCtx.arc).toHaveBeenCalled();
      const arcCalls = mockCtx.arc.mock.calls.length;

      // Grille triangulaire a plus de points
      expect(arcCalls).toBeGreaterThan(400);
    });
  });

  describe('Edge cases', () => {
    it('ne devrait pas dessiner si gridSize est 0', () => {
      gridStore.getState.mockReturnValue({
        gridType: 'square',
        gridSize: 0, // Taille nulle
        isVisible: true,
        gridColor: '#888888',
      });

      canvasLayerElement.drawGridPoints();

      // Aucun point ne devrait être dessiné
      expect(mockCtx.arc).not.toHaveBeenCalled();
    });

    it('devrait gérer un zoomLevel invalide en utilisant 1.0 par défaut', () => {
      const originalZoom = app.workspace.zoomLevel;
      app.workspace.zoomLevel = -5; // Invalide

      gridStore.getState.mockReturnValue({
        gridType: 'square',
        gridSize: 1,
        isVisible: true,
        gridColor: '#888888',
      });

      // Ne devrait pas crasher
      expect(() => canvasLayerElement.drawGridPoints()).not.toThrow();

      // Devrait quand même dessiner avec zoom = 1.0
      expect(mockCtx.arc).toHaveBeenCalled();

      app.workspace.zoomLevel = originalZoom;
    });
  });
});
