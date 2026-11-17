/**
 * Configuration d'aide contextuelle pour opacity
 */

export const opacityHelpConfig = {
  steps: ['start', 'selectObject'],

  getStepConfig: (state) => {
    const { currentStep } = state;

    if (currentStep === 'start') {
      return {
        target: 'opacity-popup',
        text: 'Choisis le niveau d\'opacite',
      };
    }

    if (currentStep === 'selectObject') {
      return {
        target: 'canvas-container',
        text: 'Selectionne une figure pour appliquer l\'opacite',
      };
    }

    return null;
  },
};
