// OpenFileManager - Version fonctionnelle
import { app, setState } from '@controllers/Core/App';
import {
  addInfoToId,
  createElem,
  getExtension,
} from '@controllers/Core/Tools/general.js';
import { applyMigrations } from '@controllers/Core/Tools/version-migration.js';
import { gridStore } from '@store/gridStore.js';
import { setFamiliesVisibility } from '@store/kit.js';
import { setToolsVisibility } from '@store/tools.js';

// Constantes d'erreur
const ERROR_MESSAGES = {
  FILE_READ_ERROR: 'Erreur lors de la lecture du fichier',
  FILE_PARSE_ERROR: 'Erreur lors du parsing du fichier',
  UNSUPPORTED_VERSION: 'Version non supportée',
  WRONG_ENVIRONMENT: 'Environnement incorrect: ',
};

// Constantes pour les paramètres par défaut
const DEFAULT_SETTINGS = {
  numberOfDivisionParts: 2,
  numberOfRegularPoints: 3,
  shapesDrawColor: '#ff0000',
  shapeOpacity: 0.7,
};

// Détection de l'API File System Access
const hasNativeFS = 'showOpenFilePicker' in window;

/**
 * Affiche une notification d'erreur
 * @param {string} message - Message d'erreur à afficher
 */
const showErrorNotification = (message) => {
  window.dispatchEvent(
    new CustomEvent('show-notif', {
      detail: { message, type: 'error' },
    }),
  );
};

/**
 * Met à jour une référence d'ID dans un objet géométrique (fonction pure)
 * @param {Object} geometryObject - L'objet géométrique à mettre à jour
 * @param {string} oldId - L'ancien ID
 * @param {string} newId - Le nouvel ID
 * @returns {Object} - L'objet géométrique mis à jour
 */
export const updateGeometryReference = (geometryObject, oldId, newId) => {
  if (!geometryObject) return geometryObject;

  const updated = { ...geometryObject };

  // Mise à jour des tableaux d'IDs
  const arrayProperties = [
    'geometryChildShapeIds',
    'geometryTransformationChildShapeIds',
    'geometryDuplicateChildShapeIds',
    'geometryTransformationCharacteristicElementIds',
  ];

  arrayProperties.forEach((prop) => {
    if (updated[prop]) {
      updated[prop] = updated[prop].map((elemId) =>
        elemId === oldId ? newId : elemId,
      );
    }
  });

  // Mise à jour des propriétés simples
  const simpleProperties = [
    'geometryTransformationParentShapeId',
    'geometryDuplicateParentShapeId',
    'geometryParentObjectId1',
    'geometryParentObjectId2',
  ];

  simpleProperties.forEach((prop) => {
    if (updated[prop] === oldId) {
      updated[prop] = newId;
    }
  });

  return updated;
};

/**
 * Met à jour les références d'un ID dans tous les objets (fonction pure)
 * @param {Object} objects - Les objets contenant les données
 * @param {string} oldId - L'ancien ID
 * @param {string} newId - Le nouvel ID
 * @param {string} type - Le type d'objet ('shape', 'segment', 'point')
 * @param {boolean} isGeometry - Si c'est un environnement géométrie
 * @returns {Object} - Les objets mis à jour
 */
