import '@components/color-button';
import { app } from '@controllers/Core/App';
import '@styles/popup-variables.css';
import { css, html, LitElement } from 'lit';
import './template-popup';

class SavePopup extends LitElement {
  static properties = {
    opts: { type: Object },
    filename: { type: String },
    saveSettings: { type: Boolean },
    saveHistory: { type: Boolean },
    selectedFormat: { type: String },
  };

  constructor() {
    super();
    this.filename = 'sans titre';
    this.saveSettings = true;
    this.saveHistory = true;
    this.permanentHide = false;
    this.selectedFormat = '';
    window.addEventListener('close-popup', () => this.close());
  }

  willUpdate(changedProperties) {
    if (
      changedProperties.has('opts') &&
      this.opts?.types?.length > 0 &&
      !this.selectedFormat
    ) {
      this.selectedFormat = this.opts.types[0].description;
    }
  }

  get isImageFormat() {
    if (!this.selectedFormat) return false;
    const extension = this.selectedFormat.slice(
      this.selectedFormat.indexOf('.'),
      -1,
    );
    return ['.png', '.svg'].includes(extension);
  }

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
      text-align: right;
    }

    #body {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 16px;
      justify-content: center;
    }

    fieldset {
      grid-column: 1 / 3;
    }
  `;



  render() {
    return html`
      <template-popup>
        <h2 slot="title">Enregistrer</h2>
        <form slot="body" id="body" @submit="${this._actionHandle}">
          <label for="save_popup_filename">Nom du fichier</label>
          <input
            type="text"
            name="save_popup_filename"
            id="save_popup_filename"
            value="${this.opts.suggestedName || this.filename}"
            @change="${this._actionHandle}"
            onfocus="this.select()"
          />

          <label for="save_popup_format">Format</label>
          <select
            name="save_popup_format"
            id="save_popup_format"
            @change="${this._actionHandle}"
          >
            ${this.opts.types.map(
      (type) =>
        html`<option value="${type.description}">
                  ${type.description}
                </option>`,
    )}
          </select>

          <fieldset>
            <legend>Options</legend>

            <div class="field">
              <input
                type="checkbox"
                name="save_popup_settings"
                id="save_popup_settings"
                ?checked="${this.saveSettings}"
                ?disabled="${this.isImageFormat}"
                @change="${this._actionHandle}"
              />
              <label for="save_popup_settings"
                >Enregistrer les paramètres</label
              >
            </div>

            ${this.renderHistoryField()} ${this.renderGeometryField()}
          </fieldset>
        </form>

        <footer slot="footer">
          <color-button @click="${this._actionHandle}"> OK </color-button>
        </footer>
      </template-popup>
    `;
  }

  renderHistoryField() {
    if (app.environment.name !== 'Tangram' || app.tangram.isSilhouetteShown)
      return html`
        <div class="field">
          <input
            type="checkbox"
            name="save_popup_history"
            id="save_popup_history"
            ?checked="${this.saveHistory}"
            ?disabled="${this.isImageFormat}"
            @change="${this._actionHandle}"
          />
          <label for="save_popup_history">Enregistrer l'historique</label>
        </div>
      `;
    else this.saveHistory = false;
  }

  renderGeometryField() {
    if (app.environment.name === 'Geometrie')
      return html`
        <div class="field">
          <input
            type="checkbox"
            name="save_popup_permanent_hide"
            id="save_popup_permanent_hide"
            ?checked="${this.permanentHide}"
            ?disabled="${this.isImageFormat}"
            @change="${this._actionHandle}"
          />
          <label for="save_popup_permanent_hide"
            >Cacher de façon permanente</label
          >
        </div>
      `;
  }

  close() {
    this.remove();
  }

  _actionHandle(event) {
    event.preventDefault();
    switch (event.target.name) {
      case 'save_popup_settings':
        this.saveSettings = !this.saveSettings;
        break;

      case 'save_popup_format':
        this.selectedFormat = event.target.value;
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

      default:
        const ele = this.shadowRoot?.querySelector('#save_popup_format').value;
        const extension = ele.slice(ele.indexOf('.'), -1);
        const name = this.filename + extension,
          saveSettings = this.saveSettings,
          saveHistory = this.saveHistory,
          permanentHide = this.permanentHide;
        this.dispatchEvent(
          new CustomEvent('selected', {
            detail: {
              name,
              types: this.opts.types.filter((type) => type.description === ele),
              saveSettings,
              saveHistory,
              permanentHide,
            },
          }),
        );
        this.remove();
        break;
    }
  }
}
customElements.define('save-popup', SavePopup);
