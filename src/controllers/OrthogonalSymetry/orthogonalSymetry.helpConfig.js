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
        text: 'Sélectionne (place) le premier point de l\'axe, une droite ou un axe (d\'une symétrie précédente)',
      };
    }

    if (currentStep === 'selectReference') {
      if (state.numberOfPointsDrawn === 1) {
        return {
          target: 'canvas-container',
          text: 'Sélectionne (place) le second point de l\'axe',
        };
      }
      return {
        target: 'canvas-container',
        text: 'Sélectionne (place) le premier point de l\'axe, une droite ou un axe (d\'une symétrie précédente)',
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
