import { gridStore } from '@store/gridStore';
import { setFamiliesVisibility } from '@store/kit';
import { setToolsVisibility } from '@store/tools';
import { app, setState } from '../App';
import { addInfoToId, createElem, getExtension } from '../Tools/general';
import { applyMigrations } from '../Tools/version-migration';

// Constantes pour les paramètres par défaut
const DEFAULT_SETTINGS = {
  numberOfDivisionParts: 2,
  numberOfRegularPoints: 3,
  shapesDrawColor: '#ff0000',
  shapeOpacity: 0.7
};

const ERROR_MESSAGES = {
  FILE_PARSE_ERROR: 'Impossible d\'ouvrir ce fichier.',
  FILE_READ_ERROR: 'Erreur lors de la lecture du fichier.',
  UNSUPPORTED_VERSION: 'Impossible d\'ouvrir ce fichier. La version n\'est plus prise en charge.',
  WRONG_ENVIRONMENT: 'Impossible d\'ouvrir ce fichier. C\'est un fichier '
};

/**
 * Ouvre la popup de sélection de fichier
 */
export const openPopupFile = async () => {
  await import('../../../components/popups/open-popup');
  createElem('open-popup');
}

/**
 * Gestionnaire pour l'ouverture de fichiers
 * Gère à la fois les nouveaux et anciens systèmes de fichiers
 */
