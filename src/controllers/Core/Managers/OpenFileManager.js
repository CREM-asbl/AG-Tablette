// OpenFileManager - Version fonctionnelle migrée vers les signaux
import { app } from '@controllers/Core/App';
import {
  addInfoToId,
  createElem,
  getExtension,
} from '@controllers/Core/Tools/general.js';
import { applyMigrations } from '@controllers/Core/Tools/version-migration.js';
import { appActions } from '@store/appState';
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
  appActions.addNotification({ message, type: 'error' });
};

/**
 * Met à jour une référence d'ID dans un objet géométrique (fonction pure)
 */
export const updateGeometryReference = (geometryObject, oldId, newId) => {
  if (!geometryObject) return geometryObject;

  const updated = { ...geometryObject };

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

  switch (type) {
    case 'shape':
      updated.segmentsData = updated.segmentsData.map((seg) =>
        seg.shapeId === oldId ? { ...seg, shapeId: newId } : seg,
      );
      updated.pointsData = updated.pointsData.map((pt) =>
        pt.shapeId === oldId ? { ...pt, shapeId: newId } : pt,
      );
      break;

    case 'segment':
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

    const updatedItem = { ...item, id: newId };

    updatedObjects = updateReferences(
      updatedObjects,
      oldId,
      newId,
      type,
      isGeometry,
    );

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

export const transformShapeIds = (objects, layer, isGeometry = false) => {
  return transformIds(objects.shapesData, objects, layer, 'shape', isGeometry);
};

export const transformSegmentIds = (objects, layer, isGeometry = false) => {
  return transformIds(
    objects.segmentsData,
    objects,
    layer,
    'segment',
    isGeometry,
  );
};

export const transformPointIds = (objects, layer, isGeometry = false) => {
  return transformIds(objects.pointsData, objects, layer, 'point', isGeometry);
};

export const transformToNewIdSystem = (objects, layer, isGeometry = false) => {
  let transformed = transformShapeIds(objects, layer, isGeometry);
  transformed = transformSegmentIds(transformed, layer, isGeometry);
  transformed = transformPointIds(transformed, layer, isGeometry);
  return transformed;
};

/**
 * Valide le contenu d'un fichier (fonction pure)
 */
export const validateFileContent = (saveObject, environment) => {
  if (!saveObject || typeof saveObject !== 'object') {
    return { isValid: false, error: ERROR_MESSAGES.FILE_PARSE_ERROR };
  }

  if (!saveObject.appVersion || saveObject.appVersion === '1.0.0') {
    return { isValid: false, error: ERROR_MESSAGES.UNSUPPORTED_VERSION };
  }

  if (!saveObject.envName || saveObject.envName !== environment.name) {
    const envMessage = saveObject.envName
      ? ERROR_MESSAGES.WRONG_ENVIRONMENT + saveObject.envName + '.'
      : 'Environnement non spécifié dans le fichier.';
    return { isValid: false, error: envMessage };
  }

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
 */
export const parseJsonContent = (fileContent) => {
  if (typeof fileContent !== 'string') {
    return { success: true, data: fileContent, error: null };
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
 * Traite les paramètres du fichier
 */
export const processSettings = (saveObject, appInstance, gridStoreInstance) => {
  if (saveObject.settings) {
    const mergedSettings = {
      ...saveObject.settings,
      ...DEFAULT_SETTINGS,
    };

    appActions.updateSettings(mergedSettings);
  } else {
    appInstance.resetSettings();
  }

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
 * Traite l'historique du fichier
 */
export const processHistory = (saveObject, appInstance, environmentName) => {
  if (saveObject.fullHistory) {
    appActions.setFullHistoryState({ ...saveObject.fullHistory });
  } else {
    appActions.setFullHistoryState({ ...appInstance.defaultState.fullHistory });
  }

  if (environmentName === 'Tangram') {
    processTangramHistory(saveObject, appInstance);
  } else {
    processDefaultHistory(saveObject, appInstance);
  }
};

const syncHistorySignal = (history) => {
  if (!history) return;

  const index = typeof history.index === 'number' ? history.index : -1;
  const stepsLength = Array.isArray(history.steps) ? history.steps.length : 0;

  appActions.setHistoryState({
    ...history,
    canUndo: index !== -1,
    canRedo: index < stepsLength - 1,
    size: stepsLength,
    currentIndex: index,
  });
};

export const processTangramHistory = (saveObject, appInstance) => {
  if (saveObject.history) {
    const nextHistory = {
      ...saveObject.history,
      startSituation: {
        ...saveObject.history.startSituation,
        tangram: {
          isSilhouetteShown: true,
          currentStep: 'start',
        },
      },
    };

    syncHistorySignal(nextHistory);
    appActions.setTangramState({ isSilhouetteShown: true });
  } else {
    const nextHistory = {
      ...appInstance.defaultState.history,
      startSituation: null,
      startSettings: { ...appInstance.settings },
    };

    syncHistorySignal(nextHistory);
  }
};

export const processDefaultHistory = (saveObject, appInstance) => {
  if (saveObject.history) {
    syncHistorySignal(saveObject.history);
  } else {
    const nextHistory = {
      ...appInstance.defaultState.history,
      startSituation: {
        ...appInstance.workspace.data,
      },
      startSettings: { ...appInstance.settings },
    };

    syncHistorySignal(nextHistory);
  }
};

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

export const triggerRefreshEvents = () => {
  window.dispatchEvent(new CustomEvent('refresh'));
  window.dispatchEvent(new CustomEvent('refreshUpper'));
  window.dispatchEvent(new CustomEvent('refreshBackground'));
};

export const openPopupFile = async () => {
  await import('@components/popups/open-popup');
  createElem('open-popup');
};

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
  reader.readAsText(file);
};

export const parseFile = async (fileContent, filename) => {
  const { performanceManager } = await import('../../../utils/PerformanceManager.js');

  return await performanceManager.measure('parse-file', async () => {
    try {
      const parseResult = parseJsonContent(fileContent);
      if (!parseResult.success) {
        showErrorNotification(ERROR_MESSAGES.FILE_PARSE_ERROR);
        return;
      }

      const saveObject = parseResult.data;
      saveObject.fileExtension = getExtension(filename);

      const validation = validateFileContent(saveObject, app.environment);
      if (!validation.isValid) {
        showErrorNotification(validation.error);
        return;
      }

      applyMigrations(saveObject);

      appActions.setActiveTool(null);

      const WorkspaceManagerModule = await import(
        '@controllers/Core/Managers/WorkspaceManager.js'
      );
      await WorkspaceManagerModule.setWorkspaceFromObject(
        saveObject.workspaceData || saveObject.wsdata,
      );

      if (
        app.environment.name === 'Tangram' &&
        saveObject.fileExtension === 'ags'
      ) {
        app.mainCanvasLayer.removeAllObjects();
      }

      processSettings(saveObject, app, gridStore);
      processHistory(saveObject, app, app.environment.name);
      processVisibility(saveObject, setToolsVisibility, setFamiliesVisibility);

      appActions.setFilename(filename);
      appActions.setStepSinceSave(false);

      const objectCount = saveObject.workspaceData?.objects?.length || 0;
      await performanceManager.recordCustomMetric(
        'workspace-objects-count',
        objectCount,
        'workspace'
      );

      if (app.environment.name === 'Tangram') {
        appActions.setTangramState({
          currentFile: saveObject,
          mode: 'reproduction',
        });
      }

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
  });
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

export const OpenFileManager = {
  parseFile,
  openFile,
  openPopupFile,
  newReadFile,
  oldReadFile,
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
