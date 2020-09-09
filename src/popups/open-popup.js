import { LitElement, html, css } from 'lit-element';
import { TemplatePopup } from './template-popup';
import { app } from '../Core/App';

class OpenPopup extends LitElement {
  static get properties() {
    return {
      renderMode: String,
    };
  }

  constructor() {
    super();

    this.CremTangrams = app.CremTangrams;

    this.renderMode = 'selectMethod';

    window.addEventListener('close-popup', () => this.close());
  }

  static get styles() {
    return [
      TemplatePopup.template_popup_styles(),
      css`
        button {
          width: 100%;
        }
      `,
    ];
  }

  render() {
    if (this.renderMode == 'selectMethod') {
      return html`
        <template-popup>
          <h2 slot="title">Ouvrir un fichier</h2>
          <div slot="body" id="body">
            <button name="LocalOpenFile" @click="${this._actionHandle}">
              Ouvrir en local
            </button>

            <br />

            <button name="ServerOpenFile" @click="${this._actionHandle}">
              Ouvrir sur le serveur
            </button>
          </div>
        </template-popup>
      `;
    } else if (this.renderMode == 'selectServerFile') {
      return html`
        <template-popup>
          <h2 slot="title">Ouvrir un fichier</h2>
          <div slot="body" id="body">
            ${app.environment.name == 'Tangram'
              ? this.CremTangrams.map(
                  (tan, idx) =>
                    html`
                      <div
                        style="display: flex; width: 100%;
                      cursor: pointer;"
                        @click="${() => {
                          window.dispatchEvent(
                            new CustomEvent('parse-file', {
                              detail: { fileContent: tan },
                            })
                          );
                          this.close();
                        }}"
                      >
                        <canvas-button
                          title="Tangram"
                          silhouetteIdx="${idx}"
                        ></canvas-button>
                        <p style="margin: auto;">${tan.filename}</p>
                      </div>
                    `
                )
              : undefined}
          </div>
        </template-popup>
      `;
    } else {
      return html``;
    }
  }

  close() {
    this.remove();
  }

  /**
   * event handler principal
   */
  _actionHandle(event) {
    switch (event.target.name) {
      case 'LocalOpenFile':
        window.dispatchEvent(new CustomEvent('local-open-file'));
        this.close();
        break;

      case 'ServerOpenFile':
        this.renderMode = 'selectServerFile';
        break;

      default:
        console.log(
          'OpenPopup: paramètre inconnu: ' +
            event.target.name +
            ' ' +
            event.target.value +
            ' ' +
            event.target.checked
        );
    }
  }
}
customElements.define('open-popup', OpenPopup);
