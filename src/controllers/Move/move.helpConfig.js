/**
 * Configuration d'aide contextuelle pour move
 * Workflow : sélection forme → déplacement
 */

export const moveHelpConfig = {
  steps: [
    'start',
    'listen',
    'move',
  ],

  /**
   * Détermine quelle aide afficher selon l'état courant du tool
   * @param {object} state - État courant du tool
   * @returns {{target: string, text: string} | null}
   */
  getStepConfig: (state) => {
    const { currentStep } = state;

    // Attente de sélection d'une forme
    if (currentStep === 'listen' || currentStep === 'start') {
      return {
        target: 'canvas-container',
        text: '👆 Touche la forme à déplacer',
      };
    }

    // Déplacement en cours
    if (currentStep === 'move') {
      return {
        target: 'canvas-container',
        text: '↔️ Glisse pour déplacer, puis relâche',
      };
    }

    return null;
  },
};
