/**
 * Configuration d'aide contextuelle pour centralSymetry
 */

export const centralSymetryHelpConfig = {
  steps: [
    'start',
    'selectCharacteristicElement',
    'animateCharacteristicElement',
    'selectObject',
    'central',
  ],

  getStepConfig: (state) => {
    const { currentStep } = state;

    if (currentStep === 'start' || currentStep === 'selectCharacteristicElement') {
      return {
        target: 'canvas-container',
        text: 'Selectionne le centre de symetrie',
      };
    }

    if (currentStep === 'animateCharacteristicElement') {
      return {
        target: 'canvas-container',
        text: 'Ajuste le centre puis relache',
      };
    }

    if (currentStep === 'selectObject') {
      return {
        target: 'canvas-container',
        text: 'Selectionne l\'objet a symetriser',
      };
    }

    if (currentStep === 'central') {
      return {
        target: 'canvas-container',
        text: 'Symetrie centrale en cours',
      };
    }

    return null;
  },
};
