/**
 * Configuration d'aide contextuelle pour scalarMultiplication
 */

export const scalarMultiplicationHelpConfig = {
  steps: ['start', 'selectObject'],

  getStepConfig: (state) => {
    const { currentStep } = state;

    if (currentStep === 'start') {
      return {
        target: 'scalar-popup',
        text: 'Choisis le numerateur et le denominateur',
      };
    }

    if (currentStep === 'selectObject') {
      return {
        target: 'canvas-container',
        text: 'Selectionne un vecteur a multiplier',
      };
    }

    return null;
  },
};
