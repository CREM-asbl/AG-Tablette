/**
 * Configuration d'aide contextuelle pour createCircle
 * Workflow : sélection type de création → placement points selon mode
 */

export const createCircleHelpConfig = {
  steps: [
    'start',
    'drawPoint',
  ],

  /**
   * Détermine quelle aide afficher selon l'état courant du tool
   * @param {object} state - État courant du tool
   * @returns {{target: string, text: string} | null}
   */
  getStepConfig: (state) => {
    const { currentStep, numberOfPointsDrawn = 0 } = state;

    // Étape initiale - sélection du mode de création de cercle
    if (currentStep === 'start') {
      return {
        target: 'shape-selector',
        text: '📌 Choisis comment créer le cercle',
      };
    }

    // Étapes de placement des points (varie selon le mode)
    if (currentStep === 'drawPoint') {
      const pointLabels = [
        '🎯 Place le centre du cercle',
        '🎯 Place un point sur le cercle',
        '🎯 Place le 3e point',
      ];
      return {
        target: 'canvas-container',
        text: pointLabels[numberOfPointsDrawn] || pointLabels[0],
      };
    }

    // Ajustement des points
    if (currentStep === 'animatePoint') {
      const adjustLabels = [
        '🔄 Ajuste le centre',
        '🔄 Ajuste le rayon',
        '🔄 Ajuste la position',
      ];
      return {
        target: 'canvas-container',
        text: adjustLabels[numberOfPointsDrawn] || adjustLabels[0],
      };
    }

    return null;
  },
};
