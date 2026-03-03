/**
 * Configuration d'aide contextuelle pour createLine
 * Workflow : sélection type de ligne → placement 2 points
 */

export const createLineHelpConfig = {
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
    const { currentStep, pointCount = 0 } = state;

    // Étape initiale - sélection du type de ligne
    if (currentStep === 'start') {
      return {
        target: 'shape-selector',
        text: '📌 Choisis le type de ligne',
      };
    }

    // Étapes de placement des points
    if (currentStep === 'drawPoint') {
      const pointLabels = [
        '🎯 Place le 1er point',
        '🎯 Place le 2e point',
      ];
      return {
        target: 'canvas-container',
        text: pointLabels[pointCount] || pointLabels[0],
      };
    }

    // Ajustement des points
    if (currentStep === 'animatePoint') {
      const adjustLabels = [
        '🔄 Ajuste le 1er point',
        '🔄 Ajuste le 2e point',
      ];
      return {
        target: 'canvas-container',
        text: adjustLabels[pointCount] || adjustLabels[0],
      };
    }

    return null;
  },
};
