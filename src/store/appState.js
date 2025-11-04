/**
 * État global de l'application utilisant les signaux Lit
 * Remplace le StateManager custom pour éviter la duplication
 */

import { signal, computed } from '@lit-labs/signals';

// Signaux pour l'état de l'application
export const appLoading = signal(false);
export const appError = signal(null);
export const appVersion = signal('1.0.0');
export const appStarted = signal(false);

// Signaux pour l'environnement
export const currentEnvironment = signal(null);
export const environmentConfig = signal(null);
export const environmentModules = signal([]);

// Signaux pour l'outil actuel
export const activeTool = signal(null);
export const toolState = signal({});
export const currentStep = signal(null);
export const selectedTemplate = signal(null);

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

// Signaux pour les paramètres
export const settings = signal({
  gridShown: false,
  areShapesPointed: true,
  temporaryDrawColor: '#ff0000',
  selectionDistance: 20,
  magnetismDistance: 15,
});

// Signaux pour l'interface utilisateur
export const notifications = signal([]);
export const dialogs = signal([]);

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

  setActiveTool: (toolName) => {
    activeTool.set(toolName);
    // Réinitialiser l'état de l'outil
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

  setCurrentStep: (step) => {
    currentStep.set(step);
    window.dispatchEvent(
      new CustomEvent('tool:step-changed', { detail: { step } }),
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
 * Système d'historique simple pour undo/redo
 */
class SimpleHistory {
  constructor(maxSize = 50) {
    this.history = [];
    this.currentIndex = -1;
    this.maxSize = maxSize;
  }

  saveState() {
    const state = {
      workspaceData: workspaceData.get(),
      settings: settings.get(),
      viewport: viewport.get(),
      timestamp: Date.now(),
    };

    // Supprimer l'historique futur si on est au milieu
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    this.history.push(state);
    this.currentIndex = this.history.length - 1;

    // Limiter la taille
    if (this.history.length > this.maxSize) {
      this.history = this.history.slice(-this.maxSize);
      this.currentIndex = this.history.length - 1;
    }

    window.dispatchEvent(
      new CustomEvent('history:state-saved', {
        detail: { index: this.currentIndex },
      }),
    );
  }

  undo() {
    if (this.canUndo()) {
      this.currentIndex--;
      const state = this.history[this.currentIndex];
      this.restoreState(state);
      window.dispatchEvent(
        new CustomEvent('history:undo', {
          detail: { index: this.currentIndex },
        }),
      );
      return true;
    }
    return false;
  }

  redo() {
    if (this.canRedo()) {
      this.currentIndex++;
      const state = this.history[this.currentIndex];
      this.restoreState(state);
      window.dispatchEvent(
        new CustomEvent('history:redo', {
          detail: { index: this.currentIndex },
        }),
      );
      return true;
    }
    return false;
  }

  canUndo() {
    return this.currentIndex > 0;
  }

  canRedo() {
    return this.currentIndex < this.history.length - 1;
  }

  restoreState(state) {
    workspaceData.set(state.workspaceData);
    settings.set(state.settings);
    viewport.set(state.viewport);
  }

  clear() {
    this.history = [];
    this.currentIndex = -1;
    window.dispatchEvent(new CustomEvent('history:cleared'));
  }

  getStats() {
    return {
      size: this.history.length,
      currentIndex: this.currentIndex,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
    };
  }
}

export const history = new SimpleHistory();

/**
 * Actions d'historique
 */
export const historyActions = {
  save: () => history.saveState(),
  undo: () => history.undo(),
  redo: () => history.redo(),
  clear: () => history.clear(),
  canUndo: () => history.canUndo(),
  canRedo: () => history.canRedo(),
  getStats: () => history.getStats(),
};

/**
 * Utilitaires pour surveiller les changements
 */
export const createWatcher = (signalToWatch, callback) => {
  let lastValue = signalToWatch.get();

  const checkForChanges = () => {
    const currentValue = signalToWatch.get();
    if (currentValue !== lastValue) {
      callback(currentValue, lastValue);
      lastValue = currentValue;
    }
  };

  // Vérifier les changements sur le prochain tick
  const intervalId = setInterval(checkForChanges, 0);

  return () => clearInterval(intervalId);
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
  activeTool.set(null);
  toolState.set({});
  currentStep.set(null);
  selectedTemplate.set(null);
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
  settings.set({
    gridShown: false,
    areShapesPointed: true,
    temporaryDrawColor: '#ff0000',
    selectionDistance: 20,
    magnetismDistance: 15,
  });
  notifications.set([]);
  dialogs.set([]);
  history.clear();

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
      selectedTemplate: selectedTemplate.get(),
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
    history: history.getStats(),
  };
};
