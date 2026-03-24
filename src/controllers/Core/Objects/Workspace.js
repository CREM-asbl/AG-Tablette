import { app } from '../App';
import { Point } from '../Objects/Point';
import { findObjectById, uniqId } from '../Tools/general';
import { CharacteristicElements } from './CharacteristicElements';
import { Coordinates } from './Coordinates';
import { ShapeGroup } from './ShapeGroup';

// Note: Tangram backObjects loading moved to SolutionCheckerTool
// to prevent premature silhouette display before level selection

/**
 * Représente un projet, qui peut être sauvegardé/restauré. Un utilisateur peut
 * travailler sur plusieurs projets en même temps.
 */
export class Workspace {
  constructor() {
    // Identifiant unique de l'espace de travail
    this.id = uniqId();

    // Liste des figures du projet ([Shape])
    this.shapes = [];

    // Liste des segments du projet ([Segment])
    this.segments = [];

    // Liste des points du projet ([Point])
    this.points = [];

    // Liste des groupes créés par l'utilisateur
    this.shapeGroups = [];

    // Liste des id de shapes a ne pas redessiner pendant une action
    this.editingShapesIds = [];

    // Coordonnées du dernier événement
    this.lastKnownMouseCoordinates = Coordinates.nullCoordinates;

    // Couleur sélectionnée pour border- ou backgroundColor
    this.selectedColor = '#000';

    // Opacité sélectionnée dans le popup
    this.selectedOpacity = 0.7;

    // contrainte de sélection pour figures, segments et points
    this.selectionConstraints = {};

    // Niveau de zoom de l'interface
    this.zoomLevel = 1;

    /**
     * décalage du canvas (translation horizontale et verticale), un chiffre
     * positif signifie un décalage horizontal vers la droite ou vertical
     * vers le bas.
     * ->Le zoom du plan est appliqué après la translation du plan.
     */
    this.translateOffset = Coordinates.nullCoordinates;

    // Initialiser les éléments caractéristiques pour Géométrie
    this.translationLastCharacteristicElements = [];
    this.orthogonalSymetryLastCharacteristicElements = [];
    this.centralSymetryLastCharacteristicElements = [];
    this.rotationLastCharacteristicElements = [];
  }

  initGeometrie() {
    if (app.environment?.name === 'Geometrie') {
      this.orthogonalSymetryLastCharacteristicElements = [];
      this.centralSymetryLastCharacteristicElements = [];
      this.translationLastCharacteristicElements = [];
      this.rotationLastCharacteristicElements = [];
    }
  }

  getCharacteristicElementsBucket(transformationName) {
    const bucketMap = {
      translation: 'translationLastCharacteristicElements',
      orthogonalSymetry: 'orthogonalSymetryLastCharacteristicElements',
      centralSymetry: 'centralSymetryLastCharacteristicElements',
      rotation: 'rotationLastCharacteristicElements',
    };
    const key = bucketMap[transformationName];
    return key ? this[key] : null;
  }

