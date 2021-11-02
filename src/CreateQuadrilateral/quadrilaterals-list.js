import { app, setState } from '../Core/App';
import { LitElement, html, css } from 'lit';

class QuadrilateralsList extends LitElement {
  constructor() {
    super();
    this.quadrilateralsNames = [
      'Square',
      'Rectangle',
      'Losange',
      'Parallelogram',
      // 'RightAngleTrapeze',
      'RightAngleTrapeze2',
      'IsoscelesTrapeze',
      'Trapeze',
      'IrregularQuadrilateral',
    ];

    this.quadrilateralTitle = {
      'Square': 'Carré',
      'Rectangle': 'Rectangle',
      'Losange': 'Losange',
      'Parallelogram': 'Parallélogramme',
      // 'RightAngleTrapeze': 'Trapèze rectangle',
      'RightAngleTrapeze2': 'Trapèze rectangle 2',
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
      window.removeEventListener('tool-changed', this.eventHandler);
    };

    window.addEventListener('tool-changed', this.eventHandler);
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
        padding: 4px 4px 0px 4px;
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
        <div id="list">
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
        </div>
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
