/**
 * Configuration d'aide contextuelle pour group
 * Workflow : selection d'une premiere puis seconde figure
 */

export const groupHelpConfig = {
  steps: ['start', 'listen', 'selectSecondShape', 'fillGroup'],

  getStepConfig: (state) => {
    const { currentStep } = state;

    if (currentStep === 'start' || currentStep === 'listen') {
      return {
        target: 'canvas-container',
        text: 'Selectionne la premiere figure du groupe',
      };
    }

    if (currentStep === 'selectSecondShape') {
      return {
        target: 'canvas-container',
        text: 'Selectionne la seconde figure pour creer ou rejoindre un groupe',
      };
    }

    if (currentStep === 'fillGroup') {
      return {
        target: 'canvas-container',
        text: 'Continue a toucher des figures pour completer le groupe',
      };
    }

    return null;
  },
};
