import { Workspace } from './Objects/Workspace';
import { InteractionAPI } from './InteractionAPI';
import { Settings } from './Settings';
import { StatesManager } from './StatesManager';
import { WorkspaceManager } from './WorkspaceManager';
import { EnvironmentManager } from './EnvironmentManager';
import { TangramManager } from './TangramManager';

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
      local: [], //Tangrams ajoutés par l'utilisateur.
    };

    //références vers les popup
    this.popups = {};
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
    this.settings.set('magnetismDistance', 10, false);

    /**
     * Distance maximale entre les coordonnées du clic et un élément, pour
     * qu'il puisse être sélectionné.
     */
    this.settings.set('selectionDistance', 20, false);

    /**
     * La précision, en pixels. (2 points à moins de 'precision' pixels de distance sont considérés comme étant au même endroit )
     */
    this.settings.set('precision', 1.5, false);

    //Niveau de zoom maximal de l'interface
    this.settings.set('maxZoomLevel', 10, false);

    //Niveau de zoom minimal de l'interface
    this.settings.set('minZoomLevel', 0.1, false);

    //Ajustement automatique des formes activé ?
    this.settings.set('automaticAdjustment', true, true);

    //true si les formes ajoutées à l'avenir auront leurs sommets visibles
    this.settings.set('areShapesPointed', true, true);

    //taille des formes qui seront ajoutées (1, 2 ou 3)
    this.settings.set('shapesSize', 2, true);

    //Largeur du menu de gauche de l'application
    this.settings.set('mainMenuWidth', 250, false);
  }

  resetSettings() {
    this.initSettings();
    dispatchEvent(new CustomEvent('app-settings-changed'));
    this.drawAPI.askRefresh();
  }

  start(cvsDiv) {
    this.cvsDiv = cvsDiv;
    window.onresize = () => {
      this.refreshWindow();
    };
    window.onorientationchange = () => {
      this.refreshWindow();
    };

    //Utilisé pour les animations
    window.requestAnimFrame = (function() {
      return (
        window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function(callback) {
          window.setTimeout(callback, 1000 / 20);
        }
      );
    })();

    this.addPermanentState('permanent_zoom_plane');
    this.tangramManager.retrieveTangrams();
  }

  /* #################################################################### */
  /* ############################## OTHER ############################### */
  /* #################################################################### */

  refreshWindow() {
    this.cvsDiv.setCanvasSize();
  }

  /**
   * Définir l'état actuel de l'application (l'outil actuel)
   * @param {String} stateName   Le nom de l'état
   * @param {Object} startParams paramètres à transmettre à state.start()
   */
  setState(stateName, startParams) {
    if (this.state) {
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
    if (!state) return;
    this.permanentStates.push(state);
    state.start();
  }

  openFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      const dataObject = JSON.parse(reader.result);
      if (dataObject.appSettings) {
        this.settings.initFromObject(dataObject.appSettings);
        dispatchEvent(new CustomEvent('app-settings-changed'));
      }
      this.wsManager.setWorkspaceFromJSON(reader.result);
    };
    reader.readAsText(file);
  }

  saveToFile(fileName) {
    let saveObject = {};
    saveObject.appSettings = this.settings.data;

    if (!fileName) {
      let prompt = window.prompt('Nom du fichier: ');
      if (prompt === null) return;
      if (prompt === '') prompt = 'untitled';
      fileName = prompt + '.json';
    }

    saveObject = { ...saveObject, ...this.workspace.data };
    let json = JSON.stringify(saveObject);

    const file = new Blob([json], { type: 'application/json' });

    const downloader = document.createElement('a');
    downloader.href = window.URL.createObjectURL(file);
    downloader.download = fileName;
    downloader.target = '_blank';
    document.body.appendChild(downloader);
    downloader.click();
    document.body.removeChild(downloader);
  }
}

export let app;

if (!app) {
  app = new App();
}
