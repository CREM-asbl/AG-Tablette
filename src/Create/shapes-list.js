import { app, setState } from '../Core/App';
import { LitElement, html, css } from 'lit';

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
    };
    this.updateProperties();

    this.eventHandler = () => {
      if (app.tool?.name == 'create') this.updateProperties();
      else this.close();
    };
    this.close = () => {
      this.remove();
      window.removeEventListener('tool-changed', this.eventHandler);
    };

    window.addEventListener('tool-changed', this.eventHandler);
  }

  static get styles() {
    return css`
      :host {
        display: flex;
        justify-content: center;
        position: absolute;
        bottom: 0px;
        /* left: calc(300 + 100%); */
        /* right: 0; */
      }

      .container {
        background: var(--theme-color-soft);
        box-shadow: 0 1px 3px gray;
        z-index: 100;
        box-sizing: border-box;
        overflow: auto;
        border-radius: 7px;
        margin-bottom: 3px;
        /* padding: 3px; */
      }

      h2 {
        padding: 4px;
        margin: 0;
        text-align: center;
        font-size: 1.2rem;
      }

      #list {
        display: flex;
        margin: 3px;
        /* padding: 2px; */
        list-style: none;
        justify-content: space-evenly;
        overflow-x: auto;
        overflow-y: hidden;
      }

      /* li {
        margin: 0;
        padding: 0;
        height: 56px;
      } */
      @media (max-width: 600px) {
        :host {
          right: 0;
          left: auto;
        }
      }
    `;
  }

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
        <div id="list">
          ${this.templateNames.map(
            (templateName) => html`
              <canvas-button
                title="${templateName.replace(/ \d+$/, '')}"
                familyName="${this.selectedFamily}"
                templateName="${templateName}"
                @click="${this._clickHandle}"
                ?active="${templateName === this.selectedTemplate}"
              >
              </canvas-button>
            `,
          )}
        </div>
      </div>
    `;
  }

  _clickHandle(event) {
    setState({
      tool: {
        ...app.tool,
        selectedTemplate: event.target.templateName,
        currentStep: 'listen',
      },
    });
  }
}
customElements.define('shapes-list', ShapesList);
