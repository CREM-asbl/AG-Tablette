/**
 * Configuration d'aide contextuelle pour merge
 * Workflow : selection premiere figure -> selection seconde figure
 */

export const mergeHelpConfig = {
  steps: ['start', 'listen', 'selectSecondShape'],

  getStepConfig: (state) => {
    const { currentStep } = state;

    if (currentStep === 'start' || currentStep === 'listen') {
      return {
        target: 'canvas-container',
        text: 'Selectionne la premiere figure a fusionner',
      };
    }

    if (currentStep === 'selectSecondShape') {
      return {
        target: 'canvas-container',
        text: 'Selectionne la seconde figure pour lancer la fusion',
      };
    }

    return null;
  },
};
