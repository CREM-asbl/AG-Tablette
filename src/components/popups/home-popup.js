import '@components/color-button';
import { app } from '@controllers/Core/App';
import { goToHomePage } from '@controllers/Core/Tools/general';
import '@styles/popup-variables.css';
import { css, html, LitElement } from 'lit';
import './save-warning';
import './template-popup';

class HomePopup extends LitElement {
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

    [slot='body'] {
      padding: 0;
    }

    [slot='footer'] {
      padding-top: 16px;
    }
  `;


  render() {
    return html`
      <template-popup>
        <h2 slot="title">${'Accueil'}</h2>
        <div slot="body" id="body">
          ${app.stepSinceSave ? html`<save-warning></save-warning>` : ''}
        </div>

        <div slot="footer">
          <color-button
            @click="${this.goToHomePage}"
            innerText="Page d'accueil"
          ></color-button>
          <color-button
            @click="${this.newWindow}"
            innerText="Espace de travail vide"
          ></color-button>
          <color-button
            @click="${this.close}"
            innerText="Annuler"
          ></color-button>
        </div>
      </template-popup>
    `;
  }

  firstUpdated() {
    window.addEventListener('close-popup', () => this.close());
  }

  goToHomePage() {
    goToHomePage();
  }

  newWindow() {
    window.dispatchEvent(new CustomEvent('new-window'));
    this.close();
  }

  close() {
    this.remove();
  }
}
customElements.define('home-popup', HomePopup);
