/**
 * Configuration d'aide contextuelle pour copy
 * Workflow : selection -> deplacement de la copie
 */

export const copyHelpConfig = {
  steps: ['start', 'listen', 'move'],

  getStepConfig: (state) => {
    const { currentStep } = state;

    if (currentStep === 'start' || currentStep === 'listen') {
      return {
        target: 'canvas-container',
        text: 'Choisis une figure a copier',
      };
    }

    if (currentStep === 'move') {
      return {
        target: 'canvas-container',
        text: 'Glisse pour positionner la copie, puis relache',
      };
    }

    return null;
  },
};
