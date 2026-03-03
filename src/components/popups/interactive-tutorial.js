import '@components/color-button';
import '@styles/popup-variables.css';
import { css, html, LitElement } from 'lit';
import './template-popup';

/**
 * Composant Lit pour afficher des tutoriels interactifs
 * Avec stepper de navigation, images, et supports multilingues
 */
export class InteractiveTutorial extends LitElement {
  static properties = {
    toolName: String,
    tutorial: Object,
    currentLanguage: { state: true },
    currentStepIndex: { state: true },
  };

  static styles = css`
    .tutorial-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .tutorial-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }

    .progress {
      font-size: 0.9rem;
      color: #666;
      font-weight: 500;
    }

    .tutorial-media {
      width: 100%;
      max-width: 70dvw;
      max-height: 50dvh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(0, 0, 0, 0.05);
      border-radius: 4px;
      overflow: hidden;
      margin: 1rem 0;
    }

    .tutorial-media img {
      width: 100%;
      height: auto;
      object-fit: contain;
    }

    .tutorial-media video {
      width: 100%;
      height: auto;
      object-fit: contain;
    }

    .tutorial-step {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 0.5rem 0;
    }

    .step-title {
      font-size: 1.1rem;
      font-weight: 600;
      margin: 0;
    }

    .step-description {
      font-size: 0.95rem;
      line-height: 1.5;
      color: #333;
      margin: 0;
    }

    .step-tips {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 0.75rem;
      border-radius: 2px;
      font-size: 0.9rem;
    }

    .step-tips strong {
      display: block;
      margin-bottom: 0.5rem;
    }

    .step-tips ul {
      margin: 0;
      padding-left: 1.2rem;
    }

    .step-tips li {
      margin: 0.25rem 0;
    }

    .stepper {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-top: 1rem;
    }

    .stepper-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .stepper-button {
      padding: 0.5rem 1rem;
      font-size: 0.9rem;
      cursor: pointer;
      background-color: #f0f0f0;
      border: 1px solid #ccc;
      border-radius: 4px;
      transition: all 0.2s;
    }

    .stepper-button:hover:not(:disabled) {
      background-color: #e0e0e0;
    }

    .stepper-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .stepper-button.primary {
      background-color: #0078d4;
      color: white;
      border-color: #005a9e;
    }

    .stepper-button.primary:hover:not(:disabled) {
      background-color: #005a9e;
    }

    .step-indicator {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .step-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #ccc;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .step-dot.active {
      background-color: #0078d4;
      width: 10px;
      height: 10px;
    }

    .step-dot:hover {
      background-color: #999;
    }

    .media-placeholder {
      width: 100%;
      height: 300px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
      font-size: 0.95rem;
      text-align: center;
      padding: 2rem;
    }

    .tutorial-info {
      font-size: 0.9rem;
      color: #666;
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .info-badge {
      background-color: #f0f0f0;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.85rem;
    }

    :host {
      -webkit-touch-callout: text;
      -webkit-user-select: text;
      -khtml-user-select: text;
      -moz-user-select: text;
      -ms-user-select: text;
      user-select: text;
    }
  `;

  constructor() {
    super();
    this.tutorial = null;
    this.toolName = '';
    this.currentLanguage = 'fr';
    this.currentStepIndex = 0;
  }

  async firstUpdated() {
    window.addEventListener('close-popup', () => this.close());
  }

