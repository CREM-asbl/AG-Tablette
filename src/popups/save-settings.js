import { LitElement, html } from 'lit-element';
import '../version-item';
import { app } from '../js/App';
import { Settings } from '../js/Settings';

class SaveSettings extends LitElement {
  static get properties() {
    return {
      filename: { type: String },
      save_parameters: { type: Boolean },
      save_history: { type: Boolean },
    };
  }

  constructor() {
    super();
    this.filaname = '';
    this.save_parameters = true;
    this.save_history = true;
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

        	<h2>Sauvegarder l'état</h2>
          	<div class="save-settings-form">

				<div class="field">
					<input
						type="checkbox"
						name="save_settings_parameters"
						id="save_settings_parameters"
						?checked="${this.save_parameters}"
						@change="${this._actionHandle}"
					/>
					<label for="save_settings_parameters">Sauvegarde des paramètres</label>
				</div>

				<br />

				<div class="field">
					<input
						type="checkbox"
						name="save_settings_history"
						id="save_settings_history"
						?checked="${this.save_history}"
						@change="${this._actionHandle}"
					/>
					<label for="save_settings_history">Sauvegarder l'historique</label>
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

  saveToFile(fileName) {
    if (!fileName) fileName = 'untitled';

    let { history, settings, ...saveObject } = {
      ...app.workspace.data,
      appSettings: app.settings.data,
    };

    if (this.save_history) saveObject.history = history;
    else saveObject.history = { history: [], historyIndex: -1 };

    if (this.save_parameters) saveObject.settings = settings;

    let json = JSON.stringify(saveObject);

    const file = new Blob([json], { type: 'application/json' });

    const downloader = document.createElement('a');
    downloader.href = window.URL.createObjectURL(file);
    downloader.download = fileName;
    downloader.target = '_blank';
    document.body.appendChild(downloader);
    downloader.click();
    document.body.removeChild(downloader);
  }

  /**
   * event handler principal
   */
  _actionHandle(event) {
    switch (event.target.name) {
      case 'save_settings_parameters':
        this.save_parameters = !this.save_parameters;
        break;

      case 'save_settings_history':
        this.save_history = !this.save_history;
        break;

      case 'save_settings_filename':
        this.filename = event.path[0].value; // this.shadowRoot.querySelector("#save_settings_filename").value
        break;

      case 'save':
        this.style.display = 'none';
        this.saveToFile(this.filename);
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
