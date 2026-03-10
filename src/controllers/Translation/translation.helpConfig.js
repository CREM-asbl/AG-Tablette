/**
 * Configuration d'aide contextuelle pour translation
 */

export const translationHelpConfig = {
  steps: [
    'start',
    'selectFirstReference',
    'selectReference',
    'animateFirstRefPoint',
    'animateSecondRefPoint',
    'selectObject',
    'trans',
  ],

  getStepConfig: (state) => {
    const { currentStep } = state;

    if (currentStep === 'start' || currentStep === 'selectFirstReference') {
      return {
        target: 'canvas-container',
        text: 'Sélectionne (place) le premier point du vecteur, un segment ou un vecteur (d\'une translation précédente)',
      };
    }

    if (currentStep === 'selectReference') {
      if (state.numberOfPointsDrawn === 1) {
        return {
          target: 'canvas-container',
          text: 'Sélectionne (place) le second point du vecteur',
        };
      }
      return {
        target: 'canvas-container',
        text: 'Sélectionne (place) le premier point du vecteur, un segment ou un vecteur',
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
        text: 'Selectionne l\'objet a translater',
      };
    }

    if (currentStep === 'trans') {
      return {
        target: 'canvas-container',
        text: 'Translation en cours',
      };
    }

    return null;
  },
};
