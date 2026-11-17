import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@lit-labs/signals', () => ({
  computed: vi.fn((cb) => ({ get: cb })),
}));

vi.mock('../../../../src/store/appState', () => ({
  activeTool: { get: vi.fn(() => null) },
  currentStep: { get: vi.fn(() => null) },
  selectedTemplate: { get: vi.fn(() => null) },
  toolState: { get: vi.fn(() => ({})) },
  createWatcher: vi.fn(() => vi.fn()),
}));

vi.mock('../../../../src/controllers/Core/App', () => ({
  app: {
    tool: null,
    fullHistory: { isRunning: false },
  },
}));

import { app } from '../../../../src/controllers/Core/App';
import { Tool } from '../../../../src/controllers/Core/States/Tool';

class DummyTool extends Tool {
  constructor() {
    super('dummy', 'Dummy', 'tool');
  }

  listen() { }
  end() { }
}

class DummyMoveTool extends Tool {
  constructor() {
    super('dummyMove', 'Dummy Move', 'move');
  }

  listen() { }
  end() { }
}

class DummyTransformationTool extends Tool {
  constructor() {
    super('dummyTransform', 'Dummy Transform', 'transformation');
  }

  rotate() { }
  end() { }
}

describe('Tool', () => {
  let tool;
  let moveTool;
  let transformationTool;

  beforeEach(() => {
    vi.clearAllMocks();
    tool = new DummyTool();
    moveTool = new DummyMoveTool();
    transformationTool = new DummyTransformationTool();
    tool.listen = vi.fn();
    tool.end = vi.fn();
    moveTool.listen = vi.fn();
    moveTool.end = vi.fn();
    transformationTool.rotate = vi.fn();
    transformationTool.end = vi.fn();
  });

  it('executes current step during fullHistory replay for tool type', () => {
    app.tool = { name: 'dummy', currentStep: 'listen' };
    app.fullHistory.isRunning = true;

    tool.eventHandler({ type: 'tool-updated' });

    expect(tool.listen).toHaveBeenCalled();
  });

  it('executes current step during fullHistory replay for geometryCreator type', () => {
    class DummyCreatorTool extends Tool {
      constructor() {
        super('dummyCreator', 'Dummy Creator', 'geometryCreator');
      }
      listen() {}
    }
    const creatorTool = new DummyCreatorTool();
    creatorTool.listen = vi.fn();
    
    app.tool = { name: 'dummyCreator', currentStep: 'listen' };
    app.fullHistory.isRunning = true;

    creatorTool.eventHandler({ type: 'tool-updated' });

    expect(creatorTool.listen).toHaveBeenCalled();
  });

  it('executes current step during fullHistory replay for operation type', () => {
    class DummyOperationTool extends Tool {
      constructor() {
        super('dummyOperation', 'Dummy Operation', 'operation');
      }
      listen() {}
    }
    const operationTool = new DummyOperationTool();
    operationTool.listen = vi.fn();
    
    app.tool = { name: 'dummyOperation', currentStep: 'listen' };
    app.fullHistory.isRunning = true;

    operationTool.eventHandler({ type: 'tool-updated' });

    expect(operationTool.listen).toHaveBeenCalled();
  });

  it('still cleans up when tool becomes null during fullHistory replay', () => {
    app.tool = null;
    app.fullHistory.isRunning = true;

    tool.eventHandler({ type: 'tool-updated' });

    expect(tool.end).toHaveBeenCalled();
  });

  it('keeps executing animation tool steps during fullHistory replay', () => {
    app.tool = { name: 'dummyMove', currentStep: 'listen' };
    app.fullHistory.isRunning = true;

    moveTool.eventHandler({ type: 'tool-updated' });

    expect(moveTool.listen).toHaveBeenCalled();
  });

  it('keeps executing transformation tool steps during fullHistory replay', () => {
    app.tool = { name: 'dummyTransform', currentStep: 'rotate' };
    app.fullHistory.isRunning = true;

    transformationTool.eventHandler({ type: 'tool-updated' });

    expect(transformationTool.rotate).toHaveBeenCalled();
  });
});
