/**
 * Configuration d'aide contextuelle pour createPoint
 * Workflow : sélection type de point → placement
 */

export const createPointHelpConfig = {
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
    const { currentStep, selectedTemplate } = state;

    // Étape initiale - sélection du type de point
    if (currentStep === 'start') {
      return {
        target: 'shape-selector',
        text: '📌 Choisis le type de point à créer',
      };
    }

    // Placement du point
    if (currentStep === 'drawPoint') {
      // Cas spécial : point sur intersection
      if (selectedTemplate?.name === 'PointOnIntersection') {
        return {
          target: 'canvas-container',
          text: '🎯 Clique sur le premier segment',
        };
      }
      return {
        target: 'canvas-container',
        text: '🎯 Touche l\'endroit où placer le point',
      };
    }

    // Cas point sur intersection : sélection du second segment
    if (currentStep === 'selectSecondSegment') {
      return {
        target: 'canvas-container',
        text: '🎯 Clique sur le second segment',
      };
    }

    // Ajustement de la position
    if (currentStep === 'animatePoint') {
      return {
        target: 'canvas-container',
        text: '🔄 Ajuste la position du point',
      };
    }

    return null;
  },
};
