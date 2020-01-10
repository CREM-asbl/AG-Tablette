import { LitElement, html } from 'lit-element';
import { app } from './js/App';

class ShapesList extends LitElement {
  constructor() {
    super();

    window.addEventListener('family-selected', () => {
      this.selectedFamily = app.selectedFamily;
      this.shape = '';
    });
    window.addEventListener('app-state-changed', () => {
      this.state = app.state;
      this.shape = '';
    });
  }

  static get properties() {
    return {
      shape: String,
      selectedFamily: String,
      state: String,
    };
  }

  render() {
    if (this.state != 'create_shape' || !this.selectedFamily) {
      return html``;
    }

    const shapes = app.workspace.environment.getFamily(this.selectedFamily).getShapesNames();

    return html`
      <style>
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
      </style>

      <div class="container">
        <h2>${this.shape ? this.shape.replace(/ \d+$/, '') : this.selectedFamily}</h2>
        <ul>
          ${shapes.map(
            shape => html`
              <li>
                <canvas-button
                  title="${shape.replace(/ \d+$/, '')}"
                  family="${this.selectedFamily}"
                  shape="${shape}"
                  @click="${this._clickHandle}"
                  ?active="${shape === this.shape}"
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
    this.shape = event.target.shape;
    const familyRef = app.workspace.environment.getFamily(this.selectedFamily);
    const shapeRef = familyRef.getShape(event.target.shape);
    window.dispatchEvent(new CustomEvent('shapeSelected', { detail: { shapeSelected: shapeRef } }));
    // app.state.setShape(shapeRef);
    // this.show = false;
  }
}
customElements.define('shapes-list', ShapesList);
