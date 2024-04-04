import '@components/color-button';
import '@components/icon-button';
import { app, setState } from '@controllers/Core/App';
import '@controllers/version-item';
import { LitElement, css, html } from 'lit';
import { TemplatePopup } from './template-popup';

class ToolChoicePopup extends LitElement {
  static properties = {
    tools: Array
  };

  constructor() {
    super();
    this.updateProperties()
  }

  static styles = [
    TemplatePopup.template_popup_styles(),
    css`
        #toolChoicePopupBody {
          display: grid;
          grid-template: auto auto 1fr / 1fr 1fr;
          height: 100%;
          grid-auto-flow: column;
          gap: 8px;
        }

        h3 {
          margin: 0;
          width: 100%;
          text-align: center;
        }

        .toolContainer {
          display: grid;
          grid-template-columns : repeat(4, 1fr);
          gap: 2px;
          width: 100%;
          height: 100%;
          place-content: baseline;
          background-color: white;
          border-radius: 4px;
          box-shadow: 0px 0px 5px rgb(102, 102, 102);
          overflow: auto;
          scrollbar-width: thin;
        }

        button {
          border: inherit;
          background: inherit;
          cursor: pointer;
          font-size: 16px;
        }

        #allHide {
          justify-self : right;
        }

        #allShow {
          justify-self: left;
        }
      `
  ]

  render() {
    return html`
      <template-popup>
        <h2 slot="title">Choix des outils disponibles</h2>
        <div id="toolChoicePopupBody" slot="body">
          <h3>Disponibles</h3>
          <button id="allHide" @click="${this._actionHandle}">Tout cacher &#8594;</button>
          <div class="toolContainer">
                ${this.families.filter(family => family.isVisible).map((family) => html`
                    <icon-button
                      name="${family.shapeTemplates[0].name}"
                      type="Create"
                      title="${family.name}"
                      @click="${this._actionHandle}"
                    ></icon-button>`)}
                ${this.tools.filter(tool => tool.isVisible && !tool.isDisable).map(tool => html`
                    <icon-button
                      name="${tool.name}"
                      type="State"
                      title="${tool.title}"
                      cantInteract="true"
                      @click="${this._actionHandle}"
                    ></icon-button>
                  `)}
          </div>
          <h3>Non disponibles</h3>
          <button id="allShow" @click="${this._actionHandle}">&#8592; Tout montrer</button>
          <div class="toolContainer">
                ${this.families.filter(family => !family.isVisible).map((family) => html`
                    <icon-button
                      name="${family.shapeTemplates[0].name}"
                      type="Create"
                      title="${family.name}"
                      @click="${this._actionHandle}"
                    ></icon-button>`)}
                ${this.tools.filter(tool => !tool.isVisible && !tool.isDisable).map((tool) => html`
                    <icon-button
                      name="${tool.name}"
                      type="State"
                      title="${tool.title}"
                      cantInteract="true"
                      ?active="${tool.name === app.tool?.name}"
                      @click="${this._actionHandle}"
                    ></icon-button>
                  `)}
          </div>
        </div>
        <div slot="footer">
          <color-button @click="${() => this.close()}" innerText="Ok"></color-button>
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
      setState({ environment: { ...app.environment }, tools: [...app.tools] });
    }
  }

  firstUpdated() {
    window.addEventListener('tools-changed', this.updateProperties.bind(this));
    window.addEventListener('close-popup', () => this.close());
  }

  updateProperties() {
    this.iconSize = app.menuIconSize;
    this.families = app.environment.families || [];
    this.tools = [...app.tools.filter(tool => tool.name != 'create')];
  };

  close() {
    this.remove();
  }
}
customElements.define('tool-choice-popup', ToolChoicePopup);
