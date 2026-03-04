/**
 * Configuration d'aide contextuelle pour delete
 * Workflow : selection de l'objet a supprimer
 */

export const deleteHelpConfig = {
  steps: ['start', 'listen'],

  getStepConfig: (state) => {
    const { currentStep } = state;

    if (currentStep === 'start' || currentStep === 'listen') {
      return {
        target: 'canvas-container',
        text: 'Touche une figure ou un point de division pour supprimer',
      };
    }

    return null;
  },
};
