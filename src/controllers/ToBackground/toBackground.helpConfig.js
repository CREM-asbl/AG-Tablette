/**
 * Configuration d'aide contextuelle pour toBackground
 */

export const toBackgroundHelpConfig = {
  steps: ['start', 'listen'],

  getStepConfig: (state) => {
    const { currentStep } = state;

    if (currentStep === 'start' || currentStep === 'listen') {
      return {
        target: 'canvas-container',
        text: 'Selectionne une figure a envoyer a l\'arriere-plan',
      };
    }

    return null;
  },
};
