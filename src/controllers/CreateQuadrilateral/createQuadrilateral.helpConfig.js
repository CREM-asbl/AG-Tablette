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
    const { currentStep, numberOfPointsDrawn = 0, selectedTemplate } = state;

    // Étape initiale - sélection du type de quadrilatère
    if (currentStep === 'start' || currentStep === 'initialized') {
      return {
        target: 'shape-selector',
        text: '📌 Choisis une forme de quadrilatère',
      };
    }

    // Étapes de placement des points
    if (currentStep === 'drawPoint') {
      const templateName = selectedTemplate?.name;

      if (templateName === 'Rectangle' && numberOfPointsDrawn === 2) {
        return {
          target: 'canvas-container',
          text: '🎯 Place le 3e sommet sur la ligne verte',
        };
      }

      if (templateName === 'Losange' && numberOfPointsDrawn === 2) {
        return {
          target: 'canvas-container',
          text: '🎯 Place le 3e sommet sur le cercle vert',
        };
      }

      if (templateName === 'RightAngleTrapeze') {
        if (numberOfPointsDrawn === 2 || numberOfPointsDrawn === 3) {
          return {
            target: 'canvas-container',
            text: `🎯 Place le ${numberOfPointsDrawn + 1}e sommet sur la ligne verte`,
          };
        }
      }

      if (templateName === 'Trapeze' && numberOfPointsDrawn === 3) {
        return {
          target: 'canvas-container',
          text: '🎯 Place le 4e sommet sur la ligne verte',
        };
      }

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
