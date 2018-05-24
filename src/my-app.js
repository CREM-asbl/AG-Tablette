import { PolymerElement, html } from '@polymer/polymer';
import './main-canvas.js';
import './canvas-button.js';
import './shapes-list.js';
import { stdShapes } from './formes-standard'
import { setMode } from './operations/mode'
import { translateMode } from './operations/translate'
import { rotationMode } from './operations/rotation'

class MyApp extends PolymerElement {
    static get template() {
        return html`
        <style>
            :host {
                position: relative;
                display: block;
                height: 100vh;
            }

            main-canvas {
                width: 100%;
                height: 100%;
            }

            .toolbar {
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                width: 200px;
                padding: 16px;
                background-color: rgba(30, 30, 30, .5);
                color: white;
            }

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
            }

            canvas-button {
                display: inline-block;
                width: 50px;
                height: 50px;
                margin: 4px;
            }
        </style>

        <main-canvas id="mainCanvas"></main-canvas>

        <div class="toolbar">
            <div>
                <button class="action-button" name="annuler" on-click="_actionHandle" disabled="">Annuler</button>
                <!--<button class="action-button" name="modifier" on-click='_actionHandle'>Modifier</button>-->
            </div>
            <div>
                <strong>Mouvements</strong>
            </div>
            <button class="action-button" name="Glisser" on-click="_actionHandle">Glisser</button>
            <button class="action-button" name="Tourner" on-click="_actionHandle">Tourner</button>
            <!-- <button class="action-button" name="retourner" on-click='_actionHandle'>Retouner</button> -->
            <!-- <button class="action-button" name="zoomer" on-click='_actionHandle'>Zoomer</button> -->

            <div>
                <strong>Formes standard</strong>
            </div>

            <template is="dom-repeat" items="[[_getFamilies()]]">
                <canvas-button family="[[item]]" active="{{currentFamily}}"></canvas-button>
            </template>
        </div>

        <shapes-list family="[[currentFamily]]"></shapes-list>

        <!--                         <div class="item">Fichier</div>
                        <div class="item">Fenêtre</div>
                        <div class="item">Edition</div>
                        <div class="item">Outils</div>
                        <div class="item">Opérations</div>
                        <div class="item">Transformations</div>
                        <div class="item">Macros</div>
                        <div class="item">Préférences</div>
                        <div class="item">Notes</div>
                        <div class="item">Aide</div>
                        <div class="item">Configuration</div> -->
`;
    }

    static get is() { return 'my-app' }

    static get properties() {
        return {
            currentFamily: String
        }
    }

    ready() {
        super.ready()
        window.mainCanvas = this.$.mainCanvas.$.svg
    }

    _actionHandle(event) {
        this.currentFamily = ''
        switch (event.target.name) {
            case 'Glisser':
                setMode(translateMode)
                break

            case 'Tourner':
                setMode(rotationMode)
                break
        }
    }

    _getFamilies() {
        return Object.keys(stdShapes)
    }
}
customElements.define('my-app', MyApp)