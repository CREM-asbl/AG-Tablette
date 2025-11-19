import { expect } from '@open-wc/testing';
import { historyActions } from '../../src/store/appState';
import { vi, describe, it, beforeEach, afterEach } from 'vitest';

describe('historyActions', () => {
    let originalDispatch;
    let dispatchMock;

    beforeEach(() => {
        originalDispatch = window.dispatchEvent;
        dispatchMock = vi.fn();
        window.dispatchEvent = dispatchMock;
    });

    afterEach(() => {
        window.dispatchEvent = originalDispatch;
    });

    it('should dispatch undo event', () => {
        historyActions.undo();
        expect(dispatchMock).toHaveBeenCalled();
        const event = dispatchMock.mock.calls[0][0];
        expect(event.type).toBe('undo');
    });

    it('should dispatch redo event', () => {
        historyActions.redo();
        expect(dispatchMock).toHaveBeenCalled();
        const event = dispatchMock.mock.calls[0][0];
        expect(event.type).toBe('redo');
    });
});
