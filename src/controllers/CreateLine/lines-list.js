import { css, html, LitElement } from 'lit';
import { app, setState } from '../Core/App';

class LinesList extends LitElement {
  constructor() {
    super();
    this.linesNames = [
      'Segment',
      'ParalleleSegment',
      'PerpendicularSegment',
      'SemiStraightLine',
      'ParalleleSemiStraightLine',
      'PerpendicularSemiStraightLine',
      'StraightLine',
      'ParalleleStraightLine',
      'PerpendicularStraightLine',
      'Strip',
      'Vector',
    ];

    this.lineTitle = {
      'Segment': 'Segment',
      'ParalleleSegment': 'Segment parallèle',
      'PerpendicularSegment': 'Segment perpendiculaire',
      'SemiStraightLine': 'Demi-droite',
      'ParalleleSemiStraightLine': 'Demi-droite parallèle',
      'PerpendicularSemiStraightLine': 'Demi-droite perpendiculaire',
      'StraightLine': 'Droite',
      'ParalleleStraightLine': 'Droite parallèle',
      'PerpendicularStraightLine': 'Droite perpendiculaire',
      'Strip': 'Bande',
      'Vector': 'Vecteur',
    }

    this.updateProperties = () => {
      this.selectedLine = app.tool.selectedLine;
      this.iconSize = app.menuIconSize;
    };
    this.updateProperties();

    this.eventHandler = () => {
      if (app.tool?.name == 'createLine') this.updateProperties();
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
      linesNames: { type: Array },
      selectedLine: { type: String },
    };
  }

  static get styles() {
    return css`
      :host {
        display: flex;
        justify-content: center;
        position: absolute;
        bottom: 0;
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
              (${this.linesNames.length} / 2 * 54px)
          );
        }
      </style>
      <div class="container">
        <h2>
          ${this.selectedLine
        ? this.lineTitle[this.selectedLine]
        : 'Lignes'}
        </h2>
        <div id="list">
          ${this.linesNames.map(
          (lineName) => html`
              <icon-button
                style="width: ${this.iconSize}px; height: ${this.iconSize}px;"
                title="${this.lineTitle[lineName]}"
                type="Geometry"
                name="${lineName}"
                @click="${this._clickHandle}"
                ?active="${lineName === this.selectedLine}"
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
        selectedLine: event.target.name,
        currentStep: 'drawFirstPoint',
      },
    });
  }
}
customElements.define('lines-list', LinesList);
