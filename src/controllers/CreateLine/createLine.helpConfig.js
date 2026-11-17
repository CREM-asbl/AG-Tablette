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
    const { currentStep, numberOfPointsDrawn = 0, selectedTemplate } = state;

    // Étape initiale - sélection du type de ligne
    if (currentStep === 'start') {
      return {
        target: 'shape-selector',
        text: '📌 Choisis le type de ligne',
      };
    }

    // Étapes de placement des points
    if (currentStep === 'drawPoint') {
      const templateName = selectedTemplate?.name;

      if (templateName?.startsWith('Parallele') || templateName?.startsWith('Perpendicular')) {
        const pointLabels = [
          '🎯 Place le point par lequel passe la ligne',
          '🎯 Place le deuxième point sur la ligne verte',
        ];
        return {
          target: 'canvas-container',
          text: pointLabels[numberOfPointsDrawn] || pointLabels[0],
        };
      }

      const pointLabels = [
        '🎯 Place le 1er point',
        '🎯 Place le 2e point',
      ];
      return {
        target: 'canvas-container',
        text: pointLabels[numberOfPointsDrawn] || pointLabels[0],
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
        text: adjustLabels[numberOfPointsDrawn - 1] || adjustLabels[0],
      };
    }

    return null;
  },
};
