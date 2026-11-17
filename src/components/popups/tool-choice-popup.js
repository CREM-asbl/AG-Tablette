import '@components/color-button';
import '@components/icon-button';
import { app } from '@controllers/Core/App';
import { SignalWatcher } from '@lit-labs/signals';
import { kit } from '@store/kit';
import { tools } from '@store/tools';
import '@styles/popup-variables.css';
import { LitElement, css, html } from 'lit';
import './template-popup';
import {
  toggleAllFamiliesVisibility,
  toggleFamilyVisibility,
} from '../../store/kit';
import {
  toggleAllToolsVisibility,
  toggleToolVisibility,
} from '../../store/tools';

class ToolChoicePopup extends SignalWatcher(LitElement) {
  static styles = css`
    .field {
      display: var(--popup-field-display);
      align-items: var(--popup-field-align-items);
      padding: var(--popup-field-padding);
      width: var(--popup-field-width);
    }

    select {
      height: var(--popup-select-height);
      width: var(--popup-select-width);
      border-radius: var(--popup-select-border-radius);
    }

    input {
      height: var(--popup-input-height);
      width: var(--popup-input-width);
      border-radius: var(--popup-input-border-radius);
    }

    input[type='checkbox'] {
      height: var(--popup-checkbox-height);
      width: var(--popup-checkbox-width);
    }

    label {
      font-weight: var(--popup-label-font-weight);
      margin: var(--popup-label-margin);
      font-size: var(--popup-label-font-size);
    }

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
      grid-template-columns: repeat(4, 1fr);
      gap: 2px;
      width: 100%;
      height: 100%;
      place-content: baseline;
      background-color: white;
      border-radius: 4px;
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
      justify-self: right;
    }

    #allShow {
      justify-self: left;
    }
  `;



  render() {
    this.tools = tools.get();
    this.families = kit.get()?.families || [];
    return html`
      <template-popup>
        <h2 slot="title">Choix des outils disponibles</h2>
        <div id="toolChoicePopupBody" slot="body">
          <h3>Disponibles</h3>
          <button id="allHide" @click="${this._actionHandle}">
            Tout cacher &#8594;
          </button>
          <div class="toolContainer">
            ${this.families
        .filter((family) => family.isVisible)
        .map(
          (family) =>
            html` <icon-button
                    name="${family.shapeTemplates[0].name}"
                    type="Create"
                    title="${family.name}"
                    @click="${this._actionHandle}"
                  ></icon-button>`,
        )}
            ${this.tools
        .filter(
          (tool) =>
            tool.name !== 'create' && tool.isVisible && !tool.isDisable,
        )
        .map(
          (tool) => html`
                  <icon-button
                    name="${tool.name}"
                    type="State"
                    title="${tool.title}"
                    cantInteract="true"
                    @click="${this._actionHandle}"
                  ></icon-button>
                `,
        )}
          </div>
          <h3>Non disponibles</h3>
          <button id="allShow" @click="${this._actionHandle}">
            &#8592; Tout montrer
          </button>
          <div class="toolContainer">
            ${this.families
        .filter((family) => !family.isVisible)
        .map(
          (family) =>
            html` <icon-button
                    name="${family.shapeTemplates[0].name}"
                    type="Create"
                    title="${family.name}"
                    @click="${this._actionHandle}"
                  ></icon-button>`,
        )}
            ${this.tools
        .filter(
          (tool) =>
            tool.name !== 'create' && !tool.isVisible && !tool.isDisable,
        )
        .map(
          (tool) => html`
                  <icon-button
                    name="${tool.name}"
                    type="State"
                    title="${tool.title}"
                    cantInteract="true"
                    ?active="${tool.name === app.tool?.name}"
                    @click="${this._actionHandle}"
                  ></icon-button>
                `,
        )}
          </div>
        </div>
        <div slot="footer">
          <color-button
            @click="${() => this.close()}"
            innerText="Ok"
          ></color-button>
        </div>
      </template-popup>
    `;
  }

  _actionHandle(event) {
    if (!app.fullHistory.isRunning) {
      if (event.target.id === 'allHide') {
        toggleAllToolsVisibility(false);
        toggleAllFamiliesVisibility(false);
      } else if (event.target.id === 'allShow') {
        toggleAllToolsVisibility(true);
        toggleAllFamiliesVisibility(true);
      } else {
        if (event.target.type === 'Create') {
          toggleFamilyVisibility(event.target.title);
        } else {
          toggleToolVisibility(event.target.name);
        }
      }
    }
  }

  firstUpdated() {
    window.addEventListener('close-popup', () => this.close());
  }

  close() {
    this.remove();
  }
}
customElements.define('tool-choice-popup', ToolChoicePopup);
