/**
 * Configuration d'aide contextuelle pour rotate
 * Workflow : sélection forme -> rotation
 */

export const rotateHelpConfig = {
  steps: ['start', 'listen', 'rotate'],

  getStepConfig: (state) => {
    const { currentStep } = state;

    if (currentStep === 'start' || currentStep === 'listen') {
      return {
        target: 'canvas-container',
        text: '👆 Touche la figure à faire tourner',
      };
    }

    if (currentStep === 'rotate') {
      return {
        target: 'canvas-container',
        text: '🔄 Glisse pour faire pivoter, puis relâche pour valider',
      };
    }

    return null;
  },
};