export const updateReferences = (
  objects,
  oldId,
  newId,
  type,
  isGeometry = false,
) => {
  const updated = {
    shapesData: [...objects.shapesData],
    segmentsData: [...objects.segmentsData],
    pointsData: [...objects.pointsData],
  };

  // Mise à jour selon le type
  switch (type) {
    case 'shape':
      // Mise à jour des références dans segments et points
      updated.segmentsData = updated.segmentsData.map((seg) =>
        seg.shapeId === oldId ? { ...seg, shapeId: newId } : seg,
      );
      updated.pointsData = updated.pointsData.map((pt) =>
        pt.shapeId === oldId ? { ...pt, shapeId: newId } : pt,
      );
      break;

    case 'segment':
      // Mise à jour des références dans shapes et points
      updated.shapesData = updated.shapesData.map((s) => ({
        ...s,
        segmentIds: s.segmentIds.map((segId) =>
          segId === oldId ? newId : segId,
        ),
      }));
      updated.pointsData = updated.pointsData.map((pt) => ({
        ...pt,
        segmentIds: pt.segmentIds.map((segId) =>
          segId === oldId ? newId : segId,
        ),
      }));
      break;

    case 'point':
      // Mise à jour des références dans shapes
      updated.shapesData = updated.shapesData.map((s) => ({
        ...s,
        pointIds: s.pointIds.map((ptId) => (ptId === oldId ? newId : ptId)),
      }));
      updated.segmentsData = updated.segmentsData.map((seg) => ({
        ...seg,
        vertexIds: seg.vertexIds.map((ptId) => (ptId === oldId ? newId : ptId)),
        divisionPointIds: seg.divisionPointIds.map((ptId) =>
          ptId === oldId ? newId : ptId,
        ),
        arcCenterId: seg.arcCenterId === oldId ? newId : seg.arcCenterId,
      }));
      updated.pointsData = updated.pointsData.map((pt) => ({
        ...pt,
        endpointIds: pt.endpointIds?.map((ptId) =>
          ptId === oldId ? newId : ptId,
        ),
        reference: pt.reference === oldId ? newId : pt.reference,
      }));
      break;
  }

  // Mise à jour des références géométriques si en mode Géométrie
  if (isGeometry) {
    updated.shapesData = updated.shapesData.map((s) => ({
      ...s,
      geometryObject: updateGeometryReference(s.geometryObject, oldId, newId),
    }));
  }

  return updated;
};

/**
 * Transforme les IDs d'une collection d'objets (fonction pure)
 * @param {Array} dataArray - Le tableau d'objets à transformer
 * @param {Object} objects - Les objets contenant les données
 * @param {string} layer - Le layer de destination
 * @param {string} type - Le type d'objet ('shape', 'segment', 'point')
 * @param {boolean} isGeometry - Si c'est un environnement géométrie
 * @returns {Object} - Les objets avec IDs transformés
 */
export const transformIds = (
  dataArray,
  objects,
  layer,
  type,
  isGeometry = false,
) => {
  let updatedObjects = { ...objects };

  dataArray.forEach((item) => {
    const oldId = item.id;
    const newId = addInfoToId(item.id, layer, type);

    // Mettre à jour l'ID de l'objet lui-même
    const updatedItem = { ...item, id: newId };

    // Mettre à jour les références
    updatedObjects = updateReferences(
      updatedObjects,
      oldId,
      newId,
      type,
      isGeometry,
    );

    // Mettre à jour l'objet dans le tableau approprié
    const arrayName = `${type}sData`;
    const index = updatedObjects[arrayName].findIndex(
      (obj) => obj.id === oldId,
    );
    if (index !== -1) {
      updatedObjects[arrayName][index] = updatedItem;
    }
  });

  return updatedObjects;
};

/**
 * Transforme les IDs des formes (fonction pure)
 * @param {Object} objects - Les objets contenant les données
 * @param {string} layer - Le layer de destination
 * @param {boolean} isGeometry - Si c'est un environnement géométrie
 * @returns {Object} - Nouveaux objets avec les IDs de formes transformés
 */
export const transformShapeIds = (objects, layer, isGeometry = false) => {
  return transformIds(objects.shapesData, objects, layer, 'shape', isGeometry);
};

/**
 * Transforme les IDs des segments (fonction pure)
 * @param {Object} objects - Les objets contenant les données
 * @param {string} layer - Le layer de destination
 * @param {boolean} isGeometry - Si c'est un environnement géométrie
 * @returns {Object} - Nouveaux objets avec les IDs de segments transformés
 */
export const transformSegmentIds = (objects, layer, isGeometry = false) => {
  return transformIds(
    objects.segmentsData,
    objects,
    layer,
    'segment',
    isGeometry,
  );
};

/**
 * Transforme les IDs des points (fonction pure)
 * @param {Object} objects - Les objets contenant les données
 * @param {string} layer - Le layer de destination
 * @param {boolean} isGeometry - Si c'est un environnement géométrie
 * @returns {Object} - Nouveaux objets avec les IDs de points transformés
 */
