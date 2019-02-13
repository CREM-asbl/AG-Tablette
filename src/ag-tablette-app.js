import { LitElement, html } from 'lit-element'
import { canvasViewCss } from './css/canvas-view'
import './canvas-button'
import './shapes-list'
import './div-main-canvas'
import './divide-popup'

class AGTabletteApp extends LitElement {

    static get properties() {
        return {
            currentFamily: String,
            currentMode: String
        }
    }

    render() {

        return html`
        <style>

            ${canvasViewCss}

            .action-button {
                display: block;
                box-sizing: border-box;
                width: 100%;
                height: 30px;
                margin: 8px 0;
            }

            .action-button:hover,
            .action-button:focus {
                font-weight: bold;
                color: white;
                background: gray;
                outline: none;
            }

            canvas-button {
                display: inline-block;
                width: 50px;
                height: 50px;
                margin: 4px;
            }

            shapes-list {
                position: absolute;
                top: 1vh;
                left: 21%;
                width: 220px;
                box-shadow: 0 1px 3px gray;
                z-index: 100;
                max-height: 80vh;
            }

            #app-canvas-mode-text span{
                color: gray;
            }    
        
            #app-canvas-view-toolbar-p2:before {
                content:'';
                display:block;
                box-shadow:inset 0 -5px 10px gray;
                position:absolute;
                bottom:0;
                left:0;
                width:20%;
                min-width: 180px;
                height:10px;
            }​
        </style>

        <div id="app-canvas-view">
            <div id="app-canvas-view-toolbar" class="toolbar">
                <div id="app-canvas-view-toolbar-p1">
                        <div id="app-canvas-mode-text">
                            <span>Mode:</span> ${this.currentMode}
                        </div>
                        <div>
                            <button class="action-button"
                                    name="nouveau"
                                    @click="${() => window.app.newWorkspace()}">
                                    Nouveau
                            </button>
                            <button class="action-button"
                                    name="annuler"
                                    @click='${this._actionHandle}'>
                                    Annuler
                            </button>
                        </div>

                        <div>
                            <button class="action-button"
                                    name="settings"
                                    @click='${this._actionHandle}'>
                                    Paramètres
                            </button>
                        </div>

                        <div>
                            <strong>Formes standard</strong>
                        </div>

                        ${this._getFamilies().map(family => html`
                            <canvas-button .family="${family}"
                                           ?active="${family === this.currentFamily}"
                                           @click="${e => this.currentFamily = e.target.family}"
                                           >
                            </canvas-button>
                        `)}
                </div>

                <div id="app-canvas-view-toolbar-p2">
                    <div >
                        <strong>Mouvements</strong>
                    </div>
                    <button class="action-button" name="move_shape" @click='${this._actionHandle}'>Glisser</button>
                    <button class="action-button" name="rotate_shape" @click='${this._actionHandle}'>Tourner</button>
                    <button class="action-button" name="reverse_shape" @click='${this._actionHandle}'>Retouner</button>
                    <button class="action-button" name="global_zoom" @click='${this._actionHandle}'>Zoomer</button>

                    <div style="margin-top: 25px">
                        <strong>Outils</strong>
                    </div>
                    <button class="action-button" name="moveplane_state" @click='${this._actionHandle}'>Glisser le plan</button>
                    <button class="action-button" name="link_shapes" @click='${this._actionHandle}'>Lier des formes</button>
                    <button class="action-button" name="unlink_shapes" @click='${this._actionHandle}'>Délier</button>
                    <button class="action-button" name="delete_shape" @click='${this._actionHandle}'>Supprimer</button>
                    <button class="action-button" name="background_color" @click='${this._actionHandle}'>Couleur de fond</button>
                    <button class="action-button" name="border_color" @click='${this._actionHandle}'>Couleur des bords</button>

                    <div style="margin-top: 25px">
                        <strong>Opérations</strong>
                    </div>
                    <button class="action-button" name="merge_shapes" @click='${this._actionHandle}'>Fusionner</button>
                    <button class="action-button" name="divide_segment" @click='${this._actionHandle}'>Diviser</button>
                    <button class="action-button" name="cut_shape" @click='${this._actionHandle}'>Découper</button>
                    <button class="action-button" name="duplicate_shape" @click='${this._actionHandle}'>Dupliquer</button>
                    <button class="action-button" name="build_shape_center" @click='${this._actionHandle}'>Construire le centre</button>
                </div>
            </div>

            <div-main-canvas id="div-main-canvas"></div-main-canvas>
        </div>

        <shapes-list .family="${this.currentFamily}"
                     name="choose_shape_in_list"
                     @selected-shape='${this._actionHandle}'>
        </shapes-list>

        <divide-popup></divide-popup>
        `
    }

    firstUpdated() {
        window.canvasLeftShift = this.shadowRoot.getElementById("app-canvas-view-toolbar").clientWidth;
        //var canvasTopShift = 0;
    }

    /**
     * Main event handler
     */
    _actionHandle(event) {

        this.currentFamily = ''

        var states = {
            'move_shape': 'Glisser',
            'rotate_shape': 'Tourner',
            'global_zoom': 'Zoom',
            'delete_shape': 'Supprimer',
            'background_color': 'Couleur de fond',
            'border_color': 'Couleur des bords',
            'link_shapes': 'Lier des formes',
            'unlink_shapes': 'Délier des formes',
            'reverse_shape': 'Retourner',
            'build_shape_center': 'Construire le centre',
            'duplicate_shape': 'Dupliquer',
            'divide_segment': 'Diviser',
            'merge_shapes': 'Fusionner',
            'cut_shape': 'Découper',
            'moveplane_state': 'Glisser le plan'
        };

        if (states.hasOwnProperty(event.target.name)) {
            window.app.colorpicker.cancel();
            if (window.app.workspace.history.isRunning) {
                console.log("history is running, skipping action");
                return;
            }
            window.app.setState(event.target.name);
            this.currentMode = states[event.target.name];
        } else if (event.target.name == "settings") {
            window.app.colorpicker.cancel();
            document.getElementById('settings-popup-gray').style.display = 'block';
        } else if (event.target.name == "annuler") {
            window.app.colorpicker.cancel();
            window.app.workspace.history.cancelLastStep();
        } else if (event.type == "selected-shape") {
            this.currentFamily = null
            window.app.colorpicker.cancel();
            this.currentMode = 'Ajouter forme';
        } else {
            console.log("AGTabletteApp._actionHandle: received unknown event:");
            console.log(event);
        }
    }

    /**
     * Récupérer la liste des familles
     * @return liste des noms des familles ([String])
     */
    _getFamilies() {
        return Workspace.getMenuAFamiliesNames();
    }
}
customElements.define('ag-tablette-app', AGTabletteApp)