export class OpenFileManager {
  /**
   * Ouvre un sélecteur de fichier
   * Utilise l'API File System Access si disponible, sinon utilise l'ancienne méthode
   */
  static async openFile() {
    if (OpenFileManager.hasNativeFS) {
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
  }

  static async newReadFile(fileHandle) {
    try {
      const file = await fileHandle.getFile();
      const content = await file.text();
      await OpenFileManager.parseFile(content, fileHandle.name);
    } catch (error) {
      console.error('Erreur lors de la lecture du fichier:', error);
      window.dispatchEvent(new CustomEvent('show-notif', {
        detail: { message: ERROR_MESSAGES.FILE_READ_ERROR }
      }));
    }
  }

  static oldReadFile(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        OpenFileManager.parseFile(reader.result, file.name);
      } catch (error) {
        console.error('Erreur lors du parsing du fichier:', error);
        window.dispatchEvent(new CustomEvent('show-notif', {
          detail: { message: ERROR_MESSAGES.FILE_READ_ERROR }
        }));
      }
    };
    reader.onerror = () => {
      console.error('Erreur FileReader:', reader.error);
      window.dispatchEvent(new CustomEvent('show-notif', {
        detail: { message: ERROR_MESSAGES.FILE_READ_ERROR }
      }));
    };
    reader.readAsText(file);
  }

  /**
   * Met à jour une référence d'ID dans un objet géométrique
   * @param {Object} geometryObject - L'objet géométrique à mettre à jour
   * @param {string} oldId - L'ancien ID
   * @param {string} newId - Le nouvel ID
   */
  static updateGeometryReference(geometryObject, oldId, newId) {
    if (!geometryObject) return;

    // Mise à jour des tableaux d'IDs
    const arrayProperties = [
      'geometryChildShapeIds',
      'geometryTransformationChildShapeIds',
      'geometryDuplicateChildShapeIds',
      'geometryTransformationCharacteristicElementIds'
    ];

    arrayProperties.forEach(prop => {
      if (geometryObject[prop]) {
        geometryObject[prop].forEach((elemId, idx) => {
          if (elemId === oldId) {
            geometryObject[prop][idx] = newId;
          }
        });
      }
    });

    // Mise à jour des propriétés simples
    const simpleProperties = [
      'geometryTransformationParentShapeId',
      'geometryDuplicateParentShapeId',
      'geometryParentObjectId1',
      'geometryParentObjectId2'
    ];

    simpleProperties.forEach(prop => {
      if (geometryObject[prop] === oldId) {
        geometryObject[prop] = newId;
      }
    });
  }

  /**
   * Met à jour les références d'un ID dans tous les objets
   * @param {Object} objects - Les objets contenant les données
   * @param {string} oldId - L'ancien ID
   * @param {string} newId - Le nouvel ID
   * @param {string} type - Le type d'objet ('shape', 'segment', 'point')
   */
  static updateReferences(objects, oldId, newId, type) {
    const isGeometry = app.environment.name === 'Geometrie';

    // Mise à jour selon le type
    switch (type) {
      case 'shape':
        // Mise à jour des références dans segments et points
        objects.segmentsData.forEach(seg => {
          if (seg.shapeId === oldId) {
            seg.shapeId = newId;
          }
        });
        objects.pointsData.forEach(pt => {
          if (pt.shapeId === oldId) {
            pt.shapeId = newId;
          }
        });
        break;

      case 'segment':
        // Mise à jour des références dans shapes et points
        objects.shapesData.forEach(s => {
          s.segmentIds.forEach((segId, idx) => {
            if (segId === oldId) {
              s.segmentIds[idx] = newId;
            }
          });
        });
        objects.pointsData.forEach(pt => {
          pt.segmentIds.forEach((segId, idx) => {
            if (segId === oldId) {
              pt.segmentIds[idx] = newId;
            }
          });
        });
        break;

      case 'point':
        // Mise à jour des références dans shapes
        objects.shapesData.forEach(s => {
          s.pointIds.forEach((ptId, idx) => {
            if (ptId === oldId) {
              s.pointIds[idx] = newId;
            }
          });
        });

        // Mise à jour des références dans segments
        objects.segmentsData.forEach(seg => {
          seg.vertexIds.forEach((ptId, idx) => {
            if (ptId === oldId) {
              seg.vertexIds[idx] = newId;
            }
          });
          seg.divisionPointIds.forEach((ptId, idx) => {
            if (ptId === oldId) {
              seg.divisionPointIds[idx] = newId;
            }
          });
          if (seg.arcCenterId === oldId) {
            seg.arcCenterId = newId;
          }
        });

        // Mise à jour des références dans autres points
        objects.pointsData.forEach(pt => {
          pt.endpointIds?.forEach((ptId, idx) => {
            if (ptId === oldId) {
              pt.endpointIds[idx] = newId;
            }
          });
          if (pt.reference === oldId) {
            pt.reference = newId;
          }
        });
        break;
    }

    // Mise à jour des références géométriques si en mode Géométrie
    if (isGeometry) {
      objects.shapesData.forEach(s => {
        this.updateGeometryReference(s.geometryObject, oldId, newId);
      });
    }
  }

  /**
   * Transforme les IDs d'une collection d'objets
   * @param {Array} dataArray - Le tableau d'objets à transformer
   * @param {Object} objects - Les objets contenant les données
   * @param {string} layer - Le layer de destination
   * @param {string} type - Le type d'objet ('shape', 'segment', 'point')
   */
  static transformIds(dataArray, objects, layer, type) {
    dataArray.forEach(item => {
      const oldId = item.id;
      item.id = addInfoToId(item.id, layer, type);
      this.updateReferences(objects, oldId, item.id, type);
    });
  }

  /**
   * Transforme les IDs des formes
   * @param {Object} objects - Les objets contenant les données
   * @param {string} layer - Le layer de destination
   */
  static transformShapeIds(objects, layer) {
    this.transformIds(objects.shapesData, objects, layer, 'shape');
  }

  /**
   * Transforme les IDs des segments
   * @param {Object} objects - Les objets contenant les données
   * @param {string} layer - Le layer de destination
   */
  static transformSegmentIds(objects, layer) {
    this.transformIds(objects.segmentsData, objects, layer, 'segment');
  }

  /**
   * Transforme les IDs des points
   * @param {Object} objects - Les objets contenant les données
   * @param {string} layer - Le layer de destination
   */
  static transformPointIds(objects, layer) {
    this.transformIds(objects.pointsData, objects, layer, 'point');
  }

  /**
   * Transforme l'ancien système d'ID vers le nouveau système
   * @param {Object} objects - Les objets à transformer
   * @param {string} layer - Le layer de destination
   */
  static transformToNewIdSystem(objects, layer) {
    this.transformShapeIds(objects, layer);
    this.transformSegmentIds(objects, layer);
    this.transformPointIds(objects, layer);
  }

  /**
   * Valide le contenu d'un fichier avec des vérifications robustes
   * @param {Object} saveObject - L'objet de sauvegarde à valider
   * @returns {boolean} - True si valide, false sinon
   */
  static validateFileContent(saveObject) {
    // Vérifications de base
    if (!saveObject || typeof saveObject !== 'object') {
      this.showErrorNotification(ERROR_MESSAGES.FILE_PARSE_ERROR);
      return false;
    }

    // Vérification de la version
    if (!saveObject.appVersion || saveObject.appVersion === '1.0.0') {
      this.showErrorNotification(ERROR_MESSAGES.UNSUPPORTED_VERSION);
      return false;
    }

    // Vérification de l'environnement
    if (!saveObject.envName || saveObject.envName !== app.environment.name) {
      const envMessage = saveObject.envName
        ? ERROR_MESSAGES.WRONG_ENVIRONMENT + saveObject.envName + '.'
        : 'Environnement non spécifié dans le fichier.';
      this.showErrorNotification(envMessage);
      return false;
    }

    // Vérification de la structure des données
    if (!saveObject.workspaceData && !saveObject.wsdata) {
      this.showErrorNotification('Données de workspace manquantes dans le fichier.');
      return false;
    }

    return true;
  }

  /**
   * Affiche une notification d'erreur
   * @param {string} message - Le message d'erreur à afficher
   */
  static showErrorNotification(message) {
    window.dispatchEvent(new CustomEvent('show-notif', {
      detail: { message }
    }));
  }

  /**
   * Traite les paramètres du fichier
   * @param {Object} saveObject - L'objet de sauvegarde
   */
  static processSettings(saveObject) {
    if (saveObject.settings) {
      setState({
        settings: { // TODO: remove this, settings are already reset by app.resetSettings()
          ...saveObject.settings,
          ...DEFAULT_SETTINGS
        }
      });
    } else {
      app.resetSettings();
    }
    // Restauration de la grille si présente dans le fichier
    if (saveObject.settings.gridType) {
      gridStore.setGridType(saveObject.settings.gridType);
    }
    if (saveObject.settings.gridSize) {
      gridStore.setGridSize(saveObject.settings.gridSize);
    }
    if (typeof saveObject.settings.gridOpacity !== 'undefined') {
      gridStore.setGridOpacity(saveObject.settings.gridOpacity);
    }
    if (typeof saveObject.settings.gridShown !== 'undefined') {
      gridStore.setIsVisible(saveObject.settings.gridShown);
    }
  }

  /**
   * Traite l'historique du fichier
   * @param {Object} saveObject - L'objet de sauvegarde
   */
  static processHistory(saveObject) {
    // Traitement de fullHistory
    if (saveObject.fullHistory) {
      setState({ fullHistory: { ...saveObject.fullHistory } });
    } else {
      setState({
        fullHistory: { ...app.defaultState.fullHistory },
      });
    }

    // Traitement de history selon l'environnement
    if (app.environment.name === 'Tangram') {
      this.processTangramHistory(saveObject);
    } else {
      this.processDefaultHistory(saveObject);
    }
  }

  /**
   * Traite l'historique spécifique à Tangram
   * @param {Object} saveObject - L'objet de sauvegarde
   */
  static processTangramHistory(saveObject) {
    if (saveObject.history) {
      setState({
        history: {
          ...saveObject.history,
          startSituation: {
            ...saveObject.history.startSituation,
            tangram: {
              isSilhouetteShown: true,
              currentStep: 'start'
            }
          },
        },
      });
    } else {
      setState({
        history: {
          ...app.defaultState.history,
          startSituation: null,
          startSettings: { ...app.settings },
        },
      });
    }
  }

  /**
   * Traite l'historique par défaut
   * @param {Object} saveObject - L'objet de sauvegarde
   */
  static processDefaultHistory(saveObject) {
    if (saveObject.history) {
      setState({
        history: { ...saveObject.history },
      });
    } else {
      setState({
        history: {
          ...app.defaultState.history,
          startSituation: {
            ...app.workspace.data,
          },
          startSettings: { ...app.settings },
        },
      });
    }
  }

  /**
   * Traite la visibilité des outils et familles
   * @param {Object} saveObject - L'objet de sauvegarde
   */
  static processVisibility(saveObject) {
    const toolsVisibility = saveObject.toolsVisibility || saveObject.toolsVisible;
    if (toolsVisibility) setToolsVisibility(toolsVisibility);

    const familiesVisibility = saveObject.familiesVisibility || saveObject.familiesVisible;
    if (familiesVisibility?.length) setFamiliesVisibility(familiesVisibility);
  }

  /**
   * Déclenche les événements de rafraîchissement
   */
  static triggerRefreshEvents() {
    window.dispatchEvent(new CustomEvent('refresh'));
    window.dispatchEvent(new CustomEvent('refreshUpper'));
    window.dispatchEvent(new CustomEvent('refreshBackground'));
  }

  /**
   * Parse le contenu JSON d'un fichier
   * @param {string} fileContent - Le contenu du fichier à parser
   * @returns {Object|null} - L'objet parsé ou null en cas d'erreur
   */
  static parseJsonContent(fileContent) {
    if (typeof fileContent !== 'string') {
      return fileContent; // Déjà un objet
    }

    if (!fileContent.trim()) {
      throw new Error('contenu vide');
    }

    try {
      return JSON.parse(fileContent);
    } catch (error) {
      console.error('Erreur de parsing JSON:', error);
      throw new Error('JSON invalide');
    }
  }

  /**
   * Parse et traite le contenu d'un fichier
   * @param {string|Object} fileContent - Le contenu du fichier
   * @param {string} filename - Le nom du fichier
   */
  static async parseFile(fileContent, filename) {
    try {
      // Parsing du contenu
      const saveObject = this.parseJsonContent(fileContent);

      // Ajout de l'extension du fichier
      saveObject.fileExtension = getExtension(filename);

      // Validation du fichier
      if (!this.validateFileContent(saveObject)) {
        return;
      }

      // Appliquer les migrations nécessaires pour la compatibilité entre versions
      applyMigrations(saveObject);

      // Chargement du workspace
      const WorkspaceManagerModule = await import('./WorkspaceManager.js');
      WorkspaceManagerModule.setWorkspaceFromObject(saveObject.workspaceData || saveObject.wsdata);

      // Traitement spécial pour Tangram
      if (app.environment.name === 'Tangram' && saveObject.fileExtension === 'ags') {
        app.mainCanvasLayer.removeAllObjects();
      }

      // Traitement des différentes sections
      this.processSettings(saveObject);
      this.processHistory(saveObject);
      this.processVisibility(saveObject);

      // Finalisation
      setState({ filename });
      window.dispatchEvent(new CustomEvent('file-parsed', { detail: saveObject }));
      this.triggerRefreshEvents();

    } catch (error) {
      const errorMessage = error.message.includes('vide')
        ? ERROR_MESSAGES.FILE_PARSE_ERROR + ' (fichier vide)'
        : ERROR_MESSAGES.FILE_PARSE_ERROR;

      this.showErrorNotification(errorMessage);
    }
  }
}

window.addEventListener('open-file', openPopupFile);

window.addEventListener('local-open-file', () => {
  OpenFileManager.openFile();
});

window.addEventListener('file-opened', (event) => {
  if (event.detail.method === 'old')
    OpenFileManager.oldReadFile(event.detail.file);
  else OpenFileManager.newReadFile(event.detail.file[0]);
});

// Si ancien ou nouveau systeme de fichier
OpenFileManager.hasNativeFS = 'showOpenFilePicker' in window;