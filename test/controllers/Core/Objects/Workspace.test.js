import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@controllers/Core/App', () => {
  const mockMain = {
    loadFromData: vi.fn(),
    saveData: vi.fn(() => ({ objs: true })),
    toSVG: vi.fn(() => '<main/>'),
  };
  const mockTangram = {
    shapes: [],
    saveData: vi.fn(() => ({ back: true })),
    removeAllObjects: vi.fn(),
    toSVG: vi.fn(() => '<tangram/>'),
    clear: vi.fn(),
  };
  const mockGrid = { clear: vi.fn(), toSVG: vi.fn(() => '<grid/>') };

  global.mockApp = {
    canvasWidth: 800,
    canvasHeight: 600,
    mainCanvasLayer: mockMain,
    tangramCanvasLayer: mockTangram,
    gridCanvasLayer: mockGrid,
    settings: { minZoomLevel: 0.5, maxZoomLevel: 3 },
    environment: { name: 'Default' },
  };

  return { app: global.mockApp };
});

import { app } from '@controllers/Core/App';
import { Workspace } from '@controllers/Core/Objects/Workspace';

describe('Workspace - basiques', () => {
  let ws;

  beforeEach(() => {
    ws = new Workspace();
    vi.clearAllMocks();
    app.mainCanvasLayer.loadFromData.mockClear();
    app.mainCanvasLayer.saveData.mockClear();
    app.tangramCanvasLayer.saveData.mockClear();
    app.tangramCanvasLayer.removeAllObjects.mockClear();
    // lier app.workspace à l'instance testée
    app.workspace = ws;
  });

  it('initFromObject(null) appelle resetWorkspace', async () => {
    await ws.initFromObject(null);
    expect(app.mainCanvasLayer.loadFromData).toHaveBeenCalledWith(null);
  });

  it('initFromObject avec type invalide appelle resetWorkspace', async () => {
    await ws.initFromObject('string');
    expect(app.mainCanvasLayer.loadFromData).toHaveBeenCalledWith(null);
  });

  it('data inclut objects et canvasSize et backObjects et efface tangram si vide', () => {
    app.tangramCanvasLayer.shapes = [];
    const data = ws.data;
    expect(data.objects).toEqual({ objs: true });
    expect(data.canvasSize).toEqual({ width: app.canvasWidth, height: app.canvasHeight });
    expect(data.backObjects).toEqual({ back: true });
    expect(app.tangramCanvasLayer.removeAllObjects).toHaveBeenCalled();
  });

  it('setZoomLevel borne les valeurs et déclenche refresh', () => {
    const spy = vi.spyOn(window, 'dispatchEvent');
    ws.setZoomLevel(100);
    expect(ws.zoomLevel).toBe(app.settings.maxZoomLevel);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('selectionConstraints setter/getter fonctionne', () => {
    ws.selectionConstraints = { a: 1 };
    expect(ws.selectionConstraints).toEqual({ a: 1 });
  });

  it('toSVG contient main and tangram and grid when present', () => {
    const svg = ws.toSVG();
    expect(svg).toContain('<main/>');
    expect(svg).toContain('<tangram/>');
    expect(svg).toContain('<grid/>');
  });

  it('resetWorkspace appelle loadFromData(null) et clear sur couches', async () => {
    await ws.resetWorkspace();
    expect(app.mainCanvasLayer.loadFromData).toHaveBeenCalledWith(null);
    expect(app.tangramCanvasLayer.clear).toHaveBeenCalled();
    expect(app.gridCanvasLayer.clear).toHaveBeenCalled();
  });
});
