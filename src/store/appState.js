/**
 * État global de l'application utilisant les signaux Lit
 * Remplace le StateManager custom pour éviter la duplication
 */

import { computed, signal } from '@lit-labs/signals';

const HELP_MODE_STORAGE_KEY = 'ag.help.beginnerModeEnabled';

const getInitialHelpSelected = () => {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(HELP_MODE_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

const persistHelpSelected = (selected) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(HELP_MODE_STORAGE_KEY, String(selected));
  } catch {
    // Silently ignore storage failures (private mode, quota, etc.)
  }
};

// Signaux pour l'état de l'application
export const appLoading = signal(false);
export const appError = signal(null);
export const appVersion = signal('1.0.0'); // Sera mis à jour au démarrage
export const appStarted = signal(false);

/**
 * Initialise la version de l'application depuis le manifest
 * À appeler au démarrage de l'app dans firstUpdated()
 * @returns {Promise<void>}
 */
export async function initializeAppVersion() {
  try {
    const response = await fetch('/manifest.json');
    if (response.ok) {
      const manifest = await response.json();
      const version = manifest.version || '1.0.0';
      appVersion.set(version);
      console.log(`✓ Version de l'application chargée: ${version}`);
      return version;
    }
  } catch (error) {
    console.warn('⚠ Erreur lors du chargement de la version:', error);
  }
  return '1.0.0';
}

// Signaux pour l'environnement
export const currentEnvironment = signal(null);
export const environmentConfig = signal(null);
export const environmentModules = signal([]);

// Signaux pour l'outil actuel
export const activeTool = signal(null);
export const toolState = signal({});
export const currentStep = signal(null);
export const toolUiState = signal(null);

// Signaux pour le workspace
export const workspaceData = signal({
  objects: {
    shapesData: [],
    pointsData: [],
    segmentsData: [],
  },
  backObjects: {
    shapesData: [],
  },
});

export const viewport = signal({
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
});

export const canvasRedrawVersion = signal({
  main: 0,
  upper: 0,
  grid: 0,
  tangram: 0,
  invisible: 0,
});

// Signaux pour les paramètres
export const settings = signal({
  gridShown: false,
  areShapesPointed: true,
  temporaryDrawColor: '#E90CC8',
  selectionDistance: 20,
  magnetismDistance: 20,
  numberOfRegularPoints: 3,
  maxZoomLevel: 10,
  minZoomLevel: 0.1,
  mainMenuWidth: 250,
  precision: 1.5,
  constraintsDrawColor: '#080',
  referenceDrawColor: '#a6dbff',
  referenceDrawColor2: '#4a88b2',
  geometryTransformationAnimationDuration: 2,
  geometryTransformationAnimation: false,
  automaticAdjustment: true,
  shapesSize: 2,
  numberOfDivisionParts: 2,
  shapesDrawColor: '#ff0000',
  shapeOpacity: 0.7,
  scalarNumerator: 1,
  scalarDenominator: 1,
});

export const nextGroupColorIdx = signal(0);
export const bugs = signal([]);

// Signaux pour l'interface utilisateur
export const notifications = signal([]);
export const dialogs = signal([]);
export const filename = signal('');
export const fileToOpen = signal(null);
export const helpSelected = signal(getInitialHelpSelected());
export const historyState = signal({
  canUndo: false,
  canRedo: false,
  size: 0,
  currentIndex: -1,
  steps: [],
  startSituation: null,
  startSettings: null,
});

export const fullHistoryState = signal({
  index: 0,
  actionIndex: 0,
  numberOfActions: 0,
  steps: [],
  isRunning: false,
});

export const stepSinceSave = signal(false);

export const tangramState = signal({
  mode: null, // 'creation' | 'reproduction' | null
  level: null,
  currentFile: null, // Données du fichier chargé
});

// Signaux calculés pour des données dérivées
export const isEnvironmentLoaded = computed(() => {
  return currentEnvironment.get() !== null;
});

export const totalShapes = computed(() => {
  const data = workspaceData.get();
  return data.objects.shapesData.length + data.backObjects.shapesData.length;
});

export const hasActiveNotifications = computed(() => {
  return notifications.get().length > 0;
});

export const historyCanUndo = computed(() => historyState.get().canUndo);
export const historyCanRedo = computed(() => historyState.get().canRedo);

/**
 * Actions pour modifier l'état (remplacent les action creators)
 */
