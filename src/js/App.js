import { Workspace } from './Objects/Workspace'
import { DrawAPI } from './DrawAPI'
import { InteractionAPI } from './InteractionAPI'
import { Settings } from './Settings'
import { StatesManager } from './StatesManager'
import { GrandeurEnvironment } from './Environments/Grandeur'
import { uniqId } from './Tools/general'
import { WorkspaceManager } from './WorkspaceManager'
import { EnvironmentManager } from './EnvironmentManager'

/**
 * Classe principale de l'application
 */
export class App {

    constructor() {
        //Managers:
        this.wsManager = new WorkspaceManager();
        this.envManager = new EnvironmentManager();

        //Paramètres de l'application (accessibles partout via l'objet app)
        this.settings = new Settings();

        //Représente un projet, qui peut être sauvegardé/restauré.
		this.workspace = new Workspace(this.envManager.getNewEnv('Grandeur'));

        //L'API de dessin (tout ce qui est lié au <canvas>)
        this.drawAPI = null;

        //Référence vers le <div> contenant les canvas
        this.cvsDiv = null;
        this.appDiv = null;

        //L'API d'interaction (tout ce qui est lié aux événements)
        this.interactionAPI = new InteractionAPI();

        //L'état de l'application
        this.state = null;

        //Liste de classes State qui tournent en permanence (ex: zoom à 2 doigts)
        this.permanentStates = [];

    }

    /**
     * Temporaire, juste pour le debug: affiche un message à l'écran (sur un
     * canvas spécifique)
     */
    showMessageOnCanvas(text) {
        if(this.__msgHistory === undefined) this.__msgHistory = [];
        const maxChar = 50;

        if(typeof text !== 'string')
            text = JSON.stringify(text);

        text.split('\n').forEach(line => {
            for(let i=0; i<line.length; i+=maxChar)
                this.__msgHistory.unshift(line.slice(i, i+maxChar));
        });

        this.__debugCtx.clearRect(-100, -100, 5000, 5000);

        let pos = 30;
        this.__msgHistory.forEach(line => {
            let coords = {
                'x': 10,
                'y': pos
            };
            this.drawAPI.drawText(this.__debugCtx, line, coords);
            pos += 16;
        });
    }

    /**
     * Définir l'état actuel de l'application (l'outil actuel)
     * @param {String} stateName   Le nom de l'état
     * @param {Object} startParams paramètres à transmettre à state.start()
     */
    setState(stateName, startParams) {
        if(this.state) {
            this.state.abort();
        }
        //Reset interactionAPI parameters:
        this.interactionAPI.resetSelectionConstraints();
        this.forwardEventsToState = true;
        this.selectObjectBeforeNativeEvent = false;

        this.state = StatesManager.getStateInstance(stateName);
        this.state.start(startParams);

        window.dispatchEvent(new CustomEvent('app-state-changed', { detail: this.state }));
        this.drawAPI.askRefresh();
        this.drawAPI.askRefresh('upper');
    }

    /**
     * Définir et configurer l'API de dessin
     * @param {HTMLElement} upperCanvas      Canvas pour l'animation courante
     * @param {HTMLElement} mainCanvas       Canvas principal
     * @param {HTMLElement} backgroundCanvas Canvas pour la grille
     */
    setCanvas(upperCanvas, mainCanvas, backgroundCanvas) {
        let api = new DrawAPI(upperCanvas, mainCanvas, backgroundCanvas, this);
        this.drawAPI = api;
	}

    refreshWindow() {
        this.cvsDiv.setCanvasSize();
        let leftShift = document.getElementsByTagName("ag-tablette-app")[0]
                        .shadowRoot.getElementById("app-canvas-view-toolbar")
                        .clientWidth;
        window.canvasLeftShift = leftShift;
    }

    start(cvsDiv) {
        this.cvsDiv = cvsDiv;
		window.onresize = (event) => { this.refreshWindow(); };
		window.onorientationchange = (event) => { this.refreshWindow(); };

        //Utilisé pour les animations
		window.requestAnimFrame = (function () {
			return window.requestAnimationFrame
				|| window.webkitRequestAnimationFrame
				|| window.mozRequestAnimationFrame
				|| window.oRequestAnimationFrame
				|| window.msRequestAnimationFrame
				|| function (callback) {
					window.setTimeout(callback, 1000 / 20);
				};
		})();

        this.addPermanentState("permanent_zoom_plane");
    }

    addPermanentState(stateName) {
        let state = StatesManager.getPermanentStateInstance(stateName);
        this.permanentStates.push(state);
        state.start();
    }
}

export let app

if(!app) {
    app = new App();
}
