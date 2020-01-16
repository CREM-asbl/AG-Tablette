import { Workspace } from './Objects/Workspace';
import { InteractionAPI } from './InteractionAPI';
import { Settings } from './Settings';
import { WorkspaceManager } from './WorkspaceManager';
import { EnvironmentManager } from './EnvironmentManager';
import { TangramManager } from './TangramManager';
import { Point } from './Objects/Point';

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

    this.canvas = [];

    //Référence vers le <div> contenant les canvas
    this.cvsDiv = null;
    //Référence vers le <div> principal de l'app
    this.appDiv = null;

    //L'état de l'application
    this.state = null;

    // Les états possibles
    this.states = [];

    // Les actions possibles
    this.actions = [];

    // Liste des shapes a ne pas redessiner pendant une action
    this.editingShapes = [];

    //Liste de classes State qui tournent en permanence (ex: zoom à 2 doigts)
    this.permanentStates = [];

    //menu pouvant être contrôlé par un état (State).
    this.stateMenu = null;

    // Coordonnées du dernier événement
    this.lastKnownMouseCoordinates = { x: 0, y: 0 };

    // Couleur sélectionnée pour border- ou backgroundColor
    this.selectedColor = '#000';

    // Historique des actions
    this.history = [];

    // Index de la dernière action effectuée dans app.history
    this.historyIndex = null;

    // contrainte de sélection pour formes, segments et points
    this.selectionConstraints = null;

    //Liste des tangrams
    this.tangrams = {
      main: [], //Tangrams CREM
      local: [], //Tangrams ajoutés par l'utilisateur.
    };

    //références vers les popup
    this.popups = {};

    this.hasNativeFS = 'chooseFileSystemEntries' in window;
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
    window.dispatchEvent(new CustomEvent('refresh'));
  }

  start() {
    // Représente un projet, qui peut être sauvegardé/restauré.
    this.workspace = new Workspace(this.envManager.getNewEnv('Grandeur'));

    window.onresize = () => {
      this.refreshWindow();
    };
    window.onorientationchange = () => {
      this.refreshWindow();
    };

    // //Utilisé pour les animations
    // window.requestAnimFrame = (function() {
    //   return (
    //     window.requestAnimationFrame ||
    //     function(callback) {
    //       window.setTimeout(callback, 1000 / 20);
    //     }
    //   );
    // })();

    // this.addPermanentState('permanent_zoom_plane');
    // this.tangramManager.retrieveTangrams();
    window.dispatchEvent(new CustomEvent('app-started'));
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
    this.state = stateName || undefined;

    //Reset state-menu
    // this.stateMenu.configureButtons([]); => utilité ?

    window.dispatchEvent(
      new CustomEvent('app-state-changed', { detail: { startParams: startParams } }),
    );

    window.dispatchEvent(new CustomEvent('refresh'));
    window.dispatchEvent(new CustomEvent('refreshUpper'));
  }
}

export let app;

if (!app) {
  app = new App();
}
