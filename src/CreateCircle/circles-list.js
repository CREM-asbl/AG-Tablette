import { app, setState } from '../Core/App';
import { LitElement, html, css } from 'lit';

class CirclesList extends LitElement {
  constructor() {
    super();
    this.circlesNames = ['Circle']//, 'CirclePart', 'CircleArc'];

    this.circleTitle = {
      'Circle': 'Cercle',
      'CirclePart': 'Secteur circulaire',
      'CircleArc': 'Arc de cercle',
    }

    this.updateProperties = () => {
      this.selectedCircle = app.tool.selectedCircle;
      this.iconSize = app.menuIconSize;
    };
    this.updateProperties();

    this.eventHandler = () => {
      if (app.tool?.name == 'createCircle') this.updateProperties();
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
      circlesNames: { type: Array },
      selectedCircle: { type: String },
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
              (${this.circlesNames.length} / 2 * 54px)
          );
        }
      </style>
      <div class="container">
        <h2>
          ${this.selectedCircle
            ? this.circleTitle[this.selectedCircle]
            : 'Cercles'}
        </h2>
        <div id="list">
          ${this.circlesNames.map(
            (circleName) => html`
            <icon-button
                style="width: ${this.iconSize}px; height: ${this.iconSize}px;"
                title="${this.circleTitle[circleName]}"
                type="Geometry"
                name="${circleName}"
                @click="${this._clickHandle}"
                ?active="${circleName === this.selectedCircle}"
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
        selectedCircle: event.target.name,
        currentStep: 'drawFirstPoint',
      },
    });
  }
}
customElements.define('circles-list', CirclesList);