  render() {
    if (!this.tutorial || !this.tutorial.steps || this.tutorial.steps.length === 0) {
      return html`
        <template-popup>
          <h2 slot="title">Aide</h2>
          <div slot="body">Le tutoriel n'est pas disponible.</div>
          <div slot="footer">
            <color-button @click="${() => this.close()}">Fermer</color-button>
          </div>
        </template-popup>
      `;
    }

    const currentStep = this.tutorial.steps[this.currentStepIndex];
    const steps = this.tutorial.steps;
    const isFirstStep = this.currentStepIndex === 0;
    const isLastStep = this.currentStepIndex === steps.length - 1;

    return html`
      <template-popup>
        <h2 slot="title">${this.getLocalizedText(this.tutorial.metadata.title)}</h2>

        <div slot="body" class="tutorial-container">
          <!-- Header avec progression -->
          <div class="tutorial-header">
            <div class="progress">
              Étape ${this.currentStepIndex + 1} / ${steps.length}
            </div>
            ${this.tutorial.metadata.estimatedTime ? html`
              <div class="info-badge">
                ⏱ ~${Math.round(this.tutorial.metadata.estimatedTime / 60)}s
              </div>
            ` : ''}
          </div>

          <!-- Contenu de l'étape -->
          <div class="tutorial-step">
            <h3 class="step-title">${this.getLocalizedText(currentStep.title)}</h3>

            ${currentStep.description ? html`
              <p class="step-description">${this.getLocalizedText(currentStep.description)}</p>
            ` : ''}

            ${currentStep.media ? this.renderMedia(currentStep.media) : ''}

            ${currentStep.tips && currentStep.tips[this.currentLanguage] ? html`
              <div class="step-tips">
                <strong>💡 Conseils utiles</strong>
                <ul>
                  ${currentStep.tips[this.currentLanguage].map(tip => html`
                    <li>${tip}</li>
                  `)}
                </ul>
              </div>
            ` : ''}
          </div>

          <!-- Indicateurs d'étape -->
          <div class="step-indicator">
            ${steps.map((_, index) => html`
              <div
                class="step-dot ${index === this.currentStepIndex ? 'active' : ''}"
                @click="${() => this.goToStep(index)}"
                title="Étape ${index + 1}"
              ></div>
            `)}
          </div>
        </div>

        <!-- Stepper navigation -->
        <div slot="footer" class="stepper">
          <div class="stepper-buttons">
            <button
              class="stepper-button"
              @click="${() => this.previousStep()}"
              ?disabled="${isFirstStep}"
            >
              ← Précédent
            </button>
            <button
              class="stepper-button primary"
              @click="${() => this.nextStep()}"
              ?disabled="${isLastStep}"
            >
              Suivant →
            </button>
          </div>
          <color-button @click="${() => this.close()}">Fermer</color-button>
        </div>
      </template-popup>
    `;
  }

  /**
   * Afficher le media (image ou vidéo) de l'étape
   * @private
   */
  renderMedia(media) {
    if (media.image) {
      const alt = media.alt ? this.getLocalizedText(media.alt) : 'Étape du tutoriel';
      return html`
        <div class="tutorial-media">
          <img src="${media.image}" alt="${alt}" loading="lazy" />
        </div>
      `;
    }

    if (media.video) {
      return html`
        <div class="tutorial-media">
          <video controls>
            <source src="${media.video}" type="video/webm" />
            Votre navigateur ne supporte pas les vidéos HTML5.
          </video>
        </div>
      `;
    }

    return html`
      <div class="media-placeholder">
        Pas de média disponible pour cette étape
      </div>
    `;
  }

  /**
   * Obtenir un texte localisé
   * @private
   */
  getLocalizedText(textObj) {
    if (typeof textObj === 'string') {
      return textObj;
    }

    // Essayer la langue actuellement sélectionnée
    if (textObj[this.currentLanguage]) {
      return textObj[this.currentLanguage];
    }

    // Fallback: français
    if (textObj.fr) {
      return textObj.fr;
    }

    // Fallback: première langue disponible
    const keys = Object.keys(textObj);
    return keys.length > 0 ? textObj[keys[0]] : '';
  }

  /**
   * Aller à l'étape suivante
   */
  nextStep() {
    if (this.currentStepIndex < this.tutorial.steps.length - 1) {
      this.currentStepIndex++;
      this.requestUpdate();
    }
  }

  /**
   * Aller à l'étape précédente
   */
  previousStep() {
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      this.requestUpdate();
    }
  }

  /**
   * Aller à une étape spécifique
   */
  goToStep(index) {
    if (index >= 0 && index < this.tutorial.steps.length) {
      this.currentStepIndex = index;
      this.requestUpdate();
    }
  }

  /**
   * Définir la langue du tutoriel
   */
  setLanguage(lang) {
    if (['fr', 'nl', 'en'].includes(lang)) {
      this.currentLanguage = lang;
      this.requestUpdate();
    }
  }

  /**
   * Fermer le tutoriel
   */
  close() {
    this.remove();
  }
}

customElements.define('interactive-tutorial', InteractiveTutorial);
