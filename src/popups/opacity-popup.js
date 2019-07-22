import { LitElement, html } from 'lit-element'
import { app } from '../js/App'

class OpacityPopup extends LitElement {

    constructor() {
        super()
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

            #opacity-popup {
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
                font-size: 20px;
            }
            /*
            #opacity-popup-close {
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
            }*/

            select {
                font-size: 20px;
            }
        </style>
        <div id="opacity-popup">
            <!--
            <div id="opacity-popup-close"
                 @click="${() => this.style.display = 'none'}">&times;</div>
            -->

            <br><br>

            <div class="field">
                <label for="opacity_popup_select">Opacité </label>
                <select name="opacity_popup_select" id="opacity_popup_select" @change='${this._actionHandle}'>
                    <option value="0"
                            ?selected="${app.state && app.state.action ? app.state.action.opacity == 0 : false}">
                        transparent
                    </option>
                    <option value="0.7"
                            ?selected="${app.state && app.state.action ? app.state.action.opacity == 0.7 : false}">
                        semi-transparent
                    </option>
                    <option value="1"
                            ?selected="${app.state && app.state.action ? app.state.action.opacity == 1 : false}">
                        opaque
                    </option>
                </select>
            </div>

            <br><br>
            <button style="font-size: 20px" @click="${this.opacityPopupValidate}">Valider</button>
        </div>
        `
    }

    opacityPopupValidate() {
        this.style.display = 'none';
        if(app.state && app.state.setOpacity) {
            app.state.setOpacity(parseFloat(this.shadowRoot.getElementById("opacity_popup_select").value));
        }
    }

}
customElements.define('opacity-popup', OpacityPopup)
