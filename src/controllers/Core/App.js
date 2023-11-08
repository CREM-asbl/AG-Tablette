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
    this.tool = null;

    // Les outils possibles
    this.tools = [];

    this.settings = {
      magnetismDistance: 20,
      selectionDistance: 20,
      precision: 1.5,
      maxZoomLevel: 10,
      minZoomLevel: 0.1,
      mainMenuWidth: 250,
      constraintsDrawColor: '#080',
      temporaryDrawColor: '#E90CC8',
      referenceDrawColor: '#a6dbff',
      referenceDrawColor2: '#4a88b2',

      geometryTransformationAnimationDuration: 2,
      geometryTransformationAnimation: false,

      automaticAdjustment: true,
      areShapesPointed: true,
      shapesSize: 2,
      numberOfDivisionParts: 2,
      numberOfRegularPoints: 3,
      shapesDrawColor: '#ff0000',
      shapeOpacity: 0.7,
      scalarNumerator: 1,
      scalarDenominator: 1,

      gridShown: false,
      gridType: 'none',
      gridSize: 1,
    };

    this.history = {
      index: -1,
      steps: [],
      startSituation: null,
      startSettings: { ...this.settings },
    };

    this.fullHistory = {
      index: 0,
      actionIndex: 0,
      numberOfActions: 0,
      steps: [],
      isRunning: false,
    };

    this.tangram = {
      isSilhouetteShown: false,
      currentStep: null,
      buttonText: null,
      buttonValue: null,
    }

    this.stepSinceSave = false,
      this.started = false;
    this.appLoading = false;
    this.nextGroupColorIdx = 0;

    this.notionsOpen = [
    ];

    this.sequencesOpen = [
    ];

    this.defaultState = {
      tool: null,
      settings: { ...this.settings },
      history: { ...this.history },
      fullHistory: { ...this.fullHistory },
      tangram: { ...this.tangram },
      stepSinceSave: this.stepSinceSave,
      notionsOpen: { ...this.notionsOpen },
    };

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
    // if (app.listenerCounter[event.type]) {
    window.dispatchEvent(event);
    // }
  }

  resetSettings() {
    setState({
      settings: {
        ...app.defaultState.settings,
        gridShown: app.settings.gridShown,
        gridType: app.settings.gridType,
        gridSize: app.settings.gridSize,
      },
    });
  }
}

export const app = new App();

//Préparation à un state-changed plus général
//Ceci permettra aussi de réduire le nombre de listener par la suite
export const setState = (update) => {
  // modifie le pointeur de app, du coup marche pas
  // app = {...Object.entries(app), ...Object.entries(update)};
  for (const [key, value] of Object.entries(update)) {
    app[key] = value;
  }
  window.dispatchEvent(new CustomEvent('state-changed', { detail: app }));
  if ('environment' in update) {
    window.dispatchEvent(new CustomEvent('environment-changed', { detail: app }));
  }
  if ('tool' in update) {
    let toolInfo = app.tools.find((tool) => tool.name == app.tool?.name);
    if (toolInfo) {
      app.tool.title = toolInfo.title;
      app.tool.type = toolInfo.type;
    }
    if (!app.tool || app.tool.currentStep == 'start') {
      window.dispatchEvent(new CustomEvent('tool-changed', { detail: app }));
    }
    window.dispatchEvent(new CustomEvent('tool-updated', { detail: app }));
  }
  if ('tangram' in update) {
    window.dispatchEvent(new CustomEvent('tangram-changed', { detail: app }));
  }
  if ('settings' in update) {
    window.dispatchEvent(new CustomEvent('settings-changed', { detail: app }));
  }
  if ('fullHistory' in update) {
    window.dispatchEvent(
      new CustomEvent('fullHistory-changed', { detail: app }),
    );
  }
  if ('history' in update) {
    window.dispatchEvent(new CustomEvent('history-changed', { detail: app }));
  }
  if ('started' in update) {
    window.dispatchEvent(new CustomEvent('app-started', { detail: app }));
  }
  if ('menuIconSize' in update) {
    window.dispatchEvent(new CustomEvent('menuIconSize-changed', { detail: app }));
  }
  if ('tools' in update) {
    window.dispatchEvent(new CustomEvent('tools-changed', { detail: app }));
  }
  if ('helpSelected' in update) {
    window.dispatchEvent(new CustomEvent('helpSelected-changed', { detail: app }));
  }
  if ('filename' in update) {
    window.dispatchEvent(new CustomEvent('filename-changed', { detail: app }));
  }
};
