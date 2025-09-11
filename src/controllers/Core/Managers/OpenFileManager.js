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
   * Transforme les IDs des formes
   * @param {Object} objects - Les objets contenant les données
   * @param {string} layer - Le layer de destination
   */
  static transformShapeIds(objects, layer) {
    const isGeometry = app.environment.name === 'Geometrie';

    objects.shapesData.forEach(shape => {
      const oldId = shape.id;
      shape.id = addInfoToId(shape.id, layer, 'shape');

      // Mise à jour des références dans segments
      objects.segmentsData.forEach(seg => {
        if (seg.shapeId === oldId) {
          seg.shapeId = shape.id;
        }
      });

      // Mise à jour des références dans points
      objects.pointsData.forEach(pt => {
        if (pt.shapeId === oldId) {
          pt.shapeId = shape.id;
        }
      });

      // Mise à jour des références géométriques
      if (isGeometry) {
        objects.shapesData.forEach(s => {
          this.updateGeometryReference(s.geometryObject, oldId, shape.id);
        });
      }
    });
  }

  /**
   * Transforme les IDs des segments
   * @param {Object} objects - Les objets contenant les données
   * @param {string} layer - Le layer de destination
   */
  static transformSegmentIds(objects, layer) {
    const isGeometry = app.environment.name === 'Geometrie';

    objects.segmentsData.forEach(segment => {
      const oldId = segment.id;
      segment.id = addInfoToId(segment.id, layer, 'segment');

      // Mise à jour des références dans shapes
      objects.shapesData.forEach(s => {
        s.segmentIds.forEach((segId, idx) => {
          if (segId === oldId) {
            s.segmentIds[idx] = segment.id;
          }
        });
      });

      // Mise à jour des références dans points
      objects.pointsData.forEach(pt => {
        pt.segmentIds.forEach((segId, idx) => {
          if (segId === oldId) {
            pt.segmentIds[idx] = segment.id;
          }
        });
      });

      // Mise à jour des références géométriques
      if (isGeometry) {
        objects.shapesData.forEach(s => {
          this.updateGeometryReference(s.geometryObject, oldId, segment.id);
        });
      }
    });
  }

  /**
   * Transforme les IDs des points
   * @param {Object} objects - Les objets contenant les données
   * @param {string} layer - Le layer de destination
   */
  static transformPointIds(objects, layer) {
    const isGeometry = app.environment.name === 'Geometrie';

    objects.pointsData.forEach(point => {
      const oldId = point.id;
      point.id = addInfoToId(point.id, layer, 'point');

      // Mise à jour des références dans shapes
      objects.shapesData.forEach(s => {
        s.pointIds.forEach((ptId, idx) => {
          if (ptId === oldId) {
            s.pointIds[idx] = point.id;
          }
        });
      });

      // Mise à jour des références dans segments
      objects.segmentsData.forEach(seg => {
        seg.vertexIds.forEach((ptId, idx) => {
          if (ptId === oldId) {
            seg.vertexIds[idx] = point.id;
          }
        });

        seg.divisionPointIds.forEach((ptId, idx) => {
          if (ptId === oldId) {
            seg.divisionPointIds[idx] = point.id;
          }
        });

        if (seg.arcCenterId === oldId) {
          seg.arcCenterId = point.id;
        }
      });

      // Mise à jour des références dans autres points
      objects.pointsData.forEach(pt => {
        pt.endpointIds?.forEach((ptId, idx) => {
          if (ptId === oldId) {
            pt.endpointIds[idx] = point.id;
          }
        });

        if (pt.reference === oldId) {
          pt.reference = point.id;
        }
      });

      // Mise à jour des références géométriques
      if (isGeometry) {
        objects.shapesData.forEach(s => {
          this.updateGeometryReference(s.geometryObject, oldId, point.id);
        });
      }
    });
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
   * Valide le contenu d'un fichier
   * @param {Object} saveObject - L'objet de sauvegarde à valider
   * @returns {boolean} - True si valide, false sinon
   */
  static validateFileContent(saveObject) {
    if (saveObject.appVersion === '1.0.0') {
      window.dispatchEvent(new CustomEvent('show-notif', {
        detail: { message: ERROR_MESSAGES.UNSUPPORTED_VERSION }
      }));
      return false;
    }

    if (saveObject.envName !== app.environment.name) {
      window.dispatchEvent(new CustomEvent('show-notif', {
        detail: { message: ERROR_MESSAGES.WRONG_ENVIRONMENT + saveObject.envName + '.' }
      }));
      return false;
    }

    return true;
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
   * Parse et traite le contenu d'un fichier
   * @param {string|Object} fileContent - Le contenu du fichier
   * @param {string} filename - Le nom du fichier
   */
  static async parseFile(fileContent, filename) {
    let saveObject;

    // Vérification du contenu avant parsing
    if (typeof fileContent === 'string') {
      if (!fileContent.trim()) {
        console.error('Erreur de parsing JSON: contenu vide');
        window.dispatchEvent(new CustomEvent('show-notif', {
          detail: { message: ERROR_MESSAGES.FILE_PARSE_ERROR + ' (fichier vide)' }
        }));
        return;
      }
      try {
        saveObject = JSON.parse(fileContent);
      } catch (e) {
        console.error('Erreur de parsing JSON:', e);
        window.dispatchEvent(new CustomEvent('show-notif', {
          detail: { message: ERROR_MESSAGES.FILE_PARSE_ERROR }
        }));
        return;
      }
    } else {
      saveObject = fileContent;
    }

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