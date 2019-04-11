import { LitElement, html } from 'lit-element'
import { loadManifest } from './js/Manifest'

class AppSettings extends LitElement {

    render() {
        const settings = window.app.settings

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

            #app-settings-view {
                position: absolute;
                left: 2%;
                top: 2%;
                right: 2%;
                bottom: 2%;
                border-radius: 10px;
                border: 2px solid gray;
                background-color: #ddd;
                overflow-y: hidden;
            }
        
            #popup-close {
                position: relative;
                font-size: 60px;
                float: right;
                cursor: pointer;
                color: #555;
                box-sizing: content-box;
                width: 30px;
                height: 30px;
                margin: 8px;
                overflow: hidden;
                line-height: 40%;
            }

            h2 {
                padding: 16px;
                margin: 0;
                /* box-shadow: 0 2px 2px rgba(0, 0, 0, 0.2); */
            }

            .app-settings-form {
                height: calc(100% - 160px);
                overflow: auto;
                padding: 16px;
            }

            .field {
                display: flex;
                align-items: center;
                padding: 8px 0;
            }

            select {
                height: 32px;
                width: 150px;
            }

            input[type=checkbox] {
                height: 24px;
                width: 24px;
            }

            label {
                display: block;
                margin: 0 16px;
                font-weight: bold;
                font-size: 1rem;
            }

            footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px;
                /* box-shadow: 0 -2px 2px rgba(0, 0, 0, 0.2) */
            }

            .version {
                text-align: right;
                font-size: .8rem;
                color: gray;
            }

            button {
                padding: 8px 16px;
            }
        </style>

        <div id="app-settings-view">

            <div id="popup-close" 
                @click="${() => this.style.display = 'none'}">
                &times;
            </div>  
            
            <h2>Paramètres</h2>
            <div class="app-settings-form">

                <fieldset>
                    <legend>Général</legend>

                    <div class="field">
                        <input type="checkbox" 
                               name="settings_adapt_shapes_position" 
                               id="settings_adapt_shapes_position"
                               ?checked="${settings.get('automaticAdjustment')}" 
                               @change='${this._actionHandle}' />
                        <label for="settings_adapt_shapes_position">Ajustement automatique</label>                   
                    </div>

                    <div class="field">
                        <input type="checkbox" 
                               name="settings_show_grid" 
                               id="settings_show_grid"
                               ?checked="${settings.get('isGridShown')}"  
                               @change='${this._actionHandle}' />
                        <label for="settings_show_grid">Activer la grille</label>
                    </div>

                    <div class="field" style="margin-left:8px">
                        <label for="settings_grid_type">Type de grille </label>
                        <select name="settings_grid_type" 
                                id="settings_grid_type" 
                                @change='${this._actionHandle}' 
                                disabled="${settings.get('isGridShown')}">
                            <option value="square"
                                    ?selected=${settings.get('gridType') === 'square'}>Carrés</option>
                            <option value="triangle"
                                    ?selected=${settings.get('gridType') === 'triangle'}>Triangles</option>
                        </select>
                    
                    </div>

                    <div class="field" style="margin-left:8px">
                        <label for="settings_grid_size">Taille de la grille </label>
                        <select name="settings_grid_size" id="settings_grid_size" 
                                @change='${this._actionHandle}' 
                                disabled="${settings.get('isGridShown')}">
                            <option value="0.333333333333333" 
                                    ?selected="${settings.get('gridSize') === 0.333333333333333}">
                                    1/3
                            </option>
                            <option value="0.5"
                                    ?selected="${settings.get('gridSize') === 0.5}">
                                    1/2
                            </option>
                            <option value="1"
                                    ?selected="${settings.get('gridSize') === 1}">
                                    1
                            </option>
                            <option value="2"
                                    ?selected="${settings.get('gridSize') === 2}">
                                    2
                            </option>
                            <option value="3" 
                                    ?selected="${settings.get('gridSize') === 3}">
                                    3
                            </option>
                        </select>
                    </div>

                </fieldset>

                <br />

                <fieldset>
                    <legend>Formes</legend>

                    <div class="field">
                        <label for="settings_shapes_size">Taille des formes </label>
                        <select name="settings_shapes_size" 
                                id="settings_shapes_size"
                                @change='${this._actionHandle}'>
                            <option value="1">1</option>
                            <option value="2" selected>2</option>
                            <option value="3">3</option>
                        </select>
                    </div>

                    <div class="field">
                        <input type="checkbox" 
                               name="settings_pointed_shapes" 
                               id="settings_pointed_shapes" 
                               ?checked="${settings.get('areShapesPointed')}"
                               @change='${this._actionHandle}' />
                        <label for="settings_pointed_shapes">Formes pointées</label>
                    </div>

                    <div class="field">
                        <input type="checkbox" 
                               name="settings_sided_shapes" 
                               id="settings_sided_shapes"
                               ?checked="${settings.get('areShapesSided')}" 
                               @change='${this._actionHandle}' />
                        <label for="settings_sided_shapes">Formes bifaces</label>
                    </div>

                    <div class="field">
                        <label for="settings_shapes_opacity">Opacité </label>
                        <select name="settings_shapes_opacity" id="settings_shapes_opacity" @change='${this._actionHandle}'>
                            <option value="0"
                                    ?selected="${settings.get('shapesOpacity') === 0}">
                                    transparent
                            </option>
                            <option value="0.7"
                                    ?selected="${settings.get('shapesOpacity') === 0.7}">
                                semi-transparent
                            </option>
                            <option value="1"
                                    ?selected="${settings.get('shapesOpacity') === 1}">
                                opaque
                            </option>
                        </select>
                    </div>

                </fieldset>
            </div>
            <footer>
                <div class="version">${this.version}</div>
                <button @click="${() => this.style.display = 'none'}">OK</button>
            </footer>
        </div>
        `
    }

    constructor() {
        super()
        loadManifest().then(manifest => this.version = `${manifest.short_name} ${manifest.version}`)
    }

    static get properties() {
        return {
            version: String,
            settings: Object
        }
    }

    /**
     * event handler principal
     */
    _actionHandle(event) {
        console.log(window.app.state.name)
        if (window.app.state.name)
            window.app.state.abort();
        window.app.state = { 'name': null };

        switch (event.target.name) {
            case 'settings_adapt_shapes_position':
                window.app.settings.update('automaticAdjustment', event.target.checked);
                break;

            case 'settings_show_grid':
                this.shadowRoot.getElementById("settings_grid_type").disabled = !event.target.checked;
                this.shadowRoot.getElementById("settings_grid_size").disabled = !event.target.checked;
                window.app.settings.update('isGridShown', event.target.checked);
                window.app.canvas.refreshBackgroundCanvas();
                break;

            case 'settings_grid_size':
                window.app.settings.update('gridSize', event.target.value);
                window.app.canvas.refreshBackgroundCanvas();
                break;

            case 'settings_grid_type':
                window.app.settings.update('gridType', event.target.value);
                window.app.canvas.refreshBackgroundCanvas();
                break;

            case 'settings_shapes_size':
                window.app.settings.update('shapesSize', parseInt(event.target.value));
                break;

            case 'settings_pointed_shapes':
                window.app.settings.update('areShapesPointed', event.target.checked);
                break;

            case 'settings_sided_shapes':
                window.app.settings.update('areShapesSided', event.target.checked);
                break;

            case 'settings_shapes_opacity':
                window.app.settings.update('shapesOpacity', parseFloat(event.target.value));
                break;

            default:
                console.log("Settings: paramètre inconnu: " + event.target.name + ' ' + event.target.value + ' ' + event.target.checked);
        }
    }
}
customElements.define('app-settings', AppSettings)