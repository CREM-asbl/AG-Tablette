/**
 * Configuration d'aide contextuelle pour createTriangle
 * Workflow : sélection type de triangle → placement points selon contraintes
 */

export const createTriangleHelpConfig = {
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
    const { currentStep, numberOfPointsDrawn = 0, selectedTemplate } = state;

    // Étape initiale - sélection du type de triangle
    if (currentStep === 'start') {
      return {
        target: 'shape-selector',
        text: '📌 Choisis le type de triangle',
      };
    }

    // Placement des points (3 points pour un triangle)
    if (currentStep === 'drawPoint') {
      const pointLabels = [
        '🎯 Place le premier sommet',
        '🎯 Place le deuxième sommet',
        '🎯 Place le troisième sommet',
      ];
      return {
        target: 'canvas-container',
        text: pointLabels[numberOfPointsDrawn] || pointLabels[0],
      };
    }

    // Ajustement de la position
    if (currentStep === 'animatePoint') {
      const adjustLabels = [
        '🔄 Ajuste le premier sommet',
        '🔄 Ajuste le deuxième sommet',
        '🔄 Ajuste le troisième sommet',
      ];
      return {
        target: 'canvas-container',
        text: adjustLabels[numberOfPointsDrawn - 1] || adjustLabels[0],
      };
    }

    return null;
  },
};
