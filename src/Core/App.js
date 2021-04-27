import { Settings } from './Settings';
import { uniqId } from './Tools/general';

window.dev_mode = location.hostname === 'localhost';

/**
 * Classe principale de l'application
 */
export class App {
  constructor() {
    //Paramètres de l'application
    this.settings = new Settings();
    this.initSettings();

    this.canvasWidth = null;
    this.canvasHeight = null;

    // L'outil sélectionné
    this.tool = {};

    // Les outils possibles
    this.tools = [];

    this.workspaceSettings = {
      numberOfDivisionParts: 2,
      shapeFillColor: '#000000',
      shapeBorderColor: '#000000',
      shapeOpacity: 0.7,
      gridShown: false,
      gridType: 'Aucune',
      gridSize: 1,
    };

    this.fullHistory = {
      actionIndex: 0,
      numberOfActions: 0,
    }

    // compteur d'écouteurs pour certains event
    this.listenerCounter = {};
  }

  /* #################################################################### */
  /* ########################## INIT FUNCTIONS ########################## */
  /* #################################################################### */

  /**
   * Initialiser les paramètres de l'application
   */
  initSettings() {
    this.initNonEditableSettings();
    this.initEditableSettings();
  }

  initNonEditableSettings() {
    /**
     * Distance en dessous de laquelle 2 points se collent l'un à l'autre (quand on ajoute une forme par exemple)
     */
    this.settings.set('magnetismDistance', 10);

    /**
     * Distance maximale entre les coordonnées du clic et un élément, pour
     * qu'il puisse être sélectionné.
     */
    this.settings.set('selectionDistance', 20);

    /**
     * La précision, en pixels. (2 points à moins de 'precision' pixels de distance sont considérés comme étant au même endroit )
     */
    this.settings.set('precision', 1.5);

    // Niveau de zoom maximal de l'interface
    this.settings.set('maxZoomLevel', 10);

    // Niveau de zoom minimal de l'interface
    this.settings.set('minZoomLevel', 0.1);

    // Largeur du menu de gauche de l'application
    this.settings.set('mainMenuWidth', 250);

    // Couleur de dessin des contraintes
    this.settings.set('constraintsDrawColor', '#080');

    // Couleur de dessin des formes temporaires (Géométrie)
    this.settings.set('temporaryDrawColor', '#E90CC8');
  }

  initEditableSettings() {
    // Ajustement automatique des formes activé ?
    this.settings.set('automaticAdjustment', true);

    // true si les formes ajoutées à l'avenir auront leurs sommets visibles
    this.settings.set('areShapesPointed', true);

    // taille des formes qui seront ajoutées (1, 2 ou 3)
    this.settings.set('shapesSize', 2);
  }

  addListener(listenerName, func) {
    const id = uniqId();
    if (!this.listenerCounter[listenerName]) {
      this.listenerCounter[listenerName] = {};
    }
    this.listenerCounter[listenerName][id] = func;
    window.addEventListener(listenerName, func);
    return id;
  }

  removeListener(listenerName, id) {
    if (!id || !this.listenerCounter[listenerName]) {
      return;
    }
    window.removeEventListener(
      listenerName,
      this.listenerCounter[listenerName][id],
    );
    this.listenerCounter[listenerName][id] = null;
  }

  dispatchEv(event) {
    if (app.listenerCounter[event.type]) {
      window.dispatchEvent(event);
    }
  }

  resetSettings() {
    this.initEditableSettings();
    window.dispatchEvent(new CustomEvent('app-settings-changed'));
    window.dispatchEvent(new CustomEvent('refresh'));
  }

  start() {
    window.onresize = () => {
      this.refreshWindow();
    };
    window.onorientationchange = () => {
      this.refreshWindow();
    };

    window.dispatchEvent(new CustomEvent('app-started'));
  }

  /* #################################################################### */
  /* ############################## OTHER ############################### */
  /* #################################################################### */

  refreshWindow() {
    window.dispatchEvent(new CustomEvent('setCanvasSize'));
  }

  /**
   * Définir l'état actuel de l'application (l'outil actuel)
   * @param {String} stateName   Le nom de l'état
   * @param {Object} startParams paramètres à transmettre à state.start()
   */
  setState(stateName, startParams) {
    this.state = stateName || undefined;
    window.dispatchEvent(
      new CustomEvent('app-state-changed', {
        detail: { state: app.state, startParams: startParams },
      }),
    );

    window.dispatchEvent(new CustomEvent('refresh'));
    window.dispatchEvent(new CustomEvent('refreshUpper'));
  }
}

export const app = new App();

//Préparation à un state-changed plus général
//Ceci permettra aussi de réduire le nombre de listener par la suite
export const setState = (update) => {
  // app n'est pour l'instant pas itérable
  // app = [...app, update]
  for (let key in update) {
    app[key] = update[key];
  }
  // if (window.dev_mode) console.log(app);
  window.dispatchEvent(new CustomEvent('state-changed', { detail: app }));
  if ('tool' in update) {
    let toolInfo = app.tools.find(tool => tool.name == app.tool?.name);
    if (toolInfo) {
      app.tool.title = toolInfo.title;
      app.tool.type = toolInfo.type;
    }
    window.dispatchEvent(new CustomEvent('tool-changed', { detail: app }));
  }
  if ('workspaceSettings' in update) {
    window.dispatchEvent(new CustomEvent('workspaceSettings-changed', { detail: app }));
  }
  if ('fullHistory' in update) {
    window.dispatchEvent(new CustomEvent('fullHistory-changed', { detail: app }));
  }
  window.dispatchEvent(new CustomEvent('refreshUpper'));
  window.dispatchEvent(new CustomEvent('refresh'));
  window.dispatchEvent(new CustomEvent('refreshBackground'));
};
