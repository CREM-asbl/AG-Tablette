import { LitElement, html } from 'lit-element'
import { app } from './js/App'

class StateMenu extends LitElement {

    constructor() {
        super()

        this.buttonsValue = [
            '', '', '', '', '',
            '', '', '', '', ''
        ];

        app.setStateMenuLink(this);
    }

    static get properties() {
        return { }
    }

    render() {

        return html`
            <style>
                :host {
                    display: none;
                    position: absolute;
                    left: 200px;
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
                }
                div#state-menu-buttons-list > button {
                    font-size: 20px;
                    border-radius: 5px;
                    margin: 5px;
                    padding: 4px;
                    display: inline-block;
                    background-color: #bbb;
                    display: none;
                }
            </style>
            <div id="state-menu-buttons-list">
                <button id='state-menu-button1' @click="${() => this.clickBtn(1)}">Coucou ! ça va?</button>
                <button id='state-menu-button2' @click="${() => this.clickBtn(2)}">Coucou ! ça va?</button>
                <button id='state-menu-button3' @click="${() => this.clickBtn(3)}">Coucou ! ça va?</button>
                <button id='state-menu-button4' @click="${() => this.clickBtn(4)}">Coucou ! ça va?</button>
                <button id='state-menu-button5' @click="${() => this.clickBtn(5)}">Coucou ! ça va?</button>
                <button id='state-menu-button6' @click="${() => this.clickBtn(6)}">Coucou ! ça va?</button>
                <button id='state-menu-button7' @click="${() => this.clickBtn(7)}">Coucou ! ça va?</button>
                <button id='state-menu-button8' @click="${() => this.clickBtn(8)}">Coucou ! ça va?</button>
                <button id='state-menu-button9' @click="${() => this.clickBtn(9)}">Coucou ! ça va?</button>
                <button id='state-menu-button10' @click="${() => this.clickBtn(10)}">Coucou ! ça va?</button>
            </div>
        `
    }

    /**
     * Configurer le menu
     * @param  {[{text: String, value: String}]} buttons
     */
    //TODO: pouvoir activer/désactiver (attribut disable) des boutons
    configureButtons(buttons) {
        let doc = this.shadowRoot;

        for(let i=1; i<=10; i++) {
            let btn = doc.getElementById('state-menu-button'+i);
            btn.style.display = 'none';
            this.buttonsValue[i-1] = '';
        }
        for(let i=0; i<buttons.length && i<10; i++) {
            let btn = doc.getElementById('state-menu-button'+(i+1)),
                text = buttons[i].text,
                value = buttons[i].value;
            btn.style.display = 'block';
            btn.innerHTML = text;
            this.buttonsValue[i] = value;
        }
        if(buttons.length>0)
            this.showMenu();
        else
            this.hideMenu();
    }

    clickBtn(btnId) {
        if(app.state && app.state.clickOnStateMenuButton) {
            let value = this.buttonsValue[btnId-1];
            app.state.clickOnStateMenuButton(value);
        }
    }

    showMenu() { this.style.display = 'block'; }

    hideMenu() { this.style.display = 'none'; }

}

customElements.define('state-menu', StateMenu);
