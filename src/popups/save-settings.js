import { LitElement, html } from 'lit-element';
import '../version-item';
import { app } from '../js/App';
import { Settings } from '../js/Settings';

class SaveSettings extends LitElement {
  static get properties() {
    return {
      filename: { type: String },
      complete_file: { type: Boolean },
      history_file: { type: Boolean },
    };
  }

  constructor() {
    super();
    this.settings = app.settings;
    this.filaname = '';
    this.complete_file = true;
    this.history_file = true;
    addEventListener('keyup', e => {
      e.key === 'Escape' && (this.style.display = 'none');
    });
  }

  render() {
    return html`
		<style>
			:host {
			display: none;
			width: 100%;
			height: 100%;
			background-color: rgba(0, 0, 0, 0.5);
			position: absolute;
			top: 0px;
			left: 0px;
			z-index: 100;
			}

			#save-settings-view {
			position: absolute;
			left: 2%;
			top: 2%;
			right: 2%;
			bottom: 2%;
			border-radius: 10px;
			border: 2px solid gray;
			background-color: #ddd;
			overflow-y: hidden;
			}

			#popup-close {
			position: relative;
			font-size: 60px;
			float: right;
			cursor: pointer;
			color: #555;
			box-sizing: content-box;
			width: 30px;
			height: 30px;
			margin: 8px;
			overflow: hidden;
			line-height: 40%;
			}

			h2 {
			padding: 16px;
			margin: 0;
			}

			.save-settings-form {
			height: calc(100% - 160px);
			overflow: auto;
			padding: 16px;
			}

			.field {
			display: flex;
			align-items: center;
			padding: 8px 0;
			}

			select {
			height: 32px;
			width: 150px;
			}

			input[type='checkbox'] {
			height: 24px;
			width: 24px;
			}

			label {
			display: block;
			margin: 0 16px;
			font-weight: bold;
			font-size: 1rem;
			}

			footer {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 16px;
			}

			button {
			padding: 8px 16px;
			margin: 0 4px;
			}

			version-item {
			flex: 1;
			}
		</style>

    	<div id="save-settings-view">
			<div id="popup-close" @click="${() => (this.style.display = 'none')}">
			&times;
			</div>

        	<h2>Sauvegarder les paramètres</h2>
          	<div class="save-settings-form">

				<div class="field">
					<input
						type="checkbox"
						name="save_settings_complete_file"
						id="save_settings_complete_file"
						?checked="${this.complete_file}"
						@change="${this._actionHandle}"
					/>
					<label for="save_settings_complete_file">Le fichier complet</label>
				</div>

				<br />

				<div class="field">
					<input
						type="checkbox"
						name="save_settings_history"
						id="save_settings_history"
						?checked="${this.history_file}"
						@change="${this._actionHandle}"
					/>
					<label for="save_settings_history">Historique</label>
				</div>

				<br />

				<div class="field">
					<label for="save_settings_filename">Nom du fichier</label>
					<input
						type="text"
						name="save_settings_filename"
						id="save_settings_filename"
						@change="${this._actionHandle}"
					/>
				</div>
			</div>

			<footer>
				<version-item></version-item>
				<button name="save" @click="${this._actionHandle}">OK</button>
			</footer>
        </div>
      </div>
    `;
  }

  /**
   * event handler principal
   */
  _actionHandle(event) {
    switch (event.target.name) {
      case 'save_settings_complete_file':
        this.complete_file = !this.complete_file;
        break;

      case 'save_settings_history':
        this.history_file = !this.history_file;
        break;

      case 'save_settings_filename':
        this.filename = event.path[0].value;
        break;

      case 'save':
        app.saveToFile(this.filename);
        break;

      default:
        console.log(
          'Settings: paramètre inconnu: ' +
            event.target.name +
            ' ' +
            event.target.value +
            ' ' +
            event.target.checked,
        );
    }
  }
}
customElements.define('save-settings', SaveSettings);
