import { app } from '../App';
import { Point } from '../Objects/Point';
import { uniqId } from '../Tools/general';
import { CharacteristicElements } from './CharacteristicElements';
import { Coordinates } from './Coordinates';
import { ShapeGroup } from './ShapeGroup';

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

    if (app.environment.name == 'Geometrie') {
      this.orthogonalSymetryLastCharacteristicElements = [];
      this.centralSymetryLastCharacteristicElements = [];
      this.translationLastCharacteristicElements = [];
      this.rotationLastCharacteristicElements = [];
    }
  }

  set selectionConstraints(value) {
    this.pvSelectCstr = value;
  }

  get selectionConstraints() {
    return this.pvSelectCstr;
  }

  initFromObject(wsdata) {
    this.zoomLevel = wsdata?.zoomLevel || 1;
    if (!wsdata) {
      this.resetWorkspace()
      return;
    }

    this.id = wsdata.id;
    const scale = Math.min(app.canvasWidth / wsdata.canvasSize.width, app.canvasHeight / wsdata.canvasSize.height)
    app.mainCanvasLayer.loadFromData(wsdata.objects);
    if (scale != 1) this.setZoomLevel(scale)

    if (!wsdata.shapeGroups) wsdata.shapeGroups = [];
    this.shapeGroups = wsdata.shapeGroups.map((groupData) => {
      let group = new ShapeGroup(0, 1);
      group.initFromObject(groupData);
      return group;
    });

    if (app.environment.name == 'Geometrie' && wsdata.translationLastCharacteristicElements) {
      this.translationLastCharacteristicElements = wsdata.translationLastCharacteristicElements.map(element => new CharacteristicElements(element));
    }

    const scaleOffset = Math.min(app.canvasWidth / wsdata.canvasSize.width, app.canvasHeight / wsdata.canvasSize.height)
    this.setTranslateOffset(new Coordinates({
      x: wsdata.translateOffset ? wsdata.translateOffset.x * scaleOffset : 0,
      y: wsdata.translateOffset ? wsdata.translateOffset.y * scaleOffset : 0
    }))
    this.setZoomLevel(wsdata.zoomLevel * scaleOffset || scaleOffset, false)

    // this.translateOffset = new Coordinates(wsdata.translateOffset || { x: 0, y: 0 });
    // if (wsdata.canvasSize &&
    //   (wsdata.canvasSize.width != app.canvasWidth ||
    //     wsdata.canvasSize.height != app.canvasHeight)) {
    //     originalZoom = this.zoomLevel,
    //     newZoom = originalZoom * scaleOffset,
    //     originalTranslateOffset = this.translateOffset,
    //     actualCenter = new Coordinates({ x: wsdata.canvasSize.width, y: wsdata.canvasSize.height })
    //       .multiply(1 / 2)
    //       .substract(originalTranslateOffset)
    //       .multiply(newZoom / originalZoom),
    //     newCenter = new Coordinates({ x: app.canvasWidth, y: app.canvasHeight }).multiply(1 / 2),
    //     newTranslateoffset = center ? newCenter.substract(actualCenter) : originalTranslateOffset;
    //   this.setZoomLevel(newZoom, false);
    //   this.setTranslateOffset(newTranslateoffset);
    // }
  }

  get data() {
    const wsdata = {};

    wsdata.id = this.id;

    wsdata.objects = app.mainCanvasLayer.saveData();
    if (app.tangramCanvasLayer) {
      let mustEraseShapes = false;
      if (app.tangramCanvasLayer.shapes.length == 0) {
        window.dispatchEvent(new CustomEvent('create-silhouette'));
        mustEraseShapes = true;
      }
      wsdata.backObjects = app.tangramCanvasLayer.saveData();
      if (mustEraseShapes) {
        app.tangramCanvasLayer.removeAllObjects();
      }
    }
    if (app.environment.name == 'Geometrie') {
      wsdata.translationLastCharacteristicElements = this.translationLastCharacteristicElements.map(element => element.saveData());
    }
    if (this.shapeGroups.length != 0) {
      wsdata.shapeGroups = this.shapeGroups.map((group) => {
        return group.saveToObject();
      });
    }

    if (this.zoomLevel != 1)
      wsdata.zoomLevel = this.zoomLevel;
    if (this.translateOffset.x != 0 || this.translateOffset.y != 0) {
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
    //TODO: limiter la translation à une certaine zone? (ex 4000 sur 4000?)
    //TODO: bouton pour revenir au "centre" ?
    this.translateOffset = newOffset;

    if (doRefresh) {
      window.dispatchEvent(new CustomEvent('refresh'));
      window.dispatchEvent(new CustomEvent('refreshUpper'));
      window.dispatchEvent(new CustomEvent('refreshGrid'));
    }
  }

  toSVG() {
    let svg_data =
      `<svg width="${app.canvasWidth}" height="${app.canvasHeight}" viewBox="0 0 ${app.canvasWidth} ${app.canvasHeight}" encoding="UTF-8" xmlns="http://www.w3.org/2000/svg" >\n\n`;
    if (app.gridCanvasLayer)
      svg_data += app.gridCanvasLayer.toSVG();
    svg_data += app.mainCanvasLayer.toSVG();
    if (app.tangramCanvasLayer) {
      svg_data += `<g id="silhouette" transform="translate(${app.canvasWidth / 2}, 0)">`
      svg_data += app.tangramCanvasLayer.toSVG();
      svg_data += '</g>'
      if (app.workspace.limited) {
        svg_data +=
          `<rect x="${app.canvasWidth / 2}" width="${app.canvasWidth / 2}" height="${app.canvasHeight}" style="fill:rgb(255,0,0, 0.2);" />`;
      }
    }
    svg_data += '</svg>';

    return svg_data;
  }

  resetWorkspace() {
    this.translateOffset = Coordinates.nullCoordinates;
    app.mainCanvasLayer.loadFromData(null);
    app.tangramCanvasLayer?.clear();
    app.gridCanvasLayer?.clear();
  }
}
