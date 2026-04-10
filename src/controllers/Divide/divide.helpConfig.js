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
        text: '⚙️ Choisis le nombre de parties pour la division',
      };
    }

    if (currentStep === 'selectObject') {
      return {
        target: 'canvas-container',
        text: '🎯 Choisis le segment ou le premier point à diviser',
      };
    }

    if (currentStep === 'selectSecondPoint') {
      return {
        target: 'canvas-container',
        text: '🎯 Choisis le deuxième point sur le même segment',
      };
    }

    if (currentStep === 'chooseArcDirection') {
      return {
        target: 'canvas-container',
        text: '🔃 Clique à l’intérieur ou l’extérieur pour choisir le sens de la division',
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
