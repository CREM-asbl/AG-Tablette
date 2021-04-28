import { uniqId } from './Tools/general';

window.dev_mode = location.hostname === 'localhost';

/**
 * Classe principale de l'application
 */
export class App {
  constructor() {
    this.canvasWidth = null;
    this.canvasHeight = null;

    // L'outil sélectionné
    this.tool = {};

    // Les outils possibles
    this.tools = [];

    this.settings = {
      'magnetismDistance': 10,
      'selectionDistance': 20,
      'precision': 1.5,
      'maxZoomLevel': 10,
      'minZoomLevel': 0.1,
      'mainMenuWidth': 250,
      'constraintsDrawColor': '#080',
      'temporaryDrawColor': '#E90CC8',

      'automaticAdjustment': true,
      'areShapesPointed': true,
      'shapesSize': 2,
      'numberOfDivisionParts': 2,
      'shapeFillColor': '#000000',
      'shapeBorderColor': '#000000',
      'shapeOpacity': 0.7,
      'gridShown': false,
      'gridType': 'none',
      'gridSize': 1,
    }

    this.defaultSettings = {...this.settings};

    this.fullHistory = {
      actionIndex: 0,
      numberOfActions: 0,
    }

    // compteur d'écouteurs pour certains event
    this.listenerCounter = {};
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
    setState({ settings: {
      ...app.defaultSettings
    }});
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
  if ('settings' in update) {
    window.dispatchEvent(new CustomEvent('settings-changed', { detail: app }));
  }
  if ('settings' in update) {
    window.dispatchEvent(new CustomEvent('appSettings-changed', { detail: app }));
  }
  if ('fullHistory' in update) {
    window.dispatchEvent(new CustomEvent('fullHistory-changed', { detail: app }));
  }
  window.dispatchEvent(new CustomEvent('refreshUpper'));
  window.dispatchEvent(new CustomEvent('refresh'));
  window.dispatchEvent(new CustomEvent('refreshBackground'));
};