export const transformPointIds = (objects, layer, isGeometry = false) => {
  return transformIds(objects.pointsData, objects, layer, 'point', isGeometry);
};

/**
 * Transforme l'ancien système d'ID vers le nouveau système (fonction pure)
 * @param {Object} objects - Les objets à transformer
 * @param {string} layer - Le layer de destination
 * @param {boolean} isGeometry - Si c'est un environnement géométrie
 * @returns {Object} - Nouveaux objets avec le système d'ID transformé
 */
export const transformToNewIdSystem = (objects, layer, isGeometry = false) => {
  let transformed = transformShapeIds(objects, layer, isGeometry);
  transformed = transformSegmentIds(transformed, layer, isGeometry);
  transformed = transformPointIds(transformed, layer, isGeometry);
  return transformed;
};

/**
 * Valide le contenu d'un fichier avec des vérifications robustes (fonction pure)
 * @param {Object} saveObject - L'objet de sauvegarde à valider
 * @param {Object} environment - L'environnement actuel
 * @returns {Object} - Résultat de la validation {isValid: boolean, error: string}
 */
export const validateFileContent = (saveObject, environment) => {
  // Vérifications de base
  if (!saveObject || typeof saveObject !== 'object') {
    return { isValid: false, error: ERROR_MESSAGES.FILE_PARSE_ERROR };
  }

  // Vérification de la version
  if (!saveObject.appVersion || saveObject.appVersion === '1.0.0') {
    return { isValid: false, error: ERROR_MESSAGES.UNSUPPORTED_VERSION };
  }

  // Vérification de l'environnement
  if (!saveObject.envName || saveObject.envName !== environment.name) {
    const envMessage = saveObject.envName
      ? ERROR_MESSAGES.WRONG_ENVIRONMENT + saveObject.envName + '.'
      : 'Environnement non spécifié dans le fichier.';
    return { isValid: false, error: envMessage };
  }

  // Vérification de la structure des données
  if (!saveObject.workspaceData && !saveObject.wsdata) {
    return {
      isValid: false,
      error: 'Données de workspace manquantes dans le fichier.',
    };
  }

  return { isValid: true, error: null };
};

/**
 * Parse le contenu JSON d'un fichier (fonction pure)
 * @param {string|Object} fileContent - Le contenu du fichier à parser
 * @returns {Object} - Résultat du parsing {success: boolean, data: Object, error: string}
 */
export const parseJsonContent = (fileContent) => {
  if (typeof fileContent !== 'string') {
    return { success: true, data: fileContent, error: null }; // Déjà un objet
  }

  if (!fileContent.trim()) {
    return { success: false, data: null, error: 'contenu vide' };
  }

  try {
    const parsed = JSON.parse(fileContent);
    return { success: true, data: parsed, error: null };
  } catch (error) {
    console.error('Erreur de parsing JSON:', error);
    return { success: false, data: null, error: 'JSON invalide' };
  }
};

/**
 * Traite les paramètres du fichier (fonction avec effets)
 * @param {Object} saveObject - L'objet de sauvegarde
 * @param {Object} appInstance - L'instance de l'application
 * @param {Object} gridStoreInstance - L'instance du store de grille
 */
export const processSettings = (saveObject, appInstance, gridStoreInstance) => {
  if (saveObject.settings) {
    setState({
      settings: {
        ...saveObject.settings,
        ...DEFAULT_SETTINGS,
      },
    });
  } else {
    appInstance.resetSettings();
  }

  // Restauration de la grille si présente dans le fichier
  if (saveObject.settings?.gridType) {
    gridStoreInstance.setGridType(saveObject.settings.gridType);
  }
  if (saveObject.settings?.gridSize) {
    gridStoreInstance.setGridSize(saveObject.settings.gridSize);
  }
  if (typeof saveObject.settings?.gridOpacity !== 'undefined') {
    gridStoreInstance.setGridOpacity(saveObject.settings.gridOpacity);
  }
  if (typeof saveObject.settings?.gridShown !== 'undefined') {
    gridStoreInstance.setIsVisible(saveObject.settings.gridShown);
  }
};

/**
 * Traite l'historique du fichier (fonction avec effets)
 * @param {Object} saveObject - L'objet de sauvegarde
 * @param {Object} appInstance - L'instance de l'application
 * @param {string} environmentName - Le nom de l'environnement
 */
export const processHistory = (saveObject, appInstance, environmentName) => {
  // Traitement de fullHistory
  if (saveObject.fullHistory) {
    setState({ fullHistory: { ...saveObject.fullHistory } });
  } else {
    setState({
      fullHistory: { ...appInstance.defaultState.fullHistory },
    });
  }

  // Traitement de history selon l'environnement
  if (environmentName === 'Tangram') {
    processTangramHistory(saveObject, appInstance);
  } else {
    processDefaultHistory(saveObject, appInstance);
  }
};

/**
 * Traite l'historique spécifique à Tangram (fonction avec effets)
 * @param {Object} saveObject - L'objet de sauvegarde
 * @param {Object} appInstance - L'instance de l'application
 */
export const processTangramHistory = (saveObject, appInstance) => {
  if (saveObject.history) {
    setState({
      history: {
        ...saveObject.history,
        startSituation: {
          ...saveObject.history.startSituation,
          tangram: {
            isSilhouetteShown: true,
            currentStep: 'start',
          },
        },
      },
    });
  } else {
    setState({
      history: {
        ...appInstance.defaultState.history,
        startSituation: null,
        startSettings: { ...appInstance.settings },
      },
    });
  }
};

/**
 * Traite l'historique par défaut (fonction avec effets)
 * @param {Object} saveObject - L'objet de sauvegarde
 * @param {Object} appInstance - L'instance de l'application
 */
export const processDefaultHistory = (saveObject, appInstance) => {
  if (saveObject.history) {
    setState({
      history: { ...saveObject.history },
    });
  } else {
    setState({
      history: {
        ...appInstance.defaultState.history,
        startSituation: {
          ...appInstance.workspace.data,
        },
        startSettings: { ...appInstance.settings },
      },
    });
  }
};

/**
 * Traite la visibilité des outils et familles (fonction avec effets)
 * @param {Object} saveObject - L'objet de sauvegarde
 * @param {Function} setToolsVisibilityFn - Fonction pour définir la visibilité des outils
 * @param {Function} setFamiliesVisibilityFn - Fonction pour définir la visibilité des familles
 */
export const processVisibility = (
  saveObject,
  setToolsVisibilityFn,
  setFamiliesVisibilityFn,
) => {
  const toolsVisibility = saveObject.toolsVisibility || saveObject.toolsVisible;
  if (toolsVisibility) setToolsVisibilityFn(toolsVisibility);

  const familiesVisibility =
    saveObject.familiesVisibility || saveObject.familiesVisible;
  if (familiesVisibility?.length) setFamiliesVisibilityFn(familiesVisibility);
};

/**
 * Déclenche les événements de rafraîchissement (fonction avec effets)
 */
export const triggerRefreshEvents = () => {
  window.dispatchEvent(new CustomEvent('refresh'));
  window.dispatchEvent(new CustomEvent('refreshUpper'));
  window.dispatchEvent(new CustomEvent('refreshBackground'));
};

/**
 * Ouvre la popup de sélection de fichier
 */
export const openPopupFile = async () => {
  await import('@components/popups/open-popup');
  createElem('open-popup');
};

/**
 * Ouvre un sélecteur de fichier
 * Utilise l'API File System Access si disponible, sinon utilise l'ancienne méthode
 */
export const openFile = async () => {
  if (hasNativeFS) {
    const opts = {
      types: [
        {
          description: 'Etat',
          accept: {
            'app/json': app.environment.extensions,
          },
        },
      ],
    };
    try {
      const fileHandle = await window.showOpenFilePicker(opts);
      window.dispatchEvent(
        new CustomEvent('file-opened', {
          detail: { method: 'new', file: fileHandle },
        }),
      );
    } catch (error) {
      console.error(error);
    }
  } else {
    window.dispatchEvent(new CustomEvent('show-file-selector'));
  }
};

