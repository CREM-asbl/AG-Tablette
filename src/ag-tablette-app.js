import { LitElement, html } from 'lit-element'
import './canvas-button'
import './shapes-list'
import './div-main-canvas'
import './app-settings'
// import './divide-popup'
import './js/Manifest'
import './new-popup'
import { dico } from './js/Dico'

// Chargement des States
// TODO: à remplacer par chargement 'dynamique'
import './js/States/BackgroundColor'
import './js/States/BorderColor'
import './js/States/BuildCenter'
import './js/States/Create'
import './js/States/Cut'
import './js/States/Divide'
import './js/States/Delete'
import './js/States/Duplicate'
import './js/States/GlobalZoom'
import './js/States/Linker'
import './js/States/Merge'
import './js/States/Move'
import './js/States/MovePlane'
import './js/States/Reverse'
import './js/States/Rotate'
import './js/States/Unlinker'
import { standardShapes } from './js/StandardShapes';


class AGTabletteApp extends LitElement {

    static get properties() {
        return {
            state: Object,
            families: Array
        }
    }

    constructor() {
        super()
        this.families = Object.keys(standardShapes)
        this.state = {}

        addEventListener('app-state-changed', event => this.state = { ...event.detail })
    }

    render() {
        return html`
        <style>
            #app-canvas-view {
                display: flex;
                width: 100%;
                margin: 0;
                padding: 0;
                height: 100%;
            }

            #app-canvas-view > .toolbar {
                display: flex;
                flex-flow: column;
                width: 20%;
                min-width: 180px;
                float:left;
                padding: 4px;
                height: 100%;
                box-sizing: border-box;
                border-right: 1px solid gray;
                background-color: #ddd;
            }

            #app-canvas-view-toolbar-p1 {
                padding-bottom: 8px;
                border-bottom: 1px solid lightslategray;
            }

            #app-canvas-view-toolbar-p2 {
                flex: 1;
                overflow-y: auto;
            }

            .action-button {
                display: block;
                box-sizing: border-box;
                width: 100%;
                height: 32px;
                margin: 8px 0;
            }

            .action-button:hover,
            .action-button:focus,
            .action-button[active] {
                font-weight: bold;
                color: white;
                background: gray;
                outline: none;
            }

            .toolbar-separator {
                font-weight: bold;
                margin: 12px 0;
            }

            canvas-button {
                display: inline-block;
                width: 50px;
                height: 50px;
                margin: 2px;
            }

            div-main-canvas {
                width: 100%;
                height: 100%;
            }

            shapes-list {
                position: absolute;
                bottom: 0;
                left: 20%;
                max-width: 79%;
                box-shadow: 0 1px 3px gray;
                z-index: 100;
                box-sizing: border-box;
            }

            #app-canvas-mode-text {
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
            }

            #app-canvas-mode-text span{
                color: #444;
            }
        </style>

        <div id="app-canvas-view">
            <div id="app-canvas-view-toolbar" class="toolbar">
                <div id="app-canvas-view-toolbar-p1">
                        <div id="app-canvas-mode-text">
                            <span>Mode: </span>${dico[this.state.name]}
                        </div>
                            <button class="action-button"
                                    name="new"
                                    @click="${this._actionHandle}">
                                    Supprimer tout
                            </button>
                            <button class="action-button"
                                    name="delete_shape"
                                    ?active="${this.state.name === 'delete_shape'}"
                                    @click='${this._actionHandle}'>
                                    Supprimer
                            </button>
                            <button class="action-button"
                                    name="undo"
                                    @click='${this._actionHandle}'>
                                    Annuler
                            </button>
                        <button class="action-button"
                                    name="save"
                                    @click='${this.save}'>
                                    Sauvegarder
                            </button>
                            <button class="action-button"
                                    name="load"
                                    @click='${() => this.shadowRoot.querySelector("#fileSelector").click()}'>
                                    Charger
                            </button>
                            <button class="action-button"
                                    name="settings"
                                    @click='${this._actionHandle}'>
                                    Paramètres
                            </button>

                        <div class="toolbar-separator">Formes standard</div>

                        ${this.families.map(family => html`
                            <canvas-button name="create_shape"
                                          .family="${family}"
                                           ?active="${family === this.state.selectedFamily}"
                                           @click="${this._actionHandle}">
                            </canvas-button>
                        `)}
                </div>

                <div id="app-canvas-view-toolbar-p2">
                    <div class="toolbar-separator">Mouvements</div>
                    <button class="action-button"
                            name="move_shape"
                            ?active="${this.state.name === 'move_shape'}"
                            @click='${this._actionHandle}'>
                            Glisser
                    </button>
                    <button class="action-button"
                            name="rotate_shape"
                            ?active="${this.state.name === 'rotate_shape'}"
                            @click='${this._actionHandle}'>
                            Tourner
                    </button>
                    <button class="action-button"
                            name="reverse_shape"
                            ?active="${this.state.name === 'reverse_shape'}"
                            @click='${this._actionHandle}'>
                            Retourner
                    </button>

                    <div class="toolbar-separator">Opérations</div>
                    <button class="action-button"
                            name="build_shape_center"
                            ?active="${this.state.name === 'build_shape_center'}"
                            @click='${this._actionHandle}'>
                            Construire le centre
                    </button>
                    <button class="action-button"
                            name="divide_segment"
                            ?active="${this.state.name === 'divide_segment'}"
                            @click='${this._actionHandle}'>
                            Diviser
                    </button>
                    <button class="action-button"
                            name="cut_shape"
                            ?active="${this.state.name === 'cut_shape'}"
                            @click='${this._actionHandle}'>
                            Découper
                    </button>
                    <button class="action-button"
                            name="duplicate_shape"
                            ?active="${this.state.name === 'duplicate_shape'}"
                            @click='${this._actionHandle}'>
                            Copier
                    </button>
                    <button class="action-button"
                            name="merge_shapes"
                            ?active="${this.state.name === 'merge_shapes'}"
                            @click='${this._actionHandle}'>
                            Fusionner
                    </button>

                    <div class="toolbar-separator">Outils</div>
                    <button class="action-button"
                            name="moveplane_state"
                            ?active="${this.state.name === 'moveplane_state'}"
                            @click='${this._actionHandle}'>
                            Glisser le plan
                    </button>
                    <button class="action-button"
                            name="global_zoom"
                            ?active="${this.state.name === 'global_zoom'}"
                            @click='${this._actionHandle}'>
                            Zoomer
                    </button>
                    <button class="action-button"
                            name="link_shapes"
                            ?active="${this.state.name === 'link_shapes'}"
                            @click='${this._actionHandle}'>
                            Grouper
                    </button>
                    <button class="action-button"
                            name="unlink_shapes"
                            ?active="${this.state.name === 'unlink_shapes'}"
                            @click='${this._actionHandle}'>
                            Dégrouper
                    </button>
                    <button class="action-button"
                            name="background_color"
                            ?active="${this.state.name === 'background_color'}"
                            @click='${this._actionHandle}'>
                            Colorier les formes
                    </button>
                    <button class="action-button"
                            name="border_color"
                            ?active="${this.state.name === 'border_color'}"
                            @click='${this._actionHandle}'>
                            Colorier les bords
                    </button>
                </div>
            </div>

            <div-main-canvas id="div-main-canvas"></div-main-canvas>
        </div>

        <shapes-list .state="${this.state}"></shapes-list>

        <app-settings></app-settings>

        <new-popup></new-popup>

        <a id="dataDownloader" hidden target="_blank"></a>

        <input id="fileSelector"
               accept=".json"
               type="file"
               style="display: none"
               @change=${event => app.loadFromFile(event.target.files[0])}>
        `
    }

