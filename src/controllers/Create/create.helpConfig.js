/**
 * Configuration d'aide contextuelle pour create
 */

export const createHelpConfig = {
  steps: ['start', 'listen', 'move'],

  getStepConfig: (state) => {
    const { currentStep } = state;

    if (currentStep === 'start') {
      return {
        target: 'shape-selector',
        text: 'Choisis une famille puis une forme a creer',
      };
    }

    if (currentStep === 'listen') {
      return {
        target: 'canvas-container',
        text: 'Clique dans la zone de dessin pour placer la nouvelle forme',
      };
    }

    if (currentStep === 'move') {
      return {
        target: 'canvas-container',
        text: 'Glisse pour ajuster la position, puis relache',
      };
    }

    return null;
  },
};
