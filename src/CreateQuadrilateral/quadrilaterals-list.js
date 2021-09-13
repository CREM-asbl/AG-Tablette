import { app } from '../Core/App';
import { LitElement, html, css } from 'lit';

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
  }

  static get properties() {
    return {
      quadrilateralsNames: { type: Array },
      quadrilateralSelected: { type: String },
    };
  }

  static get styles() {
    return css`
      :host {
        display: flex;
        justify-content: center;
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
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

      @media (min-width: 600px) {
        :host {
          left: ${app.settings.mainMenuWidth}px;
        }
      }
    `;
  }

  render() {
    return html`
      <div class="container">
        <h2>Quadrilatères</h2>
        <ul>
          ${this.quadrilateralsNames.map(
            (quadrilateralName) => html`
              <li>
                <icon-button
                  title="${quadrilateralName}"
                  type="Geometry"
                  name="${quadrilateralName}"
                  @click="${this._clickHandle}"
                  ?active="${quadrilateralName === this.quadrilateralSelected}"
                >
                </icon-button>
              </li>
            `,
          )}
        </ul>
      </div>
    `;
  }

  _clickHandle(event) {
    this.quadrilateralSelected = event.target.name;
    window.dispatchEvent(
      new CustomEvent('quadrilateral-selected', {
        detail: { quadrilateralSelected: this.quadrilateralSelected },
      }),
    );
  }
}
customElements.define('quadrilaterals-list', QuadrilateralsList);
