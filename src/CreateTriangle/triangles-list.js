import { app } from '../Core/App';
import { LitElement, html, css } from 'lit';

class TrianglesList extends LitElement {
  constructor() {
    super();
    this.trianglesNames = [
      'EquilateralTriangle',
      'RightAngleIsoscelesTriangle',
      'RightAngleTriangle',
      'IsoscelesTriangle',
      'IrregularTriangle',
    ];

    this.updateProperties = () => {
      this.iconSize = app.menuIconSize;
    };
    this.updateProperties();

    this.eventHandler = () => {
      // if (app.tool?.name == 'createTrangle')
        this.updateProperties();
      // else this.close();
    };
    this.close = () => {
      this.remove();
      // window.removeEventListener('tool-changed', this.eventHandler);
    };

    // window.addEventListener('tool-changed', this.eventHandler);
    window.addEventListener('menuIconSize-changed', this.eventHandler);
  }

  static get properties() {
    return {
      trianglesNames: { type: Array },
      triangleSelected: { type: String },
    };
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
              (${this.trianglesNames.length} / 2 * 54px)
          );
        }
      </style>
      <div class="container">
        <h2>Triangles</h2>
        <div id="list">
          ${this.trianglesNames.map(
            (triangleName) => html`
              <icon-button
                style="width: ${this.iconSize}px; height: ${this.iconSize}px;"
                title="${triangleName}"
                type="Geometry"
                name="${triangleName}"
                @click="${this._clickHandle}"
                ?active="${triangleName === this.triangleSelected}"
              >
              </icon-button>
            `,
          )}
        </div>
      </div>
    `;
  }

  _clickHandle(event) {
    this.triangleSelected = event.target.name;
    window.dispatchEvent(
      new CustomEvent('triangle-selected', {
        detail: { triangleSelected: this.triangleSelected },
      }),
    );
  }
}
customElements.define('triangles-list', TrianglesList);
