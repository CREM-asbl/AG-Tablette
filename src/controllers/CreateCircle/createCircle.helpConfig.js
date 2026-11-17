/**
 * Configuration d'aide contextuelle pour createCircle
 * Workflow : sélection type de création → placement points selon mode
 */

export const createCircleHelpConfig = {
  steps: [
    'start',
    'drawPoint',
    'showArrow',
  ],

  /**
   * Détermine quelle aide afficher selon l'état courant du tool
   * @param {object} state - État courant du tool
   * @returns {{target: string, text: string} | null}
   */
  getStepConfig: (state) => {
    const { currentStep, numberOfPointsDrawn = 0, selectedTemplate } = state;

    // Étape initiale - sélection du mode de création de cercle
    if (currentStep === 'start') {
      return {
        target: 'shape-selector',
        text: '📌 Choisis comment créer le cercle ou l’arc',
      };
    }

    // Étapes de placement des points (varie selon le mode)
    if (currentStep === 'drawPoint') {
      const templateName = selectedTemplate?.name;

      if (templateName === 'Circle') {
        const labels = [
          '🎯 Place le centre du cercle',
          '🎯 Place un point pour définir le rayon',
        ];
        return {
          target: 'canvas-container',
          text: labels[numberOfPointsDrawn] || labels[0],
        };
      }

      if (templateName === 'CirclePart' || templateName === 'CircleArc') {
        const labels = [
          '🎯 Place le centre de l’arc',
          '🎯 Place le premier sommet de l’arc',
          '🎯 Place le deuxième sommet sur le cercle vert',
        ];
        return {
          target: 'canvas-container',
          text: labels[numberOfPointsDrawn] || labels[0],
        };
      }

      const pointLabels = [
        '🎯 Place le premier point',
        '🎯 Place le deuxième point',
        '🎯 Place le troisième point',
      ];
      return {
        target: 'canvas-container',
        text: pointLabels[numberOfPointsDrawn] || pointLabels[0],
      };
    }

    // Choix de la direction pour les arcs
    if (currentStep === 'showArrow') {
      return {
        target: 'canvas-container',
        text: '🔃 Clique à l’intérieur ou l’extérieur pour choisir le sens de l’arc',
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
        text: adjustLabels[numberOfPointsDrawn - 1] || adjustLabels[0],
      };
    }

    return null;
  },
};
