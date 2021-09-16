import { LitElement, html, css } from 'lit';
import { TemplatePopup } from './template-popup';
import { app } from '../Core/App';
import { createElem } from '../Core/Tools/general';
import './open-server-popup';
import './save-warning';

class OpenPopup extends LitElement {
  static get properties() {
    return {
    };
  }

  constructor() {
    super();

    window.addEventListener('close-popup', () => this.close());
  }

  static get styles() {
    return [
      TemplatePopup.template_popup_styles(),
      css`
        color-button {
          padding: 8px 0px;
          margin: 0px;
          width: 100%;
        }

        #focus {
          margin-bottom: 18px;
        }

        save-warning {
          margin-bottom: 18px;
        }
      `,
    ];
  }

  updated() {
    // window.setTimeout(
    //   () => this.shadowRoot.querySelector('#focus').focus(),
    //   200,
    // );
  }

  render() {
    return html`
      <template-popup>
        <h2 slot="title">Ouvrir un fichier</h2>
        <div slot="body" id="body">
          ${app.stepSinceSave ? html`
            <save-warning></save-warning>
          ` : ''}
          <color-button id="focus" name="LocalOpenFile" @click="${this._actionHandle}" innerText="Ouvrir en local"></color-button>

          <color-button name="ServerOpenFile" @click="${this._actionHandle}" innerText="Ouvrir sur le serveur"></color-button>
        </div>
      </template-popup>
    `;
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
        createElem('open-server-popup');
        this.close();
        break;

      default:
        console.error(
          'OpenPopup: paramètre inconnu: ' +
            event.target.name +
            ' ' +
            event.target.value +
            ' ' +
            event.target.checked,
        );
    }
  }
}
customElements.define('open-popup', OpenPopup);
