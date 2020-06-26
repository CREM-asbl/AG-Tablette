import { app } from '../Core/App';
import { LitElement, html, css } from 'lit-element';

class ShapesList extends LitElement {
  static get properties() {
    return {
      shapeName: { type: String },
      selectedFamily: { type: String },
      shapesNames: { type: Array },
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
          left: ${app.settings.get('mainMenuWidth')}px;
        }
      }
    `;
  }

  render() {
    return html`
      <div class="container">
        <h2>${this.shapeName ? this.shapeName.replace(/ \d+$/, '') : this.selectedFamily}</h2>
        <ul>
          ${this.shapesNames.map(
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

  _clickHandle(event) {
    this.shapeName = event.target.shapeName;
    const shapeRef = app.environment.getFamily(this.selectedFamily).getShape(this.shapeName);
    window.dispatchEvent(
      new CustomEvent('shape-selected', { detail: { selectedShape: shapeRef.saveToObject() } }),
    );
  }
}
customElements.define('shapes-list', ShapesList);
