/**
 * Configuration d'aide contextuelle pour show
 * Workflow : selection d'un objet cache a montrer
 */

export const showHelpConfig = {
  steps: ['start', 'listen'],

  getStepConfig: (state) => {
    const { currentStep } = state;

    if (currentStep === 'start' || currentStep === 'listen') {
      return {
        target: 'canvas-container',
        text: 'Selectionne un objet cache pour le rendre visible',
      };
    }

    return null;
  },
};
