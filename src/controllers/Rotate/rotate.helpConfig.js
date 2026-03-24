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
        text: 'Tourne la figure a l\'aide d\'un glisser autour de son centre',
      };
    }

    if (currentStep === 'rotate') {
      return {
        target: 'canvas-container',
        text: 'Glisse pour faire pivoter, puis relache pour valider',
      };
    }

    return null;
  },
};