// État initial et actions pour la gestion de la grille

const initialState = {
  gridType: 'none', // Valeur de production typique
  gridSize: 1, // en cm ou autre unité
  gridOpacity: 0.7, // 0 à 1
  isVisible: false, // La grille n'est pas visible par défaut en production
};

let currentState = { ...initialState };
const listeners = new Set();

const notifyListeners = () => {
  listeners.forEach((listener) => listener(currentState));
};

export const gridStore = {
  getState: () => {
    return { ...currentState };
  },

  subscribe: (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener); // Retourne une fonction de désabonnement
  },

  setGridType: (newType) => {
    currentState.gridType = newType;
    // Si le type de grille est 'none', la grille ne doit pas être visible.
    // Sinon, si elle n'était pas visible et qu'un type est appliqué, on la rend visible.
    // Si elle était déjà visible avec un autre type, elle le reste.
    if (newType === 'none') {
      currentState.isVisible = false;
    } else if (!currentState.isVisible) {
      currentState.isVisible = true;
    }
    notifyListeners();
  },

  setGridSize: (newSize) => {
    if (newSize <= 0) {
      currentState.gridSize = 0.1; // Valeur minimale autorisée
    } else {
      currentState.gridSize = newSize;
    }
    notifyListeners();
  },

  setGridOpacity: (newOpacity) => {
    if (newOpacity < 0) {
      currentState.gridOpacity = 0;
    } else if (newOpacity > 1) {
      currentState.gridOpacity = 1;
    } else {
      currentState.gridOpacity = newOpacity;
    }
    notifyListeners();
  },

  setIsVisible: (newIsVisible) => {
    currentState.isVisible = newIsVisible;
    notifyListeners();
  },

  // Action pour réinitialiser à l'état initial (utile pour les tests ou une fonctionnalité de reset)
  _resetState: () => {
    currentState = { ...initialState };
    notifyListeners(); // Notifie également lors du reset pour la cohérence des tests/UI
  },
};
