/**
 * Configuration d'aide contextuelle pour reverse
 */

export const reverseHelpConfig = {
  steps: ['start', 'listen', 'selectAxis', 'reverse'],

  getStepConfig: (state) => {
    const { currentStep } = state;

    if (currentStep === 'start' || currentStep === 'listen') {
      return {
        target: 'canvas-container',
        text: 'Selectionne la figure a retourner',
      };
    }

    if (currentStep === 'selectAxis') {
      return {
        target: 'canvas-container',
        text: 'Choisis l\'axe de symetrie pour retourner la figure',
      };
    }

    if (currentStep === 'reverse') {
      return {
        target: 'canvas-container',
        text: 'Retournement en cours',
      };
    }

    return null;
  },
};