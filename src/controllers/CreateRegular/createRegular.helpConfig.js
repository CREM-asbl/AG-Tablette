/**
 * Configuration d'aide contextuelle pour createRegularPolygon
 * Workflow : régler le nombre de côtés puis placer 2 points
 */

export const createRegularHelpConfig = {
  steps: [
    'start',
    'drawFirstPoint',
    'animateFirstPoint',
    'drawSecondPoint',
    'animateSecondPoint',
  ],

  /**
   * Détermine quelle aide afficher selon l'état courant du tool
   * @param {object} state - État courant du tool
   * @returns {{target: string, text: string} | null}
   */
  getStepConfig: (state) => {
    const { currentStep } = state;

    if (currentStep === 'start') {
      return {
        target: 'canvas-container',
        text: '⚙️ Choisis le nombre de côtés puis valide avec OK',
      };
    }

    if (currentStep === 'drawFirstPoint') {
      return {
        target: 'canvas-container',
        text: '🎯 Place le premier point du polygone',
      };
    }

    if (currentStep === 'animateFirstPoint') {
      return {
        target: 'canvas-container',
        text: '🔄 Ajuste le centre',
      };
    }

    if (currentStep === 'drawSecondPoint') {
      return {
        target: 'canvas-container',
        text: '🎯 Place un point pour définir la taille',
      };
    }

    if (currentStep === 'animateSecondPoint') {
      return {
        target: 'canvas-container',
        text: '🔄 Ajuste la taille du polygone',
      };
    }

    return null;
  },
};
