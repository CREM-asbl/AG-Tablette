import { app } from '../../Core/App';
import { LitElement, html, css } from 'lit-element';

class CirclesList extends LitElement {
  constructor() {
    super();
    this.circlesNames = ['Circle', 'CirclePart', 'CircleArc'];
  }

  static get properties() {
    return {
      circlesNames: { type: Array },
      circleSelected: { type: String },
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
        <h2>Circles</h2>
        <ul>
          ${this.circlesNames.map(
            (circleName) => html`
              <li>
                <icon-button
                  title="${circleName}"
                  type="Geometry"
                  name="${circleName}"
                  @click="${this._clickHandle}"
                  ?active="${circleName === this.circleSelected}"
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
    this.circleSelected = event.target.name;
    window.dispatchEvent(
      new CustomEvent('circle-selected', {
        detail: { circleSelected: this.circleSelected },
      }),
    );
  }
}
customElements.define('circles-list', CirclesList);
