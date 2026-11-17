/**
 * Configuration d'aide contextuelle pour cut
 * Workflow : selection des points de decoupe
 */

export const cutHelpConfig = {
  steps: ['start', 'listen', 'selectSecondPoint', 'selectThirdPoint', 'cut'],

  getStepConfig: (state) => {
    const { currentStep } = state;

    if (currentStep === 'start' || currentStep === 'listen') {
      return {
        target: 'canvas-container',
        text: 'Sélectionne le premier point de découpe',
      };
    }

    if (currentStep === 'selectSecondPoint') {
      return {
        target: 'canvas-container',
        text: 'Sélectionne le centre (optionnel) ou le second point de découpe',
      };
    }

    if (currentStep === 'selectThirdPoint') {
      return {
        target: 'canvas-container',
        text: 'Sélectionne le second point de découpe',
      };
    }

    if (currentStep === 'cut') {
      return {
        target: 'canvas-container',
        text: 'Verification de la decoupe en cours',
      };
    }

    return null;
  },
};