export const appActions = {
  setLoading: (loading) => {
    appLoading.set(loading);
    window.dispatchEvent(
      new CustomEvent('app:loading-changed', { detail: { loading } }),
    );
  },

  setError: (error) => {
    appError.set(error);
    window.dispatchEvent(
      new CustomEvent('app:error-changed', { detail: { error } }),
    );
  },

  setStarted: (started) => {
    appStarted.set(started);
    window.dispatchEvent(
      new CustomEvent('app:started-changed', { detail: { started } }),
    );
  },

  setEnvironment: (environment) => {
    currentEnvironment.set(environment);
    window.dispatchEvent(
      new CustomEvent('environment:changed', { detail: { environment } }),
    );
  },

  setEnvironmentConfig: (config) => {
    environmentConfig.set(config);
    window.dispatchEvent(
      new CustomEvent('environment:config-changed', { detail: { config } }),
    );
  },

  setEnvironmentModules: (modules) => {
    environmentModules.set(modules);
    window.dispatchEvent(
      new CustomEvent('environment:modules-changed', { detail: { modules } }),
    );
  },

  setFilename: (name) => {
    filename.set(name);
    window.dispatchEvent(new CustomEvent('app:filename-changed', { detail: { filename: name } }));
  },

  setFileToOpen: (file) => {
    fileToOpen.set(file);
  },

  setNextGroupColorIdx: (idx) => {
    nextGroupColorIdx.set(idx);
  },

  setStepSinceSave: (value) => {
    stepSinceSave.set(value);
    window.dispatchEvent(
      new CustomEvent('app:step-since-save-changed', { detail: { stepSinceSave: value } }),
    );
  },

  addBug: (bugId) => {
    const current = bugs.get();
    bugs.set([...current, bugId]);
  },

  setHelpSelected: (selected) => {
    helpSelected.set(selected);
    persistHelpSelected(selected);
  },

  setTangramState: (state) => {
    // Fusionner avec l'état existant pour éviter d'écraser d'autres propriétés
    const current = tangramState.get();
    tangramState.set({ ...current, ...state });
    window.dispatchEvent(
      new CustomEvent('tangram:state-changed', { detail: { state } }),
    );
  },

  setHistoryState: (state) => {
    const current = historyState.get();
    historyState.set({ ...current, ...state });
    window.dispatchEvent(new CustomEvent('history:state-changed', { detail: { state } }));
  },

  setFullHistoryState: (state) => {
    const current = fullHistoryState.get();
    fullHistoryState.set({ ...current, ...state });
    window.dispatchEvent(new CustomEvent('app:full-history-changed', { detail: { state } }));
  },
  setActiveTool: (toolName) => {
    activeTool.set(toolName);
    // Reset de l'état spécifique outil lors d'un changement d'outil.
    // Les propriétés (selectedFamily/selectedTemplate/...) appartiennent à l'outil actif.
    toolState.set({});
    currentStep.set(null);
    window.dispatchEvent(
      new CustomEvent('tool:activated', { detail: { toolName } }),
    );
  },

  setToolState: (state) => {
    toolState.set({ ...toolState.get(), ...state });
    window.dispatchEvent(
      new CustomEvent('tool:state-changed', { detail: { state } }),
    );
  },

  setSelectedTemplate: (template) => {
    appActions.setToolState({ selectedTemplate: template });
    window.dispatchEvent(
      new CustomEvent('tool-template-changed', { detail: { template } }),
    );
  },

  setCurrentStep: (step) => {
    currentStep.set(step);
    window.dispatchEvent(
      new CustomEvent('tool-step-changed', { detail: { step } }),
    );
  },

  setToolUiState: (state) => {
    toolUiState.set(state);
    window.dispatchEvent(
      new CustomEvent('tool:ui-state-changed', { detail: { state } }),
    );
  },

  updateWorkspace: (data) => {
    workspaceData.set({ ...workspaceData.get(), ...data });
    window.dispatchEvent(
      new CustomEvent('workspace:updated', { detail: { data } }),
    );
  },

  addShape: (shape) => {
    const current = workspaceData.get();
    const updated = {
      ...current,
      objects: {
        ...current.objects,
        shapesData: [...current.objects.shapesData, shape],
      },
    };
    workspaceData.set(updated);
    window.dispatchEvent(
      new CustomEvent('workspace:shape-added', { detail: { shape } }),
    );
  },

  removeShape: (shapeId) => {
    const current = workspaceData.get();
    const updated = {
      ...current,
      objects: {
        ...current.objects,
        shapesData: current.objects.shapesData.filter((s) => s.id !== shapeId),
      },
    };
    workspaceData.set(updated);
    window.dispatchEvent(
      new CustomEvent('workspace:shape-removed', { detail: { shapeId } }),
    );
  },

  updateSettings: (newSettings) => {
    settings.set({ ...settings.get(), ...newSettings });
    window.dispatchEvent(
      new CustomEvent('settings:updated', {
        detail: { settings: newSettings },
      }),
    );
  },

  setViewport: (viewportData) => {
    viewport.set({ ...viewport.get(), ...viewportData });
    window.dispatchEvent(
      new CustomEvent('viewport:changed', {
        detail: { viewport: viewportData },
      }),
    );
  },

  bumpCanvasRedraw: (layers = ['main']) => {
    const layerList = Array.isArray(layers) ? layers : [layers];
    const current = canvasRedrawVersion.get();
    const next = { ...current };

    layerList.forEach((layerName) => {
      if (typeof layerName !== 'string' || layerName.length === 0) return;
      const currentValue = Number.isFinite(next[layerName]) ? next[layerName] : 0;
      next[layerName] = currentValue + 1;
    });

    canvasRedrawVersion.set(next);
  },

  addNotification: (notification) => {
    const current = notifications.get();
    const updated = [...current, { ...notification, id: Date.now() }];
    notifications.set(updated);
    window.dispatchEvent(
      new CustomEvent('notification:added', { detail: { notification } }),
    );
  },

  removeNotification: (notificationId) => {
    const current = notifications.get();
    const updated = current.filter((n) => n.id !== notificationId);
    notifications.set(updated);
    window.dispatchEvent(
      new CustomEvent('notification:removed', { detail: { notificationId } }),
    );
  },

  clearNotifications: () => {
    notifications.set([]);
    window.dispatchEvent(new CustomEvent('notifications:cleared'));
  },
};

