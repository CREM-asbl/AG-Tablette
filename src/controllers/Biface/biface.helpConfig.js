/**
 * Configuration d'aide contextuelle pour biface
 */

export const bifaceHelpConfig = {
  steps: ['start', 'listen'],

  getStepConfig: (state) => {
    const { currentStep } = state;

    if (currentStep === 'start' || currentStep === 'listen') {
      return {
        target: 'canvas-container',
        text: 'Selectionne une figure pour activer ou retirer le mode biface',
      };
    }

    return null;
  },
};