/**
 * Lit un fichier avec la nouvelle API File System Access
 * @param {FileSystemFileHandle} fileHandle - Le handle du fichier
 */
export const newReadFile = async (fileHandle) => {
  try {
    const file = await fileHandle.getFile();
    const content = await file.text();
    await parseFile(content, fileHandle.name);
  } catch (error) {
    console.error('Erreur lors de la lecture du fichier:', error);
    showErrorNotification(ERROR_MESSAGES.FILE_READ_ERROR);
  }
};

/**
 * Lit un fichier avec l'ancienne méthode
 * @param {File} file - Le fichier à lire
 */
export const oldReadFile = (file) => {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      parseFile(reader.result, file.name);
    } catch (error) {
      console.error('Erreur lors du parsing du fichier:', error);
      showErrorNotification(ERROR_MESSAGES.FILE_READ_ERROR);
    }
  };
  reader.onerror = () => {
    console.error('Erreur FileReader:', reader.error);
    showErrorNotification(ERROR_MESSAGES.FILE_READ_ERROR);
  };
  reader.readAsText(file);
};

/**
 * Parse et traite le contenu d'un fichier
 * @param {string|Object} fileContent - Le contenu du fichier
 * @param {string} filename - Le nom du fichier
 */
export const parseFile = async (fileContent, filename) => {
  try {
    // Parsing du contenu
    const parseResult = parseJsonContent(fileContent);
    if (!parseResult.success) {
      showErrorNotification(ERROR_MESSAGES.FILE_PARSE_ERROR);
      return;
    }

    const saveObject = parseResult.data;

    // Ajout de l'extension du fichier
    saveObject.fileExtension = getExtension(filename);

    // Validation du fichier
    const validation = validateFileContent(saveObject, app.environment);
    if (!validation.isValid) {
      showErrorNotification(validation.error);
      return;
    }

    // Appliquer les migrations nécessaires pour la compatibilité entre versions
    applyMigrations(saveObject);

    // Chargement du workspace
    const WorkspaceManagerModule = await import(
      '@controllers/Core/Managers/WorkspaceManager.js'
    );
    await WorkspaceManagerModule.setWorkspaceFromObject(
      saveObject.workspaceData || saveObject.wsdata,
    );

    // Traitement spécial pour Tangram
    if (
      app.environment.name === 'Tangram' &&
      saveObject.fileExtension === 'ags'
    ) {
      app.mainCanvasLayer.removeAllObjects();
    }

    // Traitement des différentes sections
    processSettings(saveObject, app, gridStore);
    processHistory(saveObject, app, app.environment.name);
    processVisibility(saveObject, setToolsVisibility, setFamiliesVisibility);

    // Finalisation
    setState({ filename });
    window.dispatchEvent(
      new CustomEvent('file-parsed', { detail: saveObject }),
    );
    triggerRefreshEvents();
  } catch (error) {
    const errorMessage = error.message.includes('vide')
      ? ERROR_MESSAGES.FILE_PARSE_ERROR + ' (fichier vide)'
      : ERROR_MESSAGES.FILE_PARSE_ERROR;
    showErrorNotification(errorMessage);
  }
};

// Gestion des événements
window.addEventListener('open-file', openPopupFile);
window.addEventListener('local-open-file', () => {
  openFile();
});
window.addEventListener('file-opened', (event) => {
  if (event.detail.method === 'old') oldReadFile(event.detail.file);
  else newReadFile(event.detail.file[0]);
});

// Export nommé pour la compatibilité avec les anciens imports
export const OpenFileManager = {
  parseFile,
  openFile,
  openPopupFile,
  newReadFile,
  oldReadFile,
  // Autres fonctions principales si nécessaire
  validateFileContent,
  parseJsonContent,
  processSettings,
  processHistory,
  processVisibility,
  triggerRefreshEvents,
  transformToNewIdSystem,
  transformShapeIds,
  transformSegmentIds,
  transformPointIds,
  updateGeometryReference,
  updateReferences,
  transformIds,
};
