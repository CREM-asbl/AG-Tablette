/**
 * Configuration d'aide contextuelle pour hide
 * Workflow : selection d'un objet a cacher
 */

export const hideHelpConfig = {
  steps: ['start', 'listen'],

  getStepConfig: (state) => {
    const { currentStep } = state;

    if (currentStep === 'start' || currentStep === 'listen') {
      return {
        target: 'canvas-container',
        text: 'Selectionne un objet pour le masquer',
      };
    }

    return null;
  },
};
