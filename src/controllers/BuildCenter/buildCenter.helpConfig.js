/**
 * Configuration d'aide contextuelle pour buildCenter
 */

export const buildCenterHelpConfig = {
  steps: ['start', 'listen'],

  getStepConfig: (state) => {
    const { currentStep } = state;

    if (currentStep === 'start' || currentStep === 'listen') {
      return {
        target: 'canvas-container',
        text: 'Selectionne une figure pour afficher ou masquer son centre',
      };
    }

    return null;
  },
};