/**
 * Actions d'historique
 */
export const historyActions = {
  save: () => {
    // Legacy save is automatic or handled by HistoryManager
  },
  undo: () => window.dispatchEvent(new CustomEvent('undo')),
  redo: () => window.dispatchEvent(new CustomEvent('redo')),
  clear: () => {
    // Legacy clear
  },
  canUndo: () => historyState.get().canUndo,
  canRedo: () => historyState.get().canRedo,
  getStats: () => historyState.get(),
};

/**
 * Fonction de réinitialisation de l'espace de travail (sans quitter l'environnement)
 */
export const resetWorkspaceState = () => {
  activeTool.set(null);
  toolState.set({});
  currentStep.set(null);
  workspaceData.set({
    objects: {
      shapesData: [],
      pointsData: [],
      segmentsData: [],
    },
    backObjects: {
      shapesData: [],
    },
  });
  viewport.set({
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
  });
  canvasRedrawVersion.set({
    main: 0,
    upper: 0,
    grid: 0,
    tangram: 0,
    invisible: 0,
  });
  // On ne reset pas les settings ici pour garder la grille et les options
  notifications.set([]);
  dialogs.set([]);
  filename.set('');
  // Keep help mode preference unchanged; it is an explicit user choice.
  tangramState.set({
    mode: null,
    level: null,
    currentFile: null,
  });

  appActions.setHistoryState({
    canUndo: false,
    canRedo: false,
    size: 0,
    currentIndex: -1,
    steps: [],
    startSituation: null,
    startSettings: null,
  });

  fullHistoryState.set({
    index: 0,
    actionIndex: 0,
    numberOfActions: 0,
    steps: [],
    isRunning: false,
  });

  window.dispatchEvent(new CustomEvent('app:workspace-reset'));
};

/**
 * Fonction de réinitialisation complète
 */
export const resetAppState = () => {
  appLoading.set(false);
  appError.set(null);
  appStarted.set(false);
  currentEnvironment.set(null);
  environmentConfig.set(null);
  environmentModules.set([]);

  // Utiliser resetWorkspaceState pour la partie commune
  resetWorkspaceState();

  // Reset des settings pour le reset complet
  settings.set({
    gridShown: false,
    areShapesPointed: true,
    temporaryDrawColor: '#ff0000',
    selectionDistance: 20,
    magnetismDistance: 15,
  });

  window.dispatchEvent(new CustomEvent('app:state-reset'));
};

/**
 * Fonction d'export de l'état complet
 */
export const exportAppState = () => {
  return {
    app: {
      loading: appLoading.get(),
      error: appError.get(),
      version: appVersion.get(),
      started: appStarted.get(),
    },
    environment: {
      current: currentEnvironment.get(),
      config: environmentConfig.get(),
      modules: environmentModules.get(),
    },
    tool: {
      active: activeTool.get(),
      state: toolState.get(),
      currentStep: currentStep.get(),
    },
    workspace: {
      data: workspaceData.get(),
      viewport: viewport.get(),
    },
    settings: settings.get(),
    ui: {
      notifications: notifications.get(),
      dialogs: dialogs.get(),
    },
    history: historyState.get(),
  };
};
