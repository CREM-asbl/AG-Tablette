import '@components/color-button';
import { css, html, LitElement } from 'lit';

class LevelPopup extends LitElement {
  static properties = {
    level: { type: Number },
  };

  constructor() {
    super();
    this.level = 1;
  }

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

    .choice {
      display: flex;
      align-items: center;
      width: 100%;
    }
    input[type='radio'] {
      display: inline;
    }
  `;


  render() {
    return html`
      <template-popup>
        <h2 slot="title">Niveau de difficulté</h2>
        <div slot="body">
          <div class="choice" @click="${() => (this.level = 1)}">
            <input
              type="radio"
              id="level1"
              name="level"
              value="1"
              .checked="${this.level === 1}"
            />
            <label for="level1">1 Avec lignes</label>
          </div>
          <div class="choice" @click="${() => (this.level = 2)}">
            <input
              type="radio"
              id="level2"
              name="level"
              value="2"
              .checked="${this.level === 2}"
            />
            <label for="level2">2 Sans ligne</label>
          </div>
          <div class="choice" @click="${() => (this.level = 3)}">
            <input
              type="radio"
              id="level3"
              name="level"
              value="3"
              .checked="${this.level === 3}"
            />
            <label for="level3">3 Pas de superposition avec lignes</label>
          </div>
          <div class="choice" @click="${() => (this.level = 4)}">
            <input
              type="radio"
              id="level4"
              name="level"
              value="4"
              .checked="${this.level === 4}"
            />
            <label for="level4">4 Pas de superposition sans ligne</label>
          </div>
          <div class="choice" @click="${() => (this.level = 5)}">
            <input
              type="radio"
              id="level5"
              name="level"
              value="5"
              .checked="${this.level === 5}"
            />
            <label for="level5">5 Echelle différente avec lignes</label>
          </div>
          <div
            class="choice"
            @click="${() => {
        this.level = 6;
      }}"
          >
            <input
              type="radio"
              id="level6"
              name="level"
              value="6"
              .checked="${this.level === 6}"
            />
            <label for="level6">6 Echelle différente sans ligne</label>
          </div>
        </div>
        <div slot="footer">
          <color-button @click="${this.submit}" innerText="OK"></color-button>
        </div>
      </template-popup>
    `;
  }

  firstUpdated() {
    window.addEventListener('close-popup', () => this.submit());
  }

  submit() {
    this.dispatchEvent(new CustomEvent('select', { detail: this.level }));
    this.close();
  }

  close() {
    this.remove();
  }
}
customElements.define('level-popup', LevelPopup);
