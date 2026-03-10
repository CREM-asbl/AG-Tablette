import { helpConfigRegistry } from '@services/HelpConfigRegistry';
import '@styles/popup-variables.css';
import { css, html, LitElement } from 'lit';

/**
 * Contrôleur de guidage contextuel générique
 * État machine pour progression d'aide contextualisée
 * Architecture événementielle : broadcast 'contextual-guide-focus' vers composants UI
 */
class ContextualGuideController extends LitElement {
  static properties = {
    toolname: String,
    currentStep: { state: true },
    stepData: { state: true },
    isVisible: { state: true },
    isComplete: { state: true },
  };

  static styles = css`
    :host {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 1600;
    }

    :host([hidden]) {
      display: none;
    }
  `;

  constructor() {
    super();
    this.toolname = '';
    this.currentStep = null;
    this.stepData = {};
    this.isVisible = false;
    this.isComplete = false;
    this.updateLoop = null;
    this.handleActionComplete = null;
  }

  connectedCallback() {
    super.connectedCallback();
    if (!this.toolname) {
      // Tenter de récupérer depuis app global
      this.toolname = window.app?.tool?.name || '';
    }
    this.startToolListener();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.cleanup();
  }

  startToolListener() {
    if (!this.toolname) {
      console.warn('[ContextualGuideController] toolname manquant');
      return;
    }

    // Vérifier que cet outil a une config d'aide
    if (!helpConfigRegistry.has(this.toolname)) {
      console.warn(`[ContextualGuideController] Pas de config d'aide pour ${this.toolname}`);
      this.close();
      return;
    }

    // Boucle de polling pour état du tool
    this.updateLoop = setInterval(() => {
      const currentApp = window.app;
      
      // Auto-fermeture si l'outil change ou n'existe plus
      if (!currentApp?.tool || currentApp.tool.name !== this.toolname) {
        this.close();
        return;
      }

      const newStep = currentApp.tool.currentStep || 'start';
      const pointCount =
        currentApp.tool.numberOfPointsDrawn ??
        currentApp.tool.points?.length ??
        0;
      const stateData = {
        numberOfPointsDrawn: pointCount,
        pointCount,
        selectedTemplate: currentApp.tool.selectedTemplate || null,
      };

      if (newStep !== this.currentStep || JSON.stringify(stateData) !== JSON.stringify(this.stepData)) {
        this.currentStep = newStep;
        this.stepData = { ...stateData };
        this.updateGuide();
      }
    }, 100);

    // Feedback visuel temporaire après complétion d'une action
    this.handleActionComplete = () => {
      this.isComplete = true;
      this.updateGuide();
      
      // Réinitialiser le flag de complétion après 1,5s pour permettre la suite du guidage
      setTimeout(() => {
        if (this.updateLoop) { // Vérifier si le guide n'a pas été fermé entre temps
          this.isComplete = false;
          this.updateGuide();
        }
      }, 1500);
    };
    window.addEventListener('actions-executed', this.handleActionComplete);
  }

  updateGuide() {
    const config = helpConfigRegistry.get(this.toolname);
    if (!config) {
      this.broadcastFocus({ active: false });
      this.isVisible = false;
      this.requestUpdate();
      return;
    }

    const stepConfig = config.getStepConfig({
      currentStep: this.currentStep,
      ...this.stepData,
    });

    if (!stepConfig) {
      this.broadcastFocus({ active: false });
      this.isVisible = false;
      this.requestUpdate();
      return;
    }

    this.broadcastFocus({
      active: true,
      target: stepConfig.target,
      text: stepConfig.text,
      isComplete: this.isComplete,
    });
    this.isVisible = true;
    this.requestUpdate();
  }

  broadcastFocus(detail) {
    window.dispatchEvent(
      new CustomEvent('contextual-guide-focus', { detail }),
    );
  }

  close() {
    this.cleanup();
    this.remove();
  }

  cleanup() {
    if (this.updateLoop) {
      clearInterval(this.updateLoop);
      this.updateLoop = null;
    }
    if (this.handleActionComplete) {
      window.removeEventListener('actions-executed', this.handleActionComplete);
      this.handleActionComplete = null;
    }
    this.broadcastFocus({ active: false });
  }

  render() {
    if (!this.isVisible) {
      return html``;
    }

    return html``;
  }
}

customElements.define('contextual-guide', ContextualGuideController);
export { ContextualGuideController };

