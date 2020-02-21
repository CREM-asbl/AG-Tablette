import { LitElement, html, css } from 'lit-element';
import { app } from './js/App';

class ShapesList extends LitElement {
  constructor() {
    super();

    window.addEventListener('family-selected', event => {
      this.selectedFamily = event.detail.selectedFamily ? event.detail.selectedFamily : '';
      this.shapeName = '';
    });
    window.addEventListener('shape-selected', event => {
      this.shapeName = event.detail.selectedShape ? event.detail.selectedShape.name : '';
    });
  }

  static get properties() {
    return {
      shapeName: String,
      selectedFamily: String,
      state: String,
    };
  }

  static get styles() {
    return css`
      :host {
        display: flex;
        justify-content: center;
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
    `;
  }

  render() {
    if (!this.selectedFamily) {
      return html``;
    }

    const shapesNames = app.environment.getFamily(this.selectedFamily).getShapesNames();

    return html`
      <div class="container">
        <h2>${this.shapeName ? this.shapeName.replace(/ \d+$/, '') : this.selectedFamily}</h2>
        <ul>
          ${shapesNames.map(
            shapeName => html`
              <li>
                <canvas-button
                  title="${shapeName.replace(/ \d+$/, '')}"
                  familyName="${this.selectedFamily}"
                  shapeName="${shapeName}"
                  @click="${this._clickHandle}"
                  ?active="${shapeName === this.shapeName}"
                >
                </canvas-button>
              </li>
            `,
          )}
        </ul>
      </div>
    `;
  }

  /**
   * Met à jour l'état de l'application lorsque l'on clique sur le nom d'une forme
   */
  _clickHandle(event) {
    const familyRef = app.environment.getFamily(this.selectedFamily);
    const shapeRef = familyRef.getShape(event.target.shapeName);
    window.dispatchEvent(
      new CustomEvent('shape-selected', { detail: { selectedShape: shapeRef.saveToObject() } }),
    );
  }
}
customElements.define('shapes-list', ShapesList);
