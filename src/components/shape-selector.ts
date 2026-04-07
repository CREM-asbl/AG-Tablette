import '@components/flex-grid';
import '@components/icon-button';
import { app } from '@controllers/Core/App';
import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators/custom-element.js';
import { property } from 'lit/decorators/property.js';
import { appActions } from '../store/appState';

@customElement('shape-selector')
export class ShapeSelector extends LitElement {
  @property({ type: String }) family;
  @property({ type: String }) type;
  @property({ type: Array }) templatesNames = [];
  @property({ type: Array }) titles = [];
  @property({ type: Object }) selectedTemplate;
  @property({ type: String }) nextStep;
  @property({ type: Boolean }) helpFocused = false;
  @property({ type: String }) helpText = '';

  private toolUpdatedListener: () => void;
  private environmentLoadedListener: () => void;
  private contextualGuideFocusListener: (event: CustomEvent) => void;

  static styles = css`
    :host {
      display: grid;
      justify-content: center;
      position: absolute;
      bottom: 0;
      right: 0;
      left: 250px;
      padding: 4px;
      z-index: 10001;
    }

    .container {
      position: relative;
      background: var(--theme-color-soft);
      box-shadow: 0 1px 3px gray;
      z-index: 100;
      box-sizing: border-box;
      /* Le popover est positionne hors du conteneur, il ne doit pas etre coupe */
      overflow: visible;
      border-radius: 8px;
    }

    .container.help-highlight {
      box-shadow:
        0 0 0 3px rgba(102, 126, 234, 0.65),
        0 0 0 32px rgba(102, 126, 234, 0.22),
        0 10px 24px rgba(0, 0, 0, 0.28);
      z-index: 1460;
    }

    .help-popover {
      position: absolute;
      top: -64px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 12px;
      padding: 10px 14px;
      font-size: 0.95rem;
      font-weight: 600;
      line-height: 1.3;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
      border: 2px solid rgba(255, 255, 255, 0.28);
      white-space: nowrap;
      pointer-events: none;
      z-index: 1470;
      animation: helpPulse 1.5s ease-in-out infinite;
    }

    .help-popover::after {
      content: '';
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      bottom: -10px;
      border-width: 10px 10px 0;
      border-style: solid;
      border-color: #6d62da transparent transparent transparent;
    }

    @keyframes helpPulse {
      0%,
      100% {
        transform: translateX(-50%) scale(1);
      }
      50% {
        transform: translateX(-50%) scale(1.05);
      }
    }

    h2 {
      padding: 4px;
      margin: 0;
      text-align: center;
      font-size: 1.2rem;
    }
  `;

  updated(changedProperties) {
    if (changedProperties.has('family')) {
      this.selectedTemplate = null;
    }
  }

  render() {
    return html`
      <div class="container ${this.helpFocused ? 'help-highlight' : ''}">
        ${this.helpFocused && this.helpText
        ? html`<div class="help-popover">${this.helpText}</div>`
        : ''}
        <h2>${this.selectedTemplate?.title || this.family}</h2>
        <flex-grid>
          ${this.templatesNames.map(
          (template) =>
            html` <icon-button
                name="${template.name}"
                type="${this.type}"
                title="${template.title}"
                ?active="${this.selectedTemplate && template.name === this.selectedTemplate.name}"
                @click="${() => this._clickHandle(template)}"
              >
              </icon-button>`,
        )}
        </flex-grid>
      </div>
    `;
  }

  private updateSelectionState(template) {
    appActions.setSelectedTemplate(template);
    appActions.setCurrentStep(this.nextStep);
  }

  _clickHandle(template) {
    this.selectedTemplate = template;
    this.updateSelectionState(this.selectedTemplate);
  }

  connectedCallback() {
    super.connectedCallback();
    this.toolUpdatedListener = () => {
      const actions = [
        'create',
        'createLine',
        'createPoint',
        'createTriangle',
        'createQuadrilateral',
        'createCircle',
      ];

      // Remove if tool is not in the allowed actions
      if (!actions.includes(app.tool?.name)) {
        appActions.setToolUiState(null);
        return;
      }

      // Remove if user selected a different template (but not when both are undefined)
      if (
        app.tool.selectedTemplate !== undefined &&
        this.selectedTemplate !== app.tool.selectedTemplate
      ) {
        appActions.setToolUiState(null);
      }
    };
    window.addEventListener('tool-updated', this.toolUpdatedListener);

    this.environmentLoadedListener = () => {
      appActions.setToolUiState(null);
    };
    window.addEventListener('environment:loaded', this.environmentLoadedListener);

    this.contextualGuideFocusListener = (event: CustomEvent) => {
      const { active, target, text } = event.detail || {};
      const focused = !!active && target === 'shape-selector';
      this.helpFocused = focused;
      this.helpText = focused ? text || '' : '';
    };
    window.addEventListener(
      'contextual-guide-focus',
      this.contextualGuideFocusListener as EventListener,
    );
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('tool-updated', this.toolUpdatedListener);
    window.removeEventListener('environment:loaded', this.environmentLoadedListener);
    window.removeEventListener(
      'contextual-guide-focus',
      this.contextualGuideFocusListener as EventListener,
    );
  }
}
