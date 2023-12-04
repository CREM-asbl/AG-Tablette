import '@components/flex-grid';
import '@components/icon-button';
import { app } from '@controllers/Core/App';
import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators/custom-element.js';
import { property } from 'lit/decorators/property.js';

@customElement('shape-selector')
export class ShapeSelector extends LitElement {

  @property({ type: String }) family;
  @property({ type: String }) type;
  @property({ type: Array }) templatesNames = [];
  @property({ type: Array }) titles = [];
  @property({ type: Object }) selectedTemplate;


  static styles = css`
      :host {
        display: grid;
        justify-content: center;
        position: absolute;
        bottom: 0;
        right: 0;
        padding: 4px;
      }

      .container {
        background: var(--theme-color-soft);
        box-shadow: 0 1px 3px gray;
        z-index: 100;
        box-sizing: border-box;
        overflow: auto;
        border-radius: 8px;
      }

      h2 {
        padding: 4px 4px 0px 4px;
        margin: 0;
        text-align: center;
        font-size: 1.2rem;
      }
    `;

  render() {
    return html`
    <style>
      :host {
        left: ${app.settings.mainMenuWidth}px
      }
    </style>
    <div class="container">
      <h2>
        ${this.selectedTemplate?.title || this.family}
      </h2>
      <flex-grid>
        ${this.templatesNames.map(template => html`
                <icon-button
                  name="${template.name}"
                  type="${this.type}"
                  title="${template.title}"
                  ?active="${template.name === this.selectedTemplate?.name}"
                  @click="${this._clickHandle}"
                >
                </icon-button>
              `
    )}
      </flex-grid>
    </div>
  `;
  }

  _clickHandle(event) {
    this.selectedTemplate = this.templatesNames.find(template => template.name === event.target.name)
  }

  firstUpdated() {
    window.addEventListener('tool-updated', () => {
      const actions = ['create', 'createLine', 'createPoint', 'createTriangle', 'createQuadrilateral', 'createCircle']
      if (!actions.includes(app.tool?.name) || !this.selectedTemplate || this.selectedTemplate != app.tool.selectedTemplate) this.remove()
    });
  }
}