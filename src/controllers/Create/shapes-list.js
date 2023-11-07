import '@components/flex-grid';
import { css, html, LitElement } from 'lit';
import { app, setState } from '../Core/App';

class ShapesList extends LitElement {
  static get properties() {
    return {
      selectedFamily: { type: String },
      templateNames: { type: Array },
      selectedTemplate: { type: String },
    };
  }

  constructor() {
    super();

    this.updateProperties = () => {
      this.selectedFamily = app.tool.selectedFamily;
      this.templateNames = app.environment.getFamily(
        app.tool.selectedFamily,
      ).templateNames;
      this.selectedTemplate = app.tool.selectedTemplate;
      this.iconSize = app.menuIconSize;
    };
    this.updateProperties();

    this.eventHandler = () => {
      if (app.tool?.name == 'create') this.updateProperties();
      else this.close();
    };
    this.close = () => {
      this.remove();
      window.removeEventListener('tool-updated', this.eventHandler);
    };

    window.addEventListener('tool-updated', this.eventHandler);
    window.addEventListener('menuIconSize-changed', this.eventHandler);
  }

  static styles = css`
      :host {
        display: flex;
        justify-content: center;
        position: absolute;
        bottom: 0;
      }

      .container {
        background: var(--theme-color-soft);
        box-shadow: 0 1px 3px gray;
        z-index: 100;
        box-sizing: border-box;
        overflow: auto;
        border-radius: 7px;
        margin-bottom: 3px;
      }

      h2 {
        padding: 4px 4px 0px 4px;
        margin: 0;
        text-align: center;
        font-size: 1.2rem;
      }

      @media (max-width: 600px) {
        :host {
          right: 0;
          left: auto;
        }
      }
    `;

  render() {
    return html`
      <style>
        :host {
          left: calc(
            50% + (${app.settings.mainMenuWidth}px / 2) -
              (${this.templateNames.length} / 2 * 54px)
          );
        }
      </style>
      <div class="container">
        <h2>
          ${this.selectedTemplate
        ? this.selectedTemplate.replace(/ \d+$/, '')
        : this.selectedFamily}
        </h2>
        <flex-grid>
          ${this.templateNames.map(
          (templateName) => {
            return html`
              <icon-button
                style="width: ${this.iconSize}px; height: ${this.iconSize}px;"
                name="${templateName}"
                type="Create"
                title="${templateName}"
                ?active="${templateName === this.selectedTemplate}"
                @click="${this._clickHandle}"
              >
              </icon-button>
            `},
        )}
        </flex-grid>
      </div>
    `;
  }

  _clickHandle(event) {
    setState({
      tool: {
        ...app.tool,
        selectedTemplate: event.target.name,
        currentStep: 'listen',
      },
    });
  }
}
customElements.define('shapes-list', ShapesList);
