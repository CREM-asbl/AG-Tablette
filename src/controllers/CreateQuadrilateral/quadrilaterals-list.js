import '@components/flex-grid';
import { css, html, LitElement } from 'lit';
import { app, setState } from '../Core/App';

class QuadrilateralsList extends LitElement {
  constructor() {
    super();
    this.quadrilateralsNames = [
      'Square',
      'Rectangle',
      'Losange',
      'Parallelogram',
      'RightAngleTrapeze',
      'IsoscelesTrapeze',
      'Trapeze',
      'IrregularQuadrilateral',
    ];

    this.quadrilateralTitle = {
      'Square': 'Carré',
      'Rectangle': 'Rectangle',
      'Losange': 'Losange',
      'Parallelogram': 'Parallélogramme',
      'RightAngleTrapeze': 'Trapèze rectangle',
      'IsoscelesTrapeze': 'Trapèze isocèle',
      'Trapeze': 'Trapèze',
      'IrregularQuadrilateral': 'Quadrilatère',
    }

    this.updateProperties = () => {
      this.selectedQuadrilateral = app.tool.selectedQuadrilateral;
      this.iconSize = app.menuIconSize;
    };
    this.updateProperties();

    this.eventHandler = () => {
      if (app.tool?.name == 'createQuadrilateral') this.updateProperties();
      else this.close();
    };
    this.close = () => {
      this.remove();
      window.removeEventListener('tool-updated', this.eventHandler);
    };

    window.addEventListener('tool-updated', this.eventHandler);
    window.addEventListener('menuIconSize-changed', this.eventHandler);
  }

  static get properties() {
    return {
      quadrilateralsNames: { type: Array },
      selectedQuadrilateral: { type: String },
    };
  }

  static get styles() {
    return css`
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
  }

  render() {
    return html`
      <style>
        :host {
          left: calc(
            50% + (${app.settings.mainMenuWidth}px / 2) -
              (${this.quadrilateralsNames.length} / 2 * 54px)
          );
        }
      </style>
      <div class="container">
        <h2>
          ${this.selectedQuadrilateral
        ? this.quadrilateralTitle[this.selectedQuadrilateral]
        : 'Quadrilatères'}
        </h2>
        <flex-grid>
          ${this.quadrilateralsNames.map(
          (quadrilateralName) => html`
              <icon-button
                style="width: ${this.iconSize}px; height: ${this.iconSize}px;"
                title="${this.quadrilateralTitle[quadrilateralName]}"
                type="Geometry"
                name="${quadrilateralName}"
                @click="${this._clickHandle}"
                ?active="${quadrilateralName === this.selectedQuadrilateral}"
              >
              </icon-button>
            `,
        )}
        </flex-grid>
      </div>
    `;
  }

  _clickHandle(event) {
    setState({
      tool: {
        ...app.tool,
        selectedQuadrilateral: event.target.name,
        currentStep: 'drawFirstPoint',
      },
    });
  }
}
customElements.define('quadrilaterals-list', QuadrilateralsList);
