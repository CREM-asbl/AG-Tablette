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

  listen() {}
  end() {}
}

describe('Tool', () => {
  let tool;
  let moveTool;

  beforeEach(() => {
    vi.clearAllMocks();
    tool = new DummyTool();
    moveTool = new DummyMoveTool();
    tool.listen = vi.fn();
    tool.end = vi.fn();
    moveTool.listen = vi.fn();
    moveTool.end = vi.fn();
  });

  it('does not execute current step during fullHistory replay', () => {
    app.tool = { name: 'dummy', currentStep: 'listen' };
    app.fullHistory.isRunning = true;

    tool.eventHandler({ type: 'tool-updated' });

    expect(tool.listen).not.toHaveBeenCalled();
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
});
