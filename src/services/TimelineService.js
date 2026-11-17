const TIMELINE_SCHEMA_VERSION = 1;

const isFiniteNumber = (value) =>
  typeof value === 'number' && Number.isFinite(value);

export const createMonotonicClock = () => {
  let last = 0;

  return () => {
    const candidate =
      typeof performance !== 'undefined' && typeof performance.now === 'function'
        ? performance.now()
        : Date.now();

    // Guarantees monotonicity even if clock source jitters.
    last = Math.max(last, candidate);
    return last;
  };
};

const buildStepId = (actionIndex, stepIndex, timeStamp) => {
  return `${actionIndex ?? 0}:${stepIndex}:${Math.round(timeStamp)}`;
};

export const validateTimelineStep = (step) => {
  if (!step || typeof step !== 'object') return false;

  if (typeof step.type !== 'string' || step.type.length === 0) return false;
  if (!isFiniteNumber(step.timeStamp) || step.timeStamp < 0) return false;
  if (!isFiniteNumber(step.timeDelta) || step.timeDelta < 0) return false;

  if (!isFiniteNumber(step.timelineVersion)) return false;
  if (step.timelineVersion < TIMELINE_SCHEMA_VERSION) return false;

  if (!step.timelineMeta || typeof step.timelineMeta !== 'object') return false;
  if (!isFiniteNumber(step.timelineMeta.recordedAt)) return false;

  return true;
};

export const createTimelineStep = ({
  type,
  detail,
  actionIndex,
  previousStep,
  timeStamp,
  stepIndex,
}) => {
  const safeTimeStamp = isFiniteNumber(timeStamp) ? timeStamp : 0;
  const previousTimeStamp = isFiniteNumber(previousStep?.timeStamp)
    ? previousStep.timeStamp
    : 0;
  const timeDelta =
    stepIndex === 0 ? 0 : Math.max(0, safeTimeStamp - previousTimeStamp);

  const step = {
    type,
    detail,
    timeStamp: safeTimeStamp,
    timeDelta,
    timelineVersion: TIMELINE_SCHEMA_VERSION,
    timelineMeta: {
      id: buildStepId(actionIndex, stepIndex, safeTimeStamp),
      recordedAt: safeTimeStamp,
      schema: 'full-history-step',
    },
  };

  return step;
};

export const serializeTimelineSteps = (steps) => {
  const safeSteps = Array.isArray(steps)
    ? steps.filter((step) => validateTimelineStep(step))
    : [];

  return JSON.stringify({
    timelineVersion: TIMELINE_SCHEMA_VERSION,
    steps: safeSteps,
  });
};

export const deserializeTimelineSteps = (serialized) => {
  if (typeof serialized !== 'string') {
    return {
      timelineVersion: TIMELINE_SCHEMA_VERSION,
      steps: [],
    };
  }

  try {
    const parsed = JSON.parse(serialized);
    const steps = Array.isArray(parsed?.steps)
      ? parsed.steps.filter((step) => validateTimelineStep(step))
      : [];

    return {
      timelineVersion:
        parsed?.timelineVersion ?? TIMELINE_SCHEMA_VERSION,
      steps,
    };
  } catch {
    return {
      timelineVersion: TIMELINE_SCHEMA_VERSION,
      steps: [],
    };
  }
};

export { TIMELINE_SCHEMA_VERSION };

