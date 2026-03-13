// Tests pour gridStore.js

import { gridStore } from '@store/gridStore';
import { describe, expect, it, vi, beforeEach } from 'vitest';

describe('gridStore', () => {
  beforeEach(() => {
    gridStore._resetState();
  });

  it('should have a default initial state', () => {
    const initialState = gridStore.getState();
    expect(initialState.gridType).toBe('none');
    expect(initialState.gridSize).toBe(1);
    expect(initialState.gridOpacity).toBe(0.7);
    expect(initialState.isVisible).toBe(false);
  });

  it('should allow setting and getting the grid type', () => {
    gridStore.setGridType('triangle-grid');
    expect(gridStore.getState().gridType).toBe('triangle-grid');

    gridStore.setGridType('dot-grid');
    expect(gridStore.getState().gridType).toBe('dot-grid');
  });

  it('should set isVisible to false when gridType is \'none\'', () => {
    gridStore.setIsVisible(true); // Start with grid visible
    gridStore.setGridType('none');
    expect(gridStore.getState().isVisible).toBe(false);
    expect(gridStore.getState().gridType).toBe('none');
  });

  it('should set isVisible to true when a gridType is set and it was false', () => {
    gridStore.setGridType('square-grid');
    expect(gridStore.getState().isVisible).toBe(true);
    expect(gridStore.getState().gridType).toBe('square-grid');
  });

  it('should allow setting and getting the grid size', () => {
    gridStore.setGridSize(5);
    expect(gridStore.getState().gridSize).toBe(5);

    gridStore.setGridSize(0.1);
    expect(gridStore.getState().gridSize).toBe(0.1);
  });

  it('should not allow setting a grid size less than or equal to 0', () => {
    gridStore.setGridSize(0);
    expect(gridStore.getState().gridSize).toBe(0.1);

    gridStore.setGridSize(-5);
    expect(gridStore.getState().gridSize).toBe(0.1);
  });

  it('should allow setting and getting the grid opacity', () => {
    gridStore.setGridOpacity(0.5);
    expect(gridStore.getState().gridOpacity).toBe(0.5);
  });

  it('should clamp opacity values outside the 0-1 range', () => {
    gridStore.setGridOpacity(1.5);
    expect(gridStore.getState().gridOpacity).toBe(1);

    gridStore.setGridOpacity(-0.5);
    expect(gridStore.getState().gridOpacity).toBe(0);
  });

  it('should allow setting and getting the grid visibility', () => {
    gridStore.setIsVisible(true);
    expect(gridStore.getState().isVisible).toBe(true);

    gridStore.setIsVisible(false);
    expect(gridStore.getState().isVisible).toBe(false);
  });

  it('notifies listeners on state change', () => {
    const listener = vi.fn();
    const unsubscribe = gridStore.subscribe(listener);
    
    gridStore.setIsVisible(true);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ isVisible: true }));
    
    unsubscribe();
    gridStore.setIsVisible(false);
    expect(listener).toHaveBeenCalledTimes(1); // Not called after unsubscribe
  });

  it('notifies listeners on reset', () => {
    const listener = vi.fn();
    gridStore.subscribe(listener);
    
    gridStore._resetState();
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ gridType: 'none' }));
  });
});
