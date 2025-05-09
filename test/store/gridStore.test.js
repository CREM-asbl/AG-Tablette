// Tests pour gridStore.js

import { gridStore } from '@store/gridStore';
import { describe, expect, it } from 'vitest';

describe('gridStore', () => {
  it('should have a default initial state', () => {
    gridStore._resetState(); // S'assurer que l'état est celui par défaut avant ce test
    const initialState = gridStore.getState();
    expect(initialState.gridType).toBe('none'); // Corrected expectation
    expect(initialState.gridSize).toBe(1);
    expect(initialState.gridOpacity).toBe(0.7);
    expect(initialState.isVisible).toBe(false);
  });

  it('should allow setting and getting the grid type', () => {
    gridStore._resetState(); // Assurer un état propre pour le test
    gridStore.setGridType('triangle-grid');
    expect(gridStore.getState().gridType).toBe('triangle-grid');

    gridStore.setGridType('dot-grid');
    expect(gridStore.getState().gridType).toBe('dot-grid');
  });

  it('should set isVisible to false when gridType is \'none\'', () => {
    gridStore._resetState();
    gridStore.setIsVisible(true); // Start with grid visible
    gridStore.setGridType('none');
    expect(gridStore.getState().isVisible).toBe(false);
    expect(gridStore.getState().gridType).toBe('none');
  });

  it('should set isVisible to true when a gridType is set and it was false', () => {
    gridStore._resetState(); // isVisible is false by default
    gridStore.setGridType('square-grid');
    expect(gridStore.getState().isVisible).toBe(true);
    expect(gridStore.getState().gridType).toBe('square-grid');
  });

  it('should keep isVisible true when changing between visible gridTypes', () => {
    gridStore._resetState();
    gridStore.setGridType('square-grid'); // isVisible becomes true
    expect(gridStore.getState().isVisible).toBe(true);
    gridStore.setGridType('triangle-grid');
    expect(gridStore.getState().isVisible).toBe(true);
    expect(gridStore.getState().gridType).toBe('triangle-grid');
  });

  it('should allow setting and getting the grid size', () => {
    gridStore._resetState();
    gridStore.setGridSize(5);
    expect(gridStore.getState().gridSize).toBe(5);

    gridStore.setGridSize(0.5);
    expect(gridStore.getState().gridSize).toBe(0.5);
  });

  it('should not allow setting a grid size less than or equal to 0', () => {
    gridStore._resetState();
    const originalSize = gridStore.getState().gridSize;

    gridStore.setGridSize(0);
    expect(gridStore.getState().gridSize).toBe(0.1); // Should be clamped to min

    gridStore.setGridSize(-5);
    expect(gridStore.getState().gridSize).toBe(0.1); // Should be clamped to min

    // Check that a valid size still works
    gridStore.setGridSize(2);
    expect(gridStore.getState().gridSize).toBe(2);
  });

  it('should allow setting and getting the grid opacity', () => {
    gridStore._resetState();
    gridStore.setGridOpacity(0.5);
    expect(gridStore.getState().gridOpacity).toBe(0.5);

    gridStore.setGridOpacity(1);
    expect(gridStore.getState().gridOpacity).toBe(1);

    gridStore.setGridOpacity(0);
    expect(gridStore.getState().gridOpacity).toBe(0);
  });

  it('should clamp opacity values outside the 0-1 range', () => {
    gridStore._resetState();

    gridStore.setGridOpacity(1.5);
    expect(gridStore.getState().gridOpacity).toBe(1);

    gridStore.setGridOpacity(-0.5);
    expect(gridStore.getState().gridOpacity).toBe(0);

    // Check that a valid opacity still works
    gridStore.setGridOpacity(0.7);
    expect(gridStore.getState().gridOpacity).toBe(0.7);
  });

  it('should allow setting and getting the grid visibility', () => {
    gridStore._resetState();
    gridStore.setIsVisible(true);
    expect(gridStore.getState().isVisible).toBe(true);

    gridStore.setIsVisible(false);
    expect(gridStore.getState().isVisible).toBe(false);
  });
});