    firstUpdated() {
        window.canvasLeftShift = this.shadowRoot.getElementById("app-canvas-view-toolbar").clientWidth;
    }

    /**
     * Main event handler
     */
    _actionHandle(event) {

        if (event.target.name == "settings") {
            window.app.setState("no_state")
            this.shadowRoot.querySelector('app-settings').style.display = 'block'
        }

        else if (event.target.name === "new") {
            window.app.setState("no_state");
            this.shadowRoot.querySelector('new-popup').open()
        }

        else if (event.target.name == "undo") {
            window.app.setState("no_state");
            window.app.workspace.history.cancelLastStep();
        }

        else if (event.target.name === 'create_shape') {
            app.setState(event.target.name, { family: event.target.family })
        }

        else if (dico[event.target.name]) {
            if (window.app.workspace.history.isRunning) {
                console.log("history is running, skipping action");
                return;
            }
            window.app.setState(event.target.name);
        }

        else {
            console.log("AGTabletteApp._actionHandle: received unknown event:");
            console.log(event);
        }
    }

    save() {
        let json = JSON.stringify(app.workspace.getSaveData())
        const file = new Blob([json], { type: 'text/json' })
        const downloader = this.shadowRoot.querySelector('#dataDownloader')
        downloader.href = window.URL.createObjectURL(file)
        downloader.download = 'save.json'
        downloader.click()
    }
}
customElements.define('ag-tablette-app', AGTabletteApp)
