/**
 * Configuration d'aide contextuelle pour orthogonalSymetry
 */

export const orthogonalSymetryHelpConfig = {
  steps: [
    'start',
    'selectFirstReference',
    'selectReference',
    'animateFirstRefPoint',
    'animateSecondRefPoint',
    'selectObject',
    'ortho',
  ],

  getStepConfig: (state) => {
    const { currentStep } = state;

    if (currentStep === 'start' || currentStep === 'selectFirstReference') {
      return {
        target: 'canvas-container',
        text: 'Definis l\'axe de symetrie (2 points ou une droite)',
      };
    }

    if (currentStep === 'selectReference') {
      return {
        target: 'canvas-container',
        text: 'Selectionne le second point de l\'axe',
      };
    }

    if (currentStep === 'animateFirstRefPoint' || currentStep === 'animateSecondRefPoint') {
      return {
        target: 'canvas-container',
        text: 'Ajuste la reference puis relache',
      };
    }

    if (currentStep === 'selectObject') {
      return {
        target: 'canvas-container',
        text: 'Selectionne l\'objet a refleter',
      };
    }

    if (currentStep === 'ortho') {
      return {
        target: 'canvas-container',
        text: 'Symetrie orthogonale en cours',
      };
    }

    return null;
  },
};
