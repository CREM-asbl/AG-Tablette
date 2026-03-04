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
        text: 'Selectionne le premier point de decoupe',
      };
    }

    if (currentStep === 'selectSecondPoint') {
      return {
        target: 'canvas-container',
        text: 'Selectionne le point central (optionnel)',
      };
    }

    if (currentStep === 'selectThirdPoint') {
      return {
        target: 'canvas-container',
        text: 'Selectionne le second point de decoupe',
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
