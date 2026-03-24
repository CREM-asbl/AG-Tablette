/**
 * Configuration d'aide contextuelle pour divide
 * Workflow : choix des parties -> selection segment/points -> division
 */

export const divideHelpConfig = {
  steps: [
    'start',
    'selectObject',
    'selectSecondPoint',
    'chooseArcDirection',
    'divide',
  ],

  getStepConfig: (state) => {
    const { currentStep } = state;

    if (currentStep === 'start') {
      return {
        target: 'divide-popup',
        text: 'Choisis en combien de parties diviser',
      };
    }

    if (currentStep === 'selectObject') {
      return {
        target: 'canvas-container',
        text: 'Selectionne un segment ou un premier point',
      };
    }

    if (currentStep === 'selectSecondPoint') {
      return {
        target: 'canvas-container',
        text: 'Selectionne le second point sur le meme segment',
      };
    }

    if (currentStep === 'chooseArcDirection') {
      return {
        target: 'canvas-container',
        text: 'Choisis le sens de division sur l\'arc',
      };
    }

    if (currentStep === 'divide') {
      return {
        target: 'canvas-container',
        text: 'Division en cours',
      };
    }

    return null;
  },
};
