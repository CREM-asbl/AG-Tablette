/**
 * Configuration d'aide contextuelle pour createQuadrilateral
 * Chaque étape spécifie quel composant doit afficher aide et texte
 */

export const createQuadrilateralHelpConfig = {
  // Liste des étapes en ordre
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

    // Étape initiale - sélection du type de quadrilatère
    if (currentStep === 'start') {
      return {
        target: 'shape-selector',
        text: '📌 Choisis une forme de quadrilatère',
      };
    }

    // Étapes de placement des points
    if (currentStep === 'drawPoint') {
      const pointLabels = [
        '🎯 Place le 1er point',
        '🎯 Place le 2e point',
        '🎯 Place le 3e point',
        '🎯 Place le 4e point',
      ];
      return {
        target: 'canvas-container',
        text: pointLabels[numberOfPointsDrawn] || pointLabels[0],
      };
    }

    // Étapes d'ajustement des points
    if (currentStep === 'animatePoint') {
      const adjustLabels = [
        '🔄 Ajuste le 1er point',
        '🔄 Ajuste le 2e point',
        '🔄 Ajuste le 3e point',
        '🔄 Ajuste le 4e point',
      ];
      return {
        target: 'canvas-container',
        text: adjustLabels[numberOfPointsDrawn - 1] || adjustLabels[0],
      };
    }

    return null;
  },
};
