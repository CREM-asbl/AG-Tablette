import { describe, expect, it } from 'vitest';

import {
  TIMELINE_SCHEMA_VERSION,
  createMonotonicClock,
  createTimelineStep,
  deserializeTimelineSteps,
  serializeTimelineSteps,
  validateTimelineStep,
} from '../../src/services/TimelineService';

describe('TimelineService', () => {
  it('creates monotonic values', () => {
    const clock = createMonotonicClock();

    const first = clock();
    const second = clock();
    const third = clock();

    expect(second).toBeGreaterThanOrEqual(first);
    expect(third).toBeGreaterThanOrEqual(second);
  });

  it('creates timeline step with compatibility fields', () => {
    const step = createTimelineStep({
      type: 'tool-updated',
      detail: { name: 'create', currentStep: 'drawPoint' },
      actionIndex: 2,
      previousStep: { timeStamp: 10 },
      timeStamp: 18,
      stepIndex: 3,
    });

    expect(step.type).toBe('tool-updated');
    expect(step.timeStamp).toBe(18);
    expect(step.timeDelta).toBe(8);
    expect(step.timelineVersion).toBe(TIMELINE_SCHEMA_VERSION);
    expect(step.timelineMeta.id).toContain('2:3');
    expect(validateTimelineStep(step)).toBe(true);
  });

  it('serializes and deserializes only valid timeline steps', () => {
    const valid = createTimelineStep({
      type: 'add-fullstep',
      detail: { actionIndex: 1 },
      actionIndex: 1,
      previousStep: null,
      timeStamp: 1,
      stepIndex: 0,
    });

    const invalid = { type: 'x', timeStamp: -1 };

    const payload = serializeTimelineSteps([valid, invalid]);
    const deserialized = deserializeTimelineSteps(payload);

    expect(deserialized.timelineVersion).toBe(TIMELINE_SCHEMA_VERSION);
    expect(deserialized.steps).toHaveLength(1);
    expect(deserialized.steps[0].type).toBe('add-fullstep');
  });

  it('returns empty structure on malformed payload', () => {
    const deserialized = deserializeTimelineSteps('{invalid-json');

    expect(deserialized.timelineVersion).toBe(TIMELINE_SCHEMA_VERSION);
    expect(deserialized.steps).toEqual([]);
  });
});
