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
        text: 'Definis le vecteur de translation',
      };
    }

    if (currentStep === 'selectReference') {
      return {
        target: 'canvas-container',
        text: 'Selectionne le second point de reference',
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
