/**
 * Configuration d'aide contextuelle pour color
 */

export const colorHelpConfig = {
  steps: ['start', 'listen'],

  getStepConfig: (state) => {
    const { currentStep } = state;

    if (currentStep === 'start' || currentStep === 'listen') {
      return {
        target: 'canvas-container',
        text: 'Clique pour colorier, appui long pour recolorer les contours',
      };
    }

    return null;
  },
};
