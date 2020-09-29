import { app } from '../Core/App';
import { LitElement, html, css } from 'lit-element';

class TrianglesList extends LitElement {
  constructor() {
    super();
    this.trianglesNames = [
      'RightAngleTriangle',
      'IsoscelesTriangle',
      'RightAngleIsoscelesTriangle',
    ];
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
        <h2>Triangles</h2>
        <ul>
          ${this.trianglesNames.map(
            triangleName => html`
              <li>
                <canvas-button
                  title="${triangleName}"
                  shapeName="${triangleName}"
                  @click="${this._clickHandle}"
                  ?active="${triangleName === this.triangleSelected}"
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
    this.triangleSelected = event.target.shapeName;
    console.log(this.triangleSelected);
    window.dispatchEvent(
      new CustomEvent('triangle-selected', {
        detail: { triangleSelected: this.triangleSelected },
      })
    );
  }
}
customElements.define('triangles-list', TrianglesList);
