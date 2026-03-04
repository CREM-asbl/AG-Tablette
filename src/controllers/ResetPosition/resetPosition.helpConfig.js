/**
 * Configuration d'aide contextuelle pour resetPosition
 */

export const resetPositionHelpConfig = {
  steps: ['start', 'listen'],

  getStepConfig: (state) => {
    const { currentStep } = state;

    if (currentStep === 'start' || currentStep === 'listen') {
      return {
        target: 'canvas-container',
        text: 'Selectionne une figure pour la remettre a sa position initiale',
      };
    }

    return null;
  },
};
