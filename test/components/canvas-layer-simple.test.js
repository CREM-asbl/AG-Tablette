/**
 * Test simple et isolé pour drawGridPoints
 */

import '@components/canvas-layer';
import { app } from '@controllers/Core/App';
import { gridStore } from '@store/gridStore';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('DrawGridPoints - Test isolé', () => {
  let canvasLayerElement;

  beforeEach(() => {
    // Mock gridStore
    gridStore.getState = vi.fn().mockReturnValue({
      gridType: 'square',
      gridSize: 1,
      isVisible: true,
      gridColor: '#888888',
    });

    // Créer l'élément
    canvasLayerElement = document.createElement('canvas-layer');

    // Mock canvas et contexte
    const mockCanvas = document.createElement('canvas');
    mockCanvas.width = 800;
    mockCanvas.height = 600;

    const mockCtx = {
      clearRect: vi.fn(),
      fillStyle: '',
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
    };

    mockCanvas.getContext = vi.fn(() => mockCtx);
    canvasLayerElement.canvas = mockCanvas;
    canvasLayerElement.ctx = mockCtx;
  });

  it('should call arc() when drawing square grid', () => {
    console.log('Avant appel drawGridPoints');
    console.log('app.canvasWidth:', app.canvasWidth);
    console.log('app.canvasHeight:', app.canvasHeight);
    console.log('app.workspace.zoomLevel:', app.workspace.zoomLevel);

    canvasLayerElement.drawGridPoints();

    console.log('Après appel drawGridPoints');
    console.log('arc appelé:', canvasLayerElement.ctx.arc.mock.calls.length, 'fois');

    expect(canvasLayerElement.ctx.arc).toHaveBeenCalled();
  });
});
