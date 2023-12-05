import '@components/color-button';
import { css, html, LitElement } from 'lit';
import { TemplatePopup } from '../popups/template-popup';

class LevelPopup extends LitElement {
  static get properties() {
    return {
      level: { type: Number },
    };
  }

  constructor() {
    super();
    this.level = 1;

    window.addEventListener('close-popup', () => this.submit());
  }

  static get styles() {
    return [
      TemplatePopup.template_popup_styles(),
      css`
        .choice {
          width: 100%;
          text-align: left;
          margin-bottom: 3px;
        }
        input[type='radio'] {
          display: inline;
        }
        label {
          display: inline;
        }
      `,
    ];
  }

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
              .checked="${this.level == 1}"
            />
            <label for="level1">1 Avec lignes</label>
          </div>
          <div class="choice" @click="${() => (this.level = 2)}">
            <input
              type="radio"
              id="level2"
              name="level"
              value="2"
              .checked="${this.level == 2}"
            />
            <label for="level2">2 Sans ligne</label>
          </div>
          <div class="choice" @click="${() => (this.level = 3)}">
            <input
              type="radio"
              id="level3"
              name="level"
              value="3"
              .checked="${this.level == 3}"
            />
            <label for="level3">3 Pas de superposition avec lignes</label>
          </div>
          <div class="choice" @click="${() => (this.level = 4)}">
            <input
              type="radio"
              id="level4"
              name="level"
              value="4"
              .checked="${this.level == 4}"
            />
            <label for="level4">4 Pas de superposition sans ligne</label>
          </div>
          <div class="choice" @click="${() => (this.level = 5)}">
            <input
              type="radio"
              id="level5"
              name="level"
              value="5"
              .checked="${this.level == 5}"
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
              .checked="${this.level == 6}"
            />
            <label for="level6">6 Echelle différente sans ligne</label>
          </div>
          <!-- <input
            type="range"
            min="1"
            max="6"
            value="\${this.level}"
            list="level"
            @change="\${e => (this.level = e.target.value)}"
          />
          <datalist id="level">
            <option value="1" label="1">1</option>
            <option value="2" label="2">2</option>
            <option value="3" label="3">3</option>
            <option value="4" label="4">4</option>
            <option value="5" label="5">5</option>
            <option value="6" label="6">6</option>
          </datalist> -->
        </div>
        <div slot="footer">
          <color-button @click="${this.submit}" innerText="OK"></color-button>
        </div>
      </template-popup>
    `;
  }

  submit() {
    this.dispatchEvent(
      new CustomEvent('tangram-level-selected', {
        detail: this.level,
        bubbles: true,
        composed: true,
      }),
    );
    this.close();
  }

  close() {
    this.remove();
  }
}
customElements.define('level-popup', LevelPopup);