  ensureCharacteristicElementsFromShapes(transformationName) {
    const bucketMap = {
      translation: 'translationLastCharacteristicElements',
      orthogonalSymetry: 'orthogonalSymetryLastCharacteristicElements',
      centralSymetry: 'centralSymetryLastCharacteristicElements',
      rotation: 'rotationLastCharacteristicElements',
    };
    const key = bucketMap[transformationName];
    if (!key) return;

    const mergedBucket = [];
    const normalizeIdBase = (id) => {
      if (!id || typeof id !== 'string') return null;
      if (id.length === 10) return id.substring(0, 8);
      if (id.length > 10) return id.substring(id.length - 8);
      return id;
    };

    const resolveCharacteristicElementId = (elementId, type, index) => {
      if (!elementId || typeof elementId !== 'string') return elementId;
      if (findObjectById(elementId)) return elementId;

      const preferredTypeByCharacteristic = {
        axis: ['segment', 'shape'],
        vector: ['segment', 'shape'],
        symetryCenter: 'point',
        'two-points': 'point',
        points: 'point',
      };

      let preferredType = preferredTypeByCharacteristic[type] || null;
      if (type === 'arc') preferredType = index === 1 ? 'segment' : 'point';

      const baseId = normalizeIdBase(elementId);
      if (!baseId) return elementId;

      const layers = ['main', 'upper'];
      const allTypes = Array.isArray(preferredType)
        ? preferredType
        : preferredType
          ? [preferredType]
          : ['point', 'segment', 'shape'];

      for (const layer of layers) {
        for (const objectType of allTypes) {
          const objects = app[layer + 'CanvasLayer']?.[objectType + 's'] || [];
          const found = objects.find((obj) => obj.id?.substring(0, 8) === baseId);
          if (found?.id) {
            return found.id;
          }
        }
      }

      return elementId;
    };

    const inferTypeFromLegacyIds = (legacyIds) => {
      if (transformationName === 'centralSymetry') return 'symetryCenter';
      if (transformationName === 'orthogonalSymetry') {
        return legacyIds.length <= 1 ? 'axis' : 'two-points';
      }
      if (transformationName === 'translation') {
        return legacyIds.length <= 1 ? 'vector' : 'two-points';
      }
      if (transformationName === 'rotation') {
        if (legacyIds.length === 2) {
          const secondId = resolveCharacteristicElementId(
            legacyIds[1],
            'arc',
            1,
          );
          const secondObject = secondId ? findObjectById(secondId) : null;
          return secondObject?.constructor?.name === 'Segment' ? 'arc' : 'points';
        }
        return 'points';
      }
      return '';
    };

    const pushUnique = (rawElements) => {
      if (!rawElements?.elementIds?.length) return;

      const characteristicElements =
        rawElements instanceof CharacteristicElements
          ? rawElements
          : new CharacteristicElements(rawElements);

      characteristicElements.elementIds = characteristicElements.elementIds.map(
        (elementId, index) =>
          resolveCharacteristicElementId(
            elementId,
            characteristicElements.type,
            index,
          ),
      );

      if (
        !mergedBucket.find((existing) => existing.equal(characteristicElements))
      ) {
        mergedBucket.push(characteristicElements);
      }
    };

    const currentBucket = Array.isArray(this[key]) ? this[key] : [];
    currentBucket.forEach((elements) => pushUnique(elements));

    app.mainCanvasLayer.shapes.forEach((shape) => {
      const geometryObject = shape.geometryObject;
      if (geometryObject?.geometryTransformationName !== transformationName)
        return;

      const rawElements = geometryObject.geometryTransformationCharacteristicElements;
      if (rawElements?.elementIds?.length) {
        pushUnique(rawElements);
        return;
      }

      // Legacy compatibility: old saves could store only an ID list.
      const legacyIds = geometryObject.geometryTransformationCharacteristicElementIds;
      if (Array.isArray(legacyIds) && legacyIds.length > 0) {
        pushUnique({
          type: inferTypeFromLegacyIds(legacyIds),
          elementIds: legacyIds,
          clockwise: !!geometryObject.clockwise,
        });
      }
    });

    this[key] = mergedBucket;
  }

  set selectionConstraints(value) {
    this.pvSelectCstr = value;
  }

  get selectionConstraints() {
    return this.pvSelectCstr;
  }

  /**
   * Initialise l'espace de travail à partir d'un objet de données
   * @param {Object|null} wsdata - Les données de l'espace de travail
   */
  async initFromObject(wsdata) {
    this.zoomLevel = wsdata?.zoomLevel || 1;
    if (!wsdata) {
      await this.resetWorkspace();
      return;
    }

    // Validation des données d'entrée
    if (typeof wsdata !== 'object') {
      console.error('Workspace: Données invalides passées à initFromObject');
      await this.resetWorkspace();
      return;
    }

    this.id = wsdata.id;

    const scale = wsdata.canvasSize
      ? Math.min(
        app.canvasWidth / wsdata.canvasSize.width,
        app.canvasHeight / wsdata.canvasSize.height,
      )
      : 1;

    // Chargement des objets principaux avec validation
    try {
      if (
        app.mainCanvasLayer &&
        typeof app.mainCanvasLayer.loadFromData === 'function'
      ) {
        await app.mainCanvasLayer.loadFromData(wsdata.objects);
      } else {
        console.error(
          'Workspace: mainCanvasLayer non disponible pour le chargement',
        );
      }
    } catch (error) {
      console.error(
        'Workspace: Erreur lors du chargement des objets principaux:',
        error,
      );
    }

    if (scale !== 1) this.setZoomLevel(scale);

    // Note: backObjects loading for Tangram is handled by SolutionCheckerTool
    // after level selection to prevent premature silhouette display

    if (!wsdata.shapeGroups) wsdata.shapeGroups = [];

    try {
      this.shapeGroups = wsdata.shapeGroups
        .map((groupData) => {
          if (!groupData || typeof groupData !== 'object') {
            console.warn('Workspace: Données de groupe invalides ignorées');
            return null;
          }
          const group = new ShapeGroup(0, 1);
          group.initFromObject(groupData);
          return group;
        })
        .filter((group) => group !== null); // Filtrer les groupes invalides
    } catch (error) {
      console.error('Workspace: Erreur lors du chargement des groupes:', error);
      this.shapeGroups = [];
    }

    if (app.environment.name === 'Geometrie') {
      const hydrateCharacteristicElements = (elementsData) =>
        Array.isArray(elementsData)
          ? elementsData.map((element) => new CharacteristicElements(element))
          : [];

      this.translationLastCharacteristicElements =
        hydrateCharacteristicElements(
          wsdata.translationLastCharacteristicElements,
        );
      this.orthogonalSymetryLastCharacteristicElements =
        hydrateCharacteristicElements(
          wsdata.orthogonalSymetryLastCharacteristicElements,
        );
      this.centralSymetryLastCharacteristicElements =
        hydrateCharacteristicElements(
          wsdata.centralSymetryLastCharacteristicElements,
        );
      this.rotationLastCharacteristicElements = hydrateCharacteristicElements(
        wsdata.rotationLastCharacteristicElements,
      );
    }

    this.setTranslateOffset(
      new Coordinates({
        x: wsdata.translateOffset ? wsdata.translateOffset.x * scale : 0,
        y: wsdata.translateOffset ? wsdata.translateOffset.y * scale : 0,
      }),
    );
    this.setZoomLevel(wsdata.zoomLevel * scale || scale, false);

    // Note: Refresh events for Tangram are handled by SolutionCheckerTool
    // after silhouette positioning
  }



