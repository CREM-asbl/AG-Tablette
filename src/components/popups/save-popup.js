import '@components/color-button';
import { app } from '@controllers/Core/App';
import '@controllers/version-item';
import { css, html, LitElement } from 'lit';
import { TemplatePopup } from './template-popup';

class SavePopup extends LitElement {
  static properties = {
    opts: { type: Object },
    filename: { type: String },
    saveSettings: { type: Boolean },
    saveHistory: { type: Boolean }
  }

  constructor() {
    super();
    this.filename = 'sans titre';
    this.saveSettings = true;
    this.saveHistory = true;
    this.permanentHide = false;
    window.addEventListener('close-popup', () => this.close());
  }

  static styles = [TemplatePopup.template_popup_styles(),
  css`
        #body {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 16px;
          justify-content: center;
        }

        label {
          text-align: right;
        }

        fieldset {
          grid-column: 1 / 3;
        }
      `
  ]

  render() {
    return html`
      <template-popup>
        <h2 slot="title">Enregistrer</h2>
        <form slot="body" id="body">

          <label for="save_popup_filename">Nom du fichier</label>
          <input type="text"
              name="save_popup_filename"
              id="save_popup_filename"
              value="${this.opts.suggestedName || this.filename}"
              @change="${this._actionHandle}"
              onfocus="this.select()" />

          <label for="save_popup_format">Format</label>
          <select name="save_popup_format" id="save_popup_format">
            ${this.opts.types.map(type => html`<option value="${type.description}">${type.description}</option>`)}
          </select>

          <fieldset>
            <legend>Options</legend>

            <div class="field">
              <input type="checkbox"
                    name="save_popup_settings"
                    id="save_popup_settings"
                    ?checked="${this.saveSettings}"
                    @change="${this._actionHandle}" />
              <label for="save_popup_settings">Enregistrer les paramètres</label>
            </div>

            ${this.renderHistoryField()}

            ${this.renderGeometryField()}
          </fieldset>
        </form>

        <footer slot="footer">
          <color-button name="save_popup_submit" @click="${this._actionHandle}">
            OK
          </color-button>
        </footer>
      </template-popup>
    `;
  }

  renderHistoryField() {
    if (app.environment.name != "Tangram" || app.tangram.isSilhouetteShown) return html`
    <div class="field">
      <input type="checkbox"
             name="save_popup_history"
             id="save_popup_history"
             ?checked="${this.saveHistory}"
             @change="${this._actionHandle}" />
      <label for="save_popup_history">Enregistrer l'historique</label>
    </div>
    `
    else this.saveHistory = false;
  }

  renderGeometryField() {
    if (app.environment.name === 'Geometrie') return html`
      <div class="field">
          <input type="checkbox"
                     name="save_popup_permanent_hide"
                     id="save_popup_permanent_hide"
                     ?checked="${this.permanentHide}"
                     @change="${this._actionHandle}" />
          <label for="save_popup_permanent_hide">Cacher de façon permanente</label>
      </div>
    `
  }

  close() {
    this.remove();
  }

  _actionHandle(event) {
    switch (event.target.name) {
      case 'save_popup_settings':
        this.saveSettings = !this.saveSettings;
        break;

      case 'save_popup_history':
        this.saveHistory = !this.saveHistory;
        break;

      case 'save_popup_permanent_hide':
        this.permanentHide = !this.permanentHide;
        break;

      case 'save_popup_filename':
        this.filename = event.target.value;
        if (!this.filename) this.filename = 'sans titre';
        break;

      case 'save_popup_submit':
        const ele = this.shadowRoot?.querySelector('#save_popup_format').value
        const extension = ele.slice(ele.indexOf('.'), -1);
        let name = this.filename + extension,
          saveSettings = this.saveSettings,
          saveHistory = this.saveHistory,
          permanentHide = this.permanentHide;
        this.dispatchEvent(new CustomEvent('selected', {
          detail: {
            name,
            types: this.opts.types.filter(type => type.description === ele),
            saveSettings,
            saveHistory,
            permanentHide
          },
        }))
        this.remove();
        break;

      default:
        console.error(
          'SavePopup: paramètre inconnu: ' +
          event.target.name +
          ' ' +
          event.target.value +
          ' ' +
          event.target.checked,
        );
    }
  }
}
customElements.define('save-popup', SavePopup);
