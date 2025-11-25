import '@components/color-button';
import { app } from '@controllers/Core/App';
import { goToHomePage } from '@controllers/Core/Tools/general';
import { css, html, LitElement } from 'lit';
import './save-warning';

class HomePopup extends LitElement {
  static styles = css`
    .field {
      display: flex;
      align-items: center;
      padding: 8px 0;
      width: 100%;
    }

    select {
      height: 32px;
      width: auto;
      border-radius: 4px;
    }

    input {
      height: 24px;
      width: auto;
      border-radius: 4px;
    }

    input[type='checkbox'] {
      height: 24px;
      width: 24px;
    }

    label {
      font-weight: normal;
      margin: 0 8px;
      font-size: 1rem;
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