  get data() {
    const wsdata = {};

    wsdata.id = this.id;

    wsdata.objects = app.mainCanvasLayer.saveData();
    if (app.tangramCanvasLayer) {
      let mustEraseShapes = false;
      if (app.tangramCanvasLayer.shapes.length === 0) {
        window.dispatchEvent(new CustomEvent('create-silhouette'));
        mustEraseShapes = true;
      }
      wsdata.backObjects = app.tangramCanvasLayer.saveData();
      if (mustEraseShapes) {
        app.tangramCanvasLayer.removeAllObjects();
      }
    }
    if (app.environment.name === 'Geometrie') {
      wsdata.translationLastCharacteristicElements =
        this.translationLastCharacteristicElements.map((element) =>
          element.saveData(),
        );
      wsdata.orthogonalSymetryLastCharacteristicElements =
        this.orthogonalSymetryLastCharacteristicElements.map((element) =>
          element.saveData(),
        );
      wsdata.centralSymetryLastCharacteristicElements =
        this.centralSymetryLastCharacteristicElements.map((element) =>
          element.saveData(),
        );
      wsdata.rotationLastCharacteristicElements =
        this.rotationLastCharacteristicElements.map((element) =>
          element.saveData(),
        );
    }
    if (this.shapeGroups.length !== 0) {
      wsdata.shapeGroups = this.shapeGroups.map((group) => {
        return group.saveToObject();
      });
    }

    if (this.zoomLevel !== 1) wsdata.zoomLevel = this.zoomLevel;
    if (this.translateOffset.x !== 0 || this.translateOffset.y !== 0) {
      wsdata.translateOffset = this.translateOffset;
    }

    wsdata.canvasSize = { width: app.canvasWidth, height: app.canvasHeight };

    return wsdata;
  }

  /**
   * Définir le niveau de zoom de l'espace de travail
   * @param {float}  newZoomLevel     Le niveau de zoom (1: zoom normal)
   * @param {Boolean} [doRefresh=true] false: ne pas rafraichir les canvas
   */
  setZoomLevel(newZoomLevel, doRefresh = true) {
    if (newZoomLevel < app.settings.minZoomLevel)
      newZoomLevel = app.settings.minZoomLevel;
    if (newZoomLevel > app.settings.maxZoomLevel)
      newZoomLevel = app.settings.maxZoomLevel;

    this.zoomLevel = newZoomLevel;

    if (doRefresh) {
      window.dispatchEvent(new CustomEvent('refresh'));
      window.dispatchEvent(new CustomEvent('refreshUpper'));
      window.dispatchEvent(new CustomEvent('refreshGrid'));
    }
  }

  /**
   * Définir la translation du plan (pour cet espace de travail)
   * @param {Point}  newOffset        Le décalage par rapport à (0, 0)
   * @param {Boolean} [doRefresh=true] false: ne pas rafraichir les canvas
   */
  setTranslateOffset(newOffset, doRefresh = true) {
    this.translateOffset = newOffset;

    if (doRefresh) {
      window.dispatchEvent(new CustomEvent('refresh'));
      window.dispatchEvent(new CustomEvent('refreshUpper'));
      window.dispatchEvent(new CustomEvent('refreshGrid'));
    }
  }

  toSVG() {
    let svg_data = `<svg width="${app.canvasWidth}" height="${app.canvasHeight}" viewBox="0 0 ${app.canvasWidth} ${app.canvasHeight}" encoding="UTF-8" xmlns="http://www.w3.org/2000/svg" >\n\n`;
    if (app.gridCanvasLayer) svg_data += app.gridCanvasLayer.toSVG();
    svg_data += app.mainCanvasLayer.toSVG();
    if (app.tangramCanvasLayer) {
      svg_data += `<g id="silhouette" transform="translate(${app.canvasWidth / 2}, 0)">`;
      svg_data += app.tangramCanvasLayer.toSVG();
      svg_data += '</g>';
      if (app.workspace.limited) {
        svg_data += `<rect x="${app.canvasWidth / 2}" width="${app.canvasWidth / 2}" height="${app.canvasHeight}" style="fill:rgb(255,0,0, 0.2);" />`;
      }
    }
    svg_data += '</svg>';

    return svg_data;
  }

  async resetWorkspace() {
    this.translateOffset = Coordinates.nullCoordinates;
    await app.mainCanvasLayer.loadFromData(null);
    app.tangramCanvasLayer?.clear();
    app.gridCanvasLayer?.clear();
  }
}
