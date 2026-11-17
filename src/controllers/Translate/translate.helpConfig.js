/**
 * Configuration d'aide contextuelle pour translate
 * Workflow : appui puis glissement du plan
 */

export const translateHelpConfig = {
  steps: ['start', 'listen', 'translate'],

  getStepConfig: (state) => {
    const { currentStep } = state;

    if (currentStep === 'start' || currentStep === 'listen') {
      return {
        target: 'canvas-container',
        text: 'Appuie dans la zone de dessin pour deplacer le plan',
      };
    }

    if (currentStep === 'translate') {
      return {
        target: 'canvas-container',
        text: 'Glisse pour translater le plan, puis relache',
      };
    }

    return null;
  },
};
