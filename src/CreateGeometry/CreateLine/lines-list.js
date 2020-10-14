import { app } from '../../Core/App';
import { LitElement, html, css } from 'lit-element';

class LinesList extends LitElement {
  constructor() {
    super();
    this.linesNames = [
      'StraightLine',
      'ParalleleStraightLine',
      'PerpendicularStraightLine',
    ];
  }

  static get properties() {
    return {
      linesNames: { type: Array },
      lineSelected: { type: String },
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
        <h2>lines</h2>
        <ul>
          ${this.linesNames.map(
            lineName => html`
              <li>
                <canvas-button
                  title="${lineName}"
                  shapeName="${lineName}"
                  @click="${this._clickHandle}"
                  ?active="${lineName === this.lineSelected}"
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
    this.lineSelected = event.target.shapeName;
    console.log(this.lineSelected);
    window.dispatchEvent(
      new CustomEvent('line-selected', {
        detail: { lineSelected: this.lineSelected },
      })
    );
  }
}
customElements.define('lines-list', LinesList);
