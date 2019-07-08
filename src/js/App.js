import { Workspace } from './Objects/Workspace'
import { DrawAPI } from './DrawAPI'
import { InteractionAPI } from './InteractionAPI'
import { Settings } from './Settings'
import { StatesManager } from './StatesManager'
import { GrandeurEnvironment } from './Environments/Grandeur'

/**
 * Classe principale de l'application
 */
export class App {

    constructor() {
        //Paramètres de l'application (accessibles partout via l'objet app)
        this.settings = new Settings();

        //Représente un projet, qui peut être sauvegardé/restauré.
		this.workspace = new Workspace(new GrandeurEnvironment());

        //L'API de dessin (tout ce qui est lié au <canvas>)
        this.drawAPI = null;

        //L'API d'interaction (tout ce qui est lié aux événements)
        this.interactionAPI = new InteractionAPI();

        //L'état de l'application
        this.state = null;
    }

    setState(stateName, startParams) {
        if(this.state) {
            this.state.abort();
        }
        this.state = StatesManager.getStateInstance(stateName);
        this.state.start(startParams);

        window.dispatchEvent(new CustomEvent('app-state-changed', { detail: this.state }));
    }

    /**
     * Définir et configurer l'API de dessin
     * @param {HTMLElement} upperCanvas      Canvas pour l'animation courante
     * @param {HTMLElement} mainCanvas       Canvas principal
     * @param {HTMLElement} backgroundCanvas Canvas pour la grille
     */
    setCanvas(upperCanvas, mainCanvas, backgroundCanvas) {
        this.drawAPI = new DrawAPI(upperCanvas, mainCanvas, backgroundCanvas, this);
	}

    start() {
        console.log("start!!"); //TODO: utile?
    }
}

export let app

if(!app) {
    app = new App();
}
