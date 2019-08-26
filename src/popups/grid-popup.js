import { LitElement, html } from 'lit-element'
import { app } from '../js/App'

class GridPopup extends LitElement {

    constructor() {
        super()
        app.popups.grid = this;
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

            #grid-popup {
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

            #grid-popup-close {
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
        <div id="grid-popup">
            <div id="grid-popup-close"
                 @click="${() => this.style.display = 'none'}">&times;</div>

            <br><br>

             <div class="field">
                 <input type="checkbox"
                        name="grid_popup_show_grid"
                        id="grid_popup_show_grid"
                        ?checked="${app.workspace.settings.get('isGridShown')}"
                        @change='${this._actionHandle}' />
                 <label for="grid_popup_show_grid">Activer la grille</label>
             </div>

             <br>


             <div class="field" style="margin-left:8px">
                 <label for="grid_popup_grid_type">Type de grille </label>
                 <select name="grid_popup_grid_type"
                         id="grid_popup_grid_type"
                         @change='${this._actionHandle}'
                         disabled="${app.workspace.settings.get('isGridShown')}">
                     <option value="square"
                             ?selected=${app.workspace.settings.get('gridType') === 'square'}>Carrés</option>
                     <option value="triangle"
                             ?selected=${app.workspace.settings.get('gridType') === 'triangle'}>Triangles</option>
                 </select>

             </div>

             <br>

             <div class="field" style="margin-left:8px">
                 <label for="grid_popup_grid_size">Taille de la grille </label>
                 <select name="grid_popup_grid_size" id="grid_popup_grid_size"
                         @change='${this._actionHandle}'
                         disabled="${app.workspace.settings.get('isGridShown')}">
                     <option value="0.333333333333333"
                             ?selected="${Math.abs(app.workspace.settings.get('gridSize') - 0.3333333333333)<0.0001}">
                             1/3
                     </option>
                     <option value="0.5"
                             ?selected="${app.workspace.settings.get('gridSize') === 0.5}">
                             1/2
                     </option>
                     <option value="1"
                             ?selected="${app.workspace.settings.get('gridSize') === 1}">
                             1
                     </option>
                     <option value="2"
                             ?selected="${app.workspace.settings.get('gridSize') === 2}">
                             2
                     </option>
                     <option value="3"
                             ?selected="${app.workspace.settings.get('gridSize') === 3}">
                             3
                     </option>
                 </select>
             </div>

            <br><br>
            <button style="font-size: 20px" @click="${this.gridPopupValidate}">Valider</button>
        </div>
        `
    }

    updatePopup() {
        let showElem = this.shadowRoot.getElementById("grid_popup_show_grid"),
            typeElem = this.shadowRoot.getElementById("grid_popup_grid_type"),
            sizeElem = this.shadowRoot.getElementById("grid_popup_grid_size");

        showElem.checked = app.workspace.settings.get('isGridShown');
        typeElem.disabled = app.workspace.settings.get('isGridShown');
        sizeElem.disabled = app.workspace.settings.get('isGridShown');

        typeElem.value = app.workspace.settings.get('gridType');

        let gridSize = app.workspace.settings.get('gridSize');
        if(Math.abs(gridSize - 0.3333333333333)<0.0001) {
            sizeElem.value = "0.333333333333333";
        } else {
            sizeElem.value = gridSize;
        }
    }

    gridPopupValidate() {
        this.style.display = 'none';
    }

    /**
     * event handler principal
     */
    _actionHandle(event) {
        switch (event.target.name) {
            case 'grid_popup_show_grid':
                this.shadowRoot.getElementById("grid_popup_grid_type").disabled = !event.target.checked;
                this.shadowRoot.getElementById("grid_popup_grid_size").disabled = !event.target.checked;
                app.workspace.settings.update('isGridShown', event.target.checked);
                app.drawAPI.askRefresh("background");
                break;

            case 'grid_popup_grid_size':
                app.workspace.settings.update('gridSize', event.target.value);
                app.drawAPI.askRefresh("background");
                break;

            case 'grid_popup_grid_type':
                app.workspace.settings.update('gridType', event.target.value);
                app.drawAPI.askRefresh("background");
                break;

            default:
                console.log("Grid popup: paramètre inconnu: " + event.target.name + ' ' + event.target.value + ' ' + event.target.checked);
        }
    }

}
customElements.define('grid-popup', GridPopup)
