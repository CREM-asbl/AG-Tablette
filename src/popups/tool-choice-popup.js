import { css, html, LitElement } from 'lit';
import { app, setState } from '../Core/App';
import '../version-item';
import { TemplatePopup } from './template-popup';

class ToolChoicePopup extends LitElement {
  static get properties() {
    return {
      tools: Array,
    };
  }

  constructor() {
    super();

    this.updateProperties = () => {
      this.iconSize = app.menuIconSize;
      this.families = app.environment.families || [];
      this.tools = [...app.tools.filter(tool => tool.name != 'create')];
      // this.deletedTools = app.defaultTools.filter(defaultTool => this.tools.every(tool => tool.name != defaultTool.name));
    };
    this.updateProperties();

    this.eventHandler = () => {
      this.updateProperties();
    };

    window.addEventListener('menuIconSize-changed', this.eventHandler);
    window.addEventListener('tools-changed', this.eventHandler);
    window.addEventListener('close-popup', () => this.close());
  }

  static get styles() {
    return [
      TemplatePopup.template_popup_styles(),
      css`
        #toolChoicePopupBody {
          display: flex;
        }

        .toolContainer {
          background-color: white;
          border-radius: 5px;
          margin: 5px;
          box-shadow: 0px 0px 5px rgb(102, 102, 102);
          width: calc(4 * (52px + 2px + 2px));

          display: flex;
          flex-wrap: wrap;
          align-content: flex-start;
          box-sizing: border-box;
        }

        span {
          cursor: pointer;
        }
      `,
    ];
  }

  render() {
    return html`
      <style>
        .toolContainer {
          height: ${(parseInt((this.tools.length + this.families.length) / 4) + ((this.tools.length + this.families.length) % 4 ? 1 : 0)) * (52 + 2 + 2)}px;
        }
      </style>
      <template-popup>
        <h2 slot="title">Choix des outils disponibles</h2>
        <div id="toolChoicePopupBody" slot="body">
          <div>
            <h3>Disponibles</h3>
            <span id="allHide" @click="${this._actionHandle}">
              Tout cacher &#8594;
            </span>
            <div class="toolContainer">
              ${this.families.filter(family => family.isVisible).map(
                (family) => html`
                  <icon-button
                    style="width: ${this.iconSize}px; height: ${this.iconSize}px;"
                    name="${family.shapeTemplates[0].name}"
                    type="Create"
                    title="${family.name}"
                    @click="${this._actionHandle}"
                  ></icon-button>
                `
              )}
              ${this.tools.filter(tool => tool.isVisible).map(
                (tool) => html`
                  <icon-button
                    style="width: ${this.iconSize}px; height: ${this.iconSize}px;"
                    name="${tool.name}"
                    type="State"
                    title="${tool.title}"
                    @click="${this._actionHandle}"
                  ></icon-button>
                `
              )}
            </div>
          </div>
          <div>
            <h3>Non disponibles</h3>
            <span id="allShow" @click="${this._actionHandle}">
              &#8592; Tout montrer
            </span>
            <div class="toolContainer">
              ${this.families.filter(family => !family.isVisible).map(
                (family) => html`
                  <icon-button
                    style="width: ${this.iconSize}px; height: ${this.iconSize}px;"
                    name="${family.shapeTemplates[0].name}"
                    type="Create"
                    title="${family.name}"
                    @click="${this._actionHandle}"
                  ></icon-button>
                `
              )}
              ${this.tools.filter(tool => !tool.isVisible).map(
                (tool) => html`
                  <icon-button
                    style="width: ${this.iconSize}px; height: ${this.iconSize}px;"
                    name="${tool.name}"
                    type="State"
                    title="${tool.title}"
                    ?active="${tool.name === app.tool?.name}"
                    @click="${this._actionHandle}"
                  ></icon-button>
                `
              )}
            </div>
          </div>
        </div>
        <div slot="footer">
          <color-button id="focus" @click="${() => this.close()}" innerText="Ok"></color-button>
        </div>
      </template-popup>
    `;
  }

  _actionHandle(event) {
    if (!app.fullHistory.isRunning) {
      if (event.target.id == 'allHide') {
        app.tools.forEach(tool => tool.isVisible = false);
        app.environment.families.forEach(family => family.isVisible = false);
      } else if (event.target.id == 'allShow') {
        app.tools.forEach(tool => tool.isVisible = true);
        app.environment.families.forEach(family => family.isVisible = true);
      } else {
        if (event.target.type == 'Create') {
          let elementName = event.target.title;
          let family = app.environment.families.find(family => family.name == elementName);
          family.isVisible = !family.isVisible;
        } else {
          let elementName = event.target.name;
          let tool = app.tools.find(tool => tool.name == elementName);
          tool.isVisible = !tool.isVisible;
        }
      }
      setState({ tools: [...app.tools] });
    }
  }

  close() {
    this.remove();
  }
}
customElements.define('tool-choice-popup', ToolChoicePopup);
