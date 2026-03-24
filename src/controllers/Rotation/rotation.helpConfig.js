/**
 * Configuration d'aide contextuelle pour rotation
 * Workflow : references -> direction -> objet -> animation
 */

export const rotationHelpConfig = {
  steps: [
    'start',
    'selectFirstReference',
    'selectReference',
    'animateRefPoint',
    'selectDirection',
    'selectObject',
    'rot',
  ],

  getStepConfig: (state) => {
    const { currentStep } = state;

    if (currentStep === 'start' || currentStep === 'selectFirstReference') {
      return {
        target: 'canvas-container',
        text: 'Sélectionne le centre de rotation ou le centre (d\'une rotation précédente)',
      };
    }

    if (currentStep === 'selectReference') {
      return {
        target: 'canvas-container',
        text: 'Sélectionne l\'angle (point, arc ou secteur) ou l\'angle (d\'une rotation précédente)',
      };
    }

    if (currentStep === 'animateRefPoint') {
      return {
        target: 'canvas-container',
        text: 'Ajuste le point de reference puis relache',
      };
    }

    if (currentStep === 'selectDirection') {
      return {
        target: 'canvas-container',
        text: 'Choisis le sens de rotation',
      };
    }

    if (currentStep === 'selectObject') {
      return {
        target: 'canvas-container',
        text: 'Selectionne l\'objet a faire tourner',
      };
    }

    if (currentStep === 'rot') {
      return {
        target: 'canvas-container',
        text: 'Rotation en cours',
      };
    }

    return null;
  },
};