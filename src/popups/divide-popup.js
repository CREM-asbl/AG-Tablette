import { LitElement, html } from 'lit-element'
import { app } from '../js/App'

class DividePopup extends LitElement {

    constructor() {
        super()
        this.parts = 2
    }

    static get properties() {
        return {
            parts: Number
        }
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
            }

            #divide-popup {
                position: absolute;
                left: 35%;
                top: 35%;
                padding: 20px;
                border-radius: 10px;
                border: 2px solid gray;
                background-color: #ddd;
                width: 30%;
                overflow-y: auto;
                text-align: center;
            }

            #divide-popup-close {
                position: relative;
                font-size: 60px;
                float: right;
                cursor: pointer;
                color: #555;
                box-sizing: content-box;
                width: 30px;
                height: 30px;
                overflow: hidden;
                line-height: 40%;
                -webkit-user-select: none;
                -khtml-user-select: none;
                -moz-user-select: none;
                -o-user-select: none;
                user-select: none;
            }

            select {
                font-size: 20px;
            }
        </style>
            <div id="divide-popup">
                <!--<div id="divide-popup-close"
                     @click="${() => this.style.display = 'none'}">&times;</div>-->
                <label for="settings_divide_number_of_parts">Diviser en </label>
                <select @change="${e => this.parts = e.target.value}">
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6">6</option>
                    <option value="7">7</option>
                    <option value="8">8</option>
                </select>
                <span> parties</span>
                <br><br>
                <button @click="${this.dividePopupValidate}">Valider</button>
            </div>
        `
    }

    dividePopupValidate() {
        this.style.display = 'none';
        app.state.setNumberOfparts(this.parts);
    }

}
customElements.define('divide-popup', DividePopup)
