import { Workspace } from './Objects/Workspace'
import { DrawAPI } from './DrawAPI'
import { InteractionAPI } from './InteractionAPI'
import { Settings } from './Settings'
import { StatesManager } from './StatesManager'
import { GrandeurEnvironment } from './Environments/Grandeur'
import { uniqId } from './Tools/general'
import { WorkspaceManager } from './WorkspaceManager'

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

        //L'API d'interaction (tout ce qui est lié aux événements)
        this.interactionAPI = new InteractionAPI();

        //L'état de l'application
        this.state = null;


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

    start(cvsDiv) {
        const onresize = e => {
			cvsDiv.setCanvasSize();
            let leftShift = document.getElementsByTagName("ag-tablette-app")[0]
                            .shadowRoot.getElementById("app-canvas-view-toolbar")
                            .clientWidth;
			window.canvasLeftShift = leftShift;
		};
		window.onresize = onresize;
		window.onorientationchange = onresize;

        //Utilisé pour les animations.
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
    }
}

export let app

if(!app) {
    app = new App();
}
