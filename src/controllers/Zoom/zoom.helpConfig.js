/**
 * Configuration d'aide contextuelle pour zoom
 * Workflow : pincement tactile ou molette
 */

export const zoomHelpConfig = {
  steps: ['start'],

  getStepConfig: (state) => {
    const { mode, currentStep } = state;

    if (mode === 'touch' || currentStep === 'start') {
      return {
        target: 'canvas-container',
        text: 'Pince avec deux doigts pour zoomer ou dezoomer',
      };
    }

    if (mode === 'wheel') {
      return {
        target: 'canvas-container',
        text: 'Utilise la molette pour ajuster le zoom',
      };
    }

    return {
      target: 'canvas-container',
      text: 'Utilise le geste de zoom pour ajuster la vue',
    };
  },
};