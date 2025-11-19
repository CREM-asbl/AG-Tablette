import { CreateCircleTool } from '@controllers/CreateCircle/CreateCircleTool';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the App module
vi.mock('@controllers/Core/App', () => {
    const setState = vi.fn();
    const app = {
        tool: null,
        upperCanvasLayer: {
            removeAllObjects: vi.fn(),
        },
        workspace: {
            lastKnownMouseCoordinates: { x: 0, y: 0 },
        },
        settings: {
            temporaryDrawColor: '#ff0000',
            referenceDrawColor: '#00ff00',
            referenceDrawColor2: '#0000ff',
        },
        addListener: vi.fn(),
        removeListener: vi.fn(),
    };
    return { app, setState };
});

import { app, setState } from '@controllers/Core/App';

describe('CreateCircleTool', () => {
    let tool;

    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks();

        // Reset app state
        app.tool = {
            selectedTemplate: null,
        };

        // Mock document.querySelector and createElement
        document.querySelector = vi.fn().mockReturnValue({
            appendChild: vi.fn(),
        });
        document.createElement = vi.fn().mockReturnValue({
            family: '',
            templatesNames: [],
            selectedTemplate: null,
            type: '',
            nextStep: '',
        });

        tool = new CreateCircleTool();
    });

    it('should be defined', () => {
        expect(tool).toBeDefined();
        expect(tool.name).toBe('createCircle');
        expect(tool.title).toBe('Construire un arc');
    });

    it('should start correctly', () => {
        tool.start();
        expect(document.createElement).toHaveBeenCalledWith('shape-selector');
        expect(document.querySelector).toHaveBeenCalledWith('body');
    });

    it('should initialize drawFirstPoint correctly', async () => {
        vi.useFakeTimers();
        await tool.drawFirstPoint();

        expect(app.upperCanvasLayer.removeAllObjects).toHaveBeenCalled();
        expect(tool.points).toEqual([]);
        expect(tool.segments).toEqual([]);
        expect(tool.numberOfPointsDrawn).toBe(0);

        vi.runAllTimers();

        // Verify setState was called
        expect(setState).toHaveBeenCalledWith(expect.objectContaining({
            tool: expect.objectContaining({
                currentStep: 'drawPoint',
            }),
        }));

        vi.useRealTimers();
    });
});
