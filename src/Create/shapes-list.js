import { app } from '../Core/App';
import { LitElement, html, css } from 'lit-element';

class ShapesList extends LitElement {
  static get properties() {
    return {
      templateName: { type: String },
      selectedFamily: { type: String },
      templateNames: { type: Array },
    };
  }

  constructor() {
    super();

    console.log('constructor');

    window.addEventListener('select-template', event => this.changeTemplateName(event));
  }

  changeTemplateName(event) {
    console.log("change template");
    this.templateName = event.detail.templateName;
  }

  static get styles() {
    return css`
      :host {
        display: flex;
        justify-content: center;
        position: absolute;
        bottom: 0;
        /* left: 0; */
        /* right: 0; */
      }

      .container {
        background: white;
        box-shadow: 0 1px 3px gray;
        z-index: 100;
        box-sizing: border-box;
        overflow: auto;
      }

      h2 {
        padding: 4px;
        margin: 0;
        text-align: center;
        background: gray;
        color: white;
        font-size: 1.2rem;
      }

      ul {
        display: flex;
        margin: 0;
        padding: 0;
        list-style: none;
        overflow-x: auto;
        overflow-y: hidden;
      }

      li {
        margin: 0;
        padding: 0;
        height: 54px;
      }
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
          left: calc(50% + (${app.settings.get('mainMenuWidth')}px / 2) - (${this.templateNames.length} / 2 * 54px));
        }
      </style>
      <div class="container">
        <h2>
          ${this.templateName
            ? this.templateName.replace(/ \d+$/, '')
            : this.selectedFamily}
        </h2>
        <ul>
          ${this.templateNames.map(
            templateName => html`
              <li>
                <canvas-button
                  title="${templateName.replace(/ \d+$/, '')}"
                  familyName="${this.selectedFamily}"
                  templateName="${templateName}"
                  @click="${this._clickHandle}"
                  ?active="${templateName === this.templateName}"
                >
                </canvas-button>
              </li>
            `
          )}
        </ul>
      </div>
    `;
  }

  _clickHandle(event) {
    this.templateName = event.target.templateName;
    window.dispatchEvent(
      new CustomEvent('select-template', {
        detail: { templateName: this.templateName },
      })
    );
  }
}
customElements.define('shapes-list', ShapesList);
