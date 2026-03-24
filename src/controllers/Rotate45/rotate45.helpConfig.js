/**
 * Configuration d'aide contextuelle pour rotate45
 * Workflow : selection d'une figure puis rotation instantanee
 */

export const rotate45HelpConfig = {
  steps: ['start', 'listen'],

  getStepConfig: (state) => {
    const { currentStep } = state;

    if (currentStep === 'start' || currentStep === 'listen') {
      return {
        target: 'canvas-container',
        text: 'Selectionne une figure pour la tourner de 45 degres',
      };
    }

    return null;
  },
};
