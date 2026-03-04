/**
 * Configuration d'aide contextuelle pour ungroup
 * Workflow : selection d'une figure appartenant a un groupe
 */

export const ungroupHelpConfig = {
  steps: ['start', 'listen'],

  getStepConfig: (state) => {
    const { currentStep } = state;

    if (currentStep === 'start' || currentStep === 'listen') {
      return {
        target: 'canvas-container',
        text: 'Choisis une figure du groupe a supprimer',
      };
    }

    return null;
  },
};
