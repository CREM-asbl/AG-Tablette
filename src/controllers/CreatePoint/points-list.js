import { css, html, LitElement } from 'lit';
import '../../components/flex-grid';
import { app, setState } from '../Core/App';

class PointsList extends LitElement {
  constructor() {
    super();
    this.pointsNames = [
      'Point',
      'PointOnLine',
      // 'PointOnShape',
      'PointOnIntersection',
    ];

    this.pointTitle = {
      'Point': 'Point',
      'PointOnLine': 'Point sur objet',
      // 'PointOnShape': 'Point sur figure',
      'PointOnIntersection': 'Point d\'intersection',
    }

    this.updateProperties = () => {
      this.selectedPoint = app.tool.selectedPoint;
      this.iconSize = app.menuIconSize;
    };
    this.updateProperties();

    this.eventHandler = () => {
      if (app.tool?.name == 'createPoint') this.updateProperties();
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
      pointsNames: { type: Array },
      selectedPoint: { type: String },
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

      #list {
        display: grid;
        grid-auto-flow: column;
        gap: 4px;
        list-style: none;
        overflow: auto hidden;
        padding: 4px;
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
              (${this.pointsNames.length} / 2 * 54px)
          );
        }
      </style>
      <div class="container">
        <h2>
          ${this.selectedPoint
        ? this.pointTitle[this.selectedPoint]
        : 'Points'}
        </h2>
        <flex-grid>
          ${this.pointsNames.map(
          (pointName) => html`
              <icon-button
                style="width: ${this.iconSize}px; height: ${this.iconSize}px;"
                title="${this.pointTitle[pointName]}"
                type="Geometry"
                name="${pointName}"
                @click="${this._clickHandle}"
                ?active="${pointName === this.selectedPoint}"
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
        selectedPoint: event.target.name,
        currentStep: 'drawPoint',
      },
    });
  }
}
customElements.define('points-list', PointsList);
