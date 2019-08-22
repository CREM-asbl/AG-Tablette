import { Workspace } from './Objects/Workspace'
import { DrawAPI } from './DrawAPI'
import { InteractionAPI } from './InteractionAPI'
import { Settings } from './Settings'
import { StatesManager } from './StatesManager'
import { GrandeurEnvironment } from './Environments/Grandeur'
import { uniqId } from './Tools/general'
import { WorkspaceManager } from './WorkspaceManager'
import { EnvironmentManager } from './EnvironmentManager'
import { TangramManager } from './TangramManager'

/**
 * Classe principale de l'application
 */
export class App {

    constructor() {
        //Managers:
        this.wsManager = new WorkspaceManager();
        this.envManager = new EnvironmentManager();
        this.tangramManager = TangramManager;

        //Paramètres de l'application
        this.settings = new Settings();
        this.initSettings();

        //Représente un projet, qui peut être sauvegardé/restauré.
		this.workspace = new Workspace(this.envManager.getNewEnv('Grandeur'));

        //L'API de dessin (tout ce qui est lié au <canvas>)
        this.drawAPI = null;


        //Référence vers le <div> contenant les canvas
        this.cvsDiv = null;
        //Référence vers le <div> principal de l'app
        this.appDiv = null;

        //L'API d'interaction (tout ce qui est lié aux événements)
        this.interactionAPI = new InteractionAPI();

        //L'état de l'application
        this.state = null;

        //Liste de classes State qui tournent en permanence (ex: zoom à 2 doigts)
        this.permanentStates = [];

        //menu pouvant être contrôlé par un état (State).
        this.stateMenu = null;

        //Liste des tangrams
        this.tangrams = {
            main: [], //Tangrams CREM
            local: [] //Tangrams ajoutés par l'utilisateur.
        };
    }

    /* #################################################################### */
    /* ########################## INIT FUNCTIONS ########################## */
    /* #################################################################### */

    /**
     * Initialiser les paramètres de l'application
     */
    initSettings() {
        /**
         * Distance en dessous de laquelle 2 points se collent l'un à l'autre (quand on ajoute une forme par exemple)
         */
        this.settings.add("magnetismDistance", 10, false);

        /**
         * La précision, en pixels. (2 points à moins de 'precision' pixels de distance sont considérés comme étant au même endroit )
         */
        this.settings.add("precision", 1.5, false);

        //Niveau de zoom maximal de l'interface
        this.settings.add("maxZoomLevel", 10, false);

        //Niveau de zoom minimal de l'interface
        this.settings.add("minZoomLevel", 0.1, false);


        //Ajustement automatique des formes activé ?
        this.settings.add("automaticAdjustment", true, true);

        //true si les formes ajoutées à l'avenir auront leurs sommets visibles
        this.settings.add("areShapesPointed", true, true);

        //taille des formes qui seront ajoutées (1, 2 ou 3)
        this.settings.add("shapesSize", 2, true);
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
        this.tangramManager.retrieveTangrams();
    }

    /* #################################################################### */
    /* ############################## OTHER ############################### */
    /* #################################################################### */

    refreshWindow() {
        this.cvsDiv.setCanvasSize();
    }

    /**
     * Temporaire, juste pour le debug: affiche un message à l'écran (sur un
     * canvas spécifique)
     */
    showMessageOnCanvas(text) {
        return
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
            //Par exemple, annule des setTimeout/Interval.
            this.state.abort();
        }
        //Reset state-menu
        this.stateMenu.configureButtons([]);

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

    addPermanentState(stateName) {
        let state = StatesManager.getPermanentStateInstance(stateName);
        if (!state) return
        this.permanentStates.push(state);
        state.start();
    }
}

export let app

if(!app) {
    app = new App();
}
