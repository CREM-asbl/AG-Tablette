/**
 * Configuration d'aide contextuelle pour createIrregularPolygon
 * Workflow : placer des points successifs puis fermer le polygone
 */

export const createIrregularHelpConfig = {
  steps: [
    'start',
    'drawPoint',
    'animatePoint',
  ],

  /**
   * Détermine quelle aide afficher selon l'état courant du tool
   * @param {object} state - État courant du tool
   * @returns {{target: string, text: string} | null}
   */
  getStepConfig: (state) => {
    const { currentStep, numberOfPointsDrawn = 0 } = state;

    if (currentStep === 'start') {
      return {
        target: 'canvas-container',
        text: '🎯 Place le 1er point du polygone',
      };
    }

    if (currentStep === 'drawPoint') {
      if (numberOfPointsDrawn <= 0) {
        return {
          target: 'canvas-container',
          text: '🎯 Place le 1er point du polygone',
        };
      }
      return {
        target: 'canvas-container',
        text: `🎯 Place le ${numberOfPointsDrawn + 1}e point`,
      };
    }

    if (currentStep === 'animatePoint') {
      if (numberOfPointsDrawn >= 3) {
        return {
          target: 'canvas-container',
          text: '✅ Reviens près du 1er point pour fermer le polygone',
        };
      }
      return {
        target: 'canvas-container',
        text: '🔄 Ajuste la position du point',
      };
    }

    return null;
  },
};
