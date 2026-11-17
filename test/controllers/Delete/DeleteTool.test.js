import { appActions } from '@store/appState';
import { DeleteTool } from '@controllers/Delete/DeleteTool';
import { helpConfigRegistry } from '@services/HelpConfigRegistry';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GroupManager } from '@controllers/Core/Managers/GroupManager';
import { ShapeManager } from '@controllers/Core/Managers/ShapeManager';
import { app, setState } from '@controllers/Core/App';
import * as generalTools from '@controllers/Core/Tools/general';
import * as geometryDeleteTools from '@controllers/GeometryTools/deleteShape';

vi.mock('@lit-labs/signals', () => ({
  computed: vi.fn((cb) => ({ get: cb })),
  signal: vi.fn((val) => ({ get: () => val, set: vi.fn() })),
}));

vi.mock('@controllers/Core/App', () => {
  const setState = vi.fn();
  const app = {
    tool: { name: 'delete', currentStep: 'start' },
    environment: { name: 'Geometrie' },
    mainCanvasLayer: {
      shapes: [],
    },
    workspace: {
      selectionConstraints: {
        shapes: {},
        points: {},
        segments: {}
      }
    },
    addListener: vi.fn(() => 'listener-id'),
    removeListener: vi.fn(),
  };
  return { app, setState };
});

vi.mock('@store/appState', () => ({
  activeTool: { get: vi.fn(() => 'delete'), set: vi.fn() },
  currentStep: { get: vi.fn(() => 'start'), set: vi.fn() },
  toolState: { get: vi.fn(() => ({})), set: vi.fn() },
  appActions: {
    setActiveTool: vi.fn(),
    setCurrentStep: vi.fn(),
    setToolState: vi.fn(),
  },
}));

vi.mock('@controllers/Core/Managers/GroupManager', () => ({
  GroupManager: {
    getShapeGroup: vi.fn(),
    deleteGroup: vi.fn(),
  },
}));

vi.mock('@controllers/Core/Managers/ShapeManager', () => ({
  ShapeManager: {
    getAllBindedShapes: vi.fn((s) => [s]),
  },
}));

vi.mock('@controllers/Core/Tools/general', () => ({
  findObjectById: vi.fn(),
  removeObjectById: vi.fn(),
}));

vi.mock('@controllers/GeometryTools/deleteShape', () => ({
  deleteChildren: vi.fn(),
  deleteChildrenOfDivisionPoint: vi.fn(),
  deleteSubDivisionPoints: vi.fn(),
}));

// Mock Shape
function Shape(id = '1') {
  this.id = id;
  this.points = [];
  this.geometryObject = {};
}
vi.mock('@controllers/Core/Objects/Shapes/Shape', () => ({ Shape }));

describe('DeleteTool', () => {
  let tool;

  beforeEach(() => {
    vi.clearAllMocks();
    helpConfigRegistry.clear();
    app.mainCanvasLayer.shapes = [];
    tool = new DeleteTool();
  });

  it('registers help config in start()', () => {
    tool.start();
    expect(helpConfigRegistry.has('delete')).toBe(true);
  });

  it('updates signals in start()', async () => {
    vi.useFakeTimers();
    tool.start();
    vi.advanceTimersByTime(100);
    
    expect(appActions.setActiveTool).toHaveBeenCalledWith('delete');
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('listen');
    vi.useRealTimers();
  });

  it('deletes a shape and its children', () => {
    const mockShape = new Shape('s1');
    ShapeManager.getAllBindedShapes.mockReturnValue([mockShape]);
    
    tool.objectSelected(mockShape);
    
    expect(geometryDeleteTools.deleteChildren).toHaveBeenCalledWith(mockShape);
    expect(generalTools.removeObjectById).toHaveBeenCalledWith('s1');
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('listen');
  });

  it('deletes a group if necessary', () => {
    const mockShape = new Shape('s1');
    const mockGroup = { id: 'g1' };
    GroupManager.getShapeGroup.mockReturnValue(mockGroup);
    
    tool.objectSelected(mockShape);
    
    expect(GroupManager.deleteGroup).toHaveBeenCalledWith(mockGroup);
  });

  it('deletes a division point', () => {
    const mockPoint = {
      segments: [{
        deletePoint: vi.fn()
      }]
    };
    
    tool.objectSelected(mockPoint);
    
    expect(geometryDeleteTools.deleteSubDivisionPoints).toHaveBeenCalled();
    expect(geometryDeleteTools.deleteChildrenOfDivisionPoint).toHaveBeenCalledWith(mockPoint);
    expect(mockPoint.segments[0].deletePoint).toHaveBeenCalledWith(mockPoint);
  });
});
