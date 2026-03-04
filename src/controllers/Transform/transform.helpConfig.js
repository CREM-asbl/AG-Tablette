/**
 * Configuration d'aide contextuelle pour transform
 * Workflow : selection d'un point -> transformation
 */

export const transformHelpConfig = {
  steps: ['start', 'selectPoint', 'transform'],

  getStepConfig: (state) => {
    const { currentStep } = state;

    if (currentStep === 'start' || currentStep === 'selectPoint') {
      return {
        target: 'canvas-container',
        text: 'Selectionne un point de la figure a modifier',
      };
    }

    if (currentStep === 'transform') {
      return {
        target: 'canvas-container',
        text: 'Glisse pour transformer, puis relache pour appliquer',
      };
    }

    return null;
  },
};
