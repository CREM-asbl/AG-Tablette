import { LitElement, html } from 'lit-element';
import { app } from '../js/App';

class StateMenu extends LitElement {
  constructor() {
    super();
    this.buttons = [];
  }

  static get properties() {
    return {
      buttons: { type: Array },
    };
  }

  render() {
    return html`
      <style>
        :host {
          position: absolute;
          top: 5px;
          padding: 10px;
          font-size: 20px;
          border-radius: 5px;
          border: 2px solid gray;
          background-color: rgba(0, 0, 0, 0.15);
          width: auto;
          max-width: calc(100% - 230px);
          overflow-y: auto;
          max-height: 30%;
          left: ${app.settings.get('mainMenuWidth') + 5}px;
        }

        div#state-menu-buttons-list > button {
          font-size: 20px;
          border-radius: 5px;
          margin: 5px;
          padding: 4px;
          display: inline-block;
          background-color: #bbb;
        }
      </style>
      <div id="state-menu-buttons-list">
        ${this.buttons.map(
          button => html`
            <button @click="${() => this.clickBtn(button.value)}">${button.text}</button>
          `,
        )}
      </div>
    `;
  }

  // /**
  //  * Configurer le menu
  //  * @param  {[{text: String, value: String}]} buttons
  //  * ->Le nombre d'éléments du tableau détermine le nombre de boutons affichés.
  //  * ->Maximum 10 boutons
  //  * ->text: le texte affiché sur le bouton
  //  * ->value: la valeur envoyée en paramètre de la fonction state.clickOnStateMenuButton
  //  *          lorsque l'on clique sur le bouton.
  //  */
  // //TODO: pouvoir activer/désactiver (attribut disable) des boutons
  // configureButtons(buttons) {
  //     let doc = this.shadowRoot;

  //     for (let i = 1; i <= 10; i++) {
  //         let btn = doc.getElementById('state-menu-button' + i);
  //         btn.style.display = 'none';
  //         this.buttonsValue[i - 1] = '';
  //     }
  //     for (let i = 0; i < buttons.length && i < 10; i++) {
  //         let btn = doc.getElementById('state-menu-button' + (i + 1)),
  //             text = buttons[i].text,
  //             value = buttons[i].value;
  //         btn.style.display = 'block';
  //         btn.innerHTML = text;
  //         this.buttonsValue[i] = value;
  //     }
  //     if (buttons.length > 0)
  //         this.showMenu();
  //     else
  //         this.hideMenu();
  // }

  clickBtn(value) {
    dispatchEvent(new CustomEvent('state-menu-button-click', { detail: value }));
    // if (app.state && app.state.clickOnStateMenuButton) {
    //     console.log(app.state)
    //     app.state.clickOnStateMenuButton(value);
    // }
  }

  // showMenu() { this.style.display = 'block'; }

  // hideMenu() { this.style.display = 'none'; }
}

customElements.define('state-menu', StateMenu);
