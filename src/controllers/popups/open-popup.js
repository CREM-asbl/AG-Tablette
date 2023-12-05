import '@components/color-button';
import { css, html, LitElement } from 'lit';
import { app } from '../Core/App';
import { createElem } from '../Core/Tools/general';
import './open-server-popup';
import './save-warning';
import { TemplatePopup } from './template-popup';

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
        [slot='body'] {
          padding: 0;
        }

        [slot='footer'] {
          padding-top: 16px;
        }
      `,
    ];
  }

  render() {
    return html`
      <template-popup>
        <h2 slot="title">Ouvrir un fichier</h2>
        <div slot="body" id="body">
          ${app.stepSinceSave ? html`
            <save-warning></save-warning>
          ` : ''}
        </div>

        <div slot="footer">
          <color-button name="LocalOpenFile" @click="${this._actionHandle}" innerText="Ouvrir en local"></color-button>
          <color-button name="ServerOpenFile" @click="${this._actionHandle}" innerText="Ouvrir en ligne"></color-button>
          <color-button @click="${this.close}" innerText="Annuler"></color-button>
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
