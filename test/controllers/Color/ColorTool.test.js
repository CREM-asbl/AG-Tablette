import { appActions } from '@store/appState';
import { ColorTool } from '@controllers/Color/ColorTool';
import { helpConfigRegistry } from '@services/HelpConfigRegistry';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SelectManager } from '@controllers/Core/Managers/SelectManager';
import { ShapeManager } from '@controllers/Core/Managers/ShapeManager';
import { app, setState } from '@controllers/Core/App';

vi.mock('@lit-labs/signals', () => ({
  computed: vi.fn((cb) => ({ get: cb })),
  signal: vi.fn((val) => ({ get: () => val, set: vi.fn() })),
}));

vi.mock('@controllers/Core/App', () => {
  const setState = vi.fn();
  const app = {
    tool: { name: 'color', currentStep: 'start' },
    workspace: {
      lastKnownMouseCoordinates: { x: 10, y: 10 },
      selectionConstraints: {}
    },
    settings: {
      shapesDrawColor: '#00ff00',
    },
    addListener: vi.fn(() => 'listener-id'),
    removeListener: vi.fn(),
  };
  return { app, setState };
});

vi.mock('@store/appState', () => ({
  activeTool: { get: vi.fn(() => 'color'), set: vi.fn() },
  currentStep: { get: vi.fn(() => 'start'), set: vi.fn() },
  toolState: { get: vi.fn(() => ({})), set: vi.fn() },
  appActions: {
    setActiveTool: vi.fn(),
    setCurrentStep: vi.fn(),
    setToolState: vi.fn(),
  },
}));

// Use a shared constructor to enable instanceof
function Shape() {
  this.fillColor = '#000000';
  this.strokeColor = '#000000';
  this.fillOpacity = 1;
}

function LineShape() {
  Shape.call(this);
  this.segments = [{ isArc: () => false }];
}
LineShape.prototype = Object.create(Shape.prototype);
LineShape.prototype.constructor = LineShape;

function Segment() {
  this.color = '#000000';
}

vi.mock('@controllers/Core/Objects/Shapes/Shape', () => ({ Shape }));
vi.mock('@controllers/Core/Objects/Shapes/LineShape', () => ({ LineShape }));
vi.mock('@controllers/Core/Objects/Segment', () => ({ Segment }));

vi.mock('@controllers/Core/Managers/SelectManager', () => ({
  SelectManager: {
    selectObject: vi.fn(),
    getEmptySelectionConstraints: vi.fn(() => ({
      shapes: {},
      points: {},
      segments: {}
    })),
  },
}));

vi.mock('@controllers/Core/Managers/ShapeManager', () => ({
  ShapeManager: {
    getAllBindedShapes: vi.fn((s) => [s]),
  },
}));

describe('ColorTool', () => {
  let tool;

  beforeEach(() => {
    vi.clearAllMocks();
    helpConfigRegistry.clear();
    tool = new ColorTool();
  });

  it('registers help config in start()', () => {
    tool.start();
    expect(helpConfigRegistry.has('color')).toBe(true);
  });

  it('updates signals in start()', async () => {
    vi.useFakeTimers();
    tool.start();
    vi.advanceTimersByTime(100);
    
    expect(appActions.setActiveTool).toHaveBeenCalledWith('color');
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('listen');
    vi.useRealTimers();
  });

  it('sets up listeners in listen()', () => {
    tool.listen();
    expect(app.addListener).toHaveBeenCalledWith('canvasLongPress', expect.any(Function));
    expect(app.addListener).toHaveBeenCalledWith('canvasClick', expect.any(Function));
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('listen');
  });

  it('changes shape color on normal click', () => {
    const mockShape = new Shape();
    SelectManager.selectObject.mockReturnValue(mockShape);
    
    tool.canvasClick();
    
    expect(mockShape.fillColor).toBe('#00ff00');
  });

  it('changes LineShape stroke color on normal click', () => {
    const mockLine = new LineShape();
    expect(mockLine instanceof Shape).toBe(true);
    
    SelectManager.selectObject.mockReturnValue(mockLine);
    
    tool.canvasClick();
    
    expect(mockLine.strokeColor).toBe('#00ff00');
  });

  it('changes segment color on normal click', () => {
    const mockSegment = new Segment();
    SelectManager.selectObject.mockReturnValue(mockSegment);
    
    tool.canvasClick();
    
    expect(mockSegment.color).toBe('#00ff00');
  });

  it('changes stroke color on long press', () => {
    const mockShape = new Shape();
    SelectManager.selectObject.mockReturnValue(mockShape);
    
    tool.canvasLongPress();
    
    expect(mockShape.strokeColor).toBe('#00ff00');
  });

  it('prevents next click after long press', () => {
    SelectManager.selectObject.mockReturnValue(null);
    
    tool.canvasLongPress();
    expect(tool.mustPreventNextClick).toBe(true);
    
    tool.canvasClick();
    expect(tool.mustPreventNextClick).toBe(false);
    expect(SelectManager.selectObject).toHaveBeenCalledTimes(1); // Only from longPress
  });
});
