/**
 * Configuration d'aide contextuelle pour duplicate
 * Workflow : selection -> deplacement ou duplication de point sur segment
 */

export const duplicateHelpConfig = {
  steps: ['start', 'listen', 'selectSegment', 'move'],

  getStepConfig: (state) => {
    const { currentStep } = state;

    if (currentStep === 'start' || currentStep === 'listen') {
      return {
        target: 'canvas-container',
        text: 'Selectionne la figure a dupliquer',
      };
    }

    if (currentStep === 'selectSegment') {
      return {
        target: 'canvas-container',
        text: 'Choisis le segment support pour le nouveau point',
      };
    }

    if (currentStep === 'move') {
      return {
        target: 'canvas-container',
        text: 'Glisse pour placer la duplication, puis relache',
      };
    }

    return null;
  },
};
