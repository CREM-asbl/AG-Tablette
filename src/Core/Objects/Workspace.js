import { app } from '../App';
import { Point } from '../Objects/Point';
import { uniqId } from '../Tools/general';
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
  }

  set selectionConstraints(value) {
    this.pvSelectCstr = value;
  }

  get selectionConstraints() {
    return this.pvSelectCstr;
  }

  initFromObject(wsdata) {
    if (!wsdata) {
      this.translateOffset = Coordinates.nullCoordinates;
      this.zoomLevel = 1;
      app.mainDrawingEnvironment.loadFromData(null);
      app.backgroundDrawingEnvironment.clear();
      return;
    }
    this.id = wsdata.id;

    app.mainDrawingEnvironment.loadFromData(wsdata.objects);
    if (app.environment.name == 'Tangram')
      app.backgroundDrawingEnvironment.loadFromData(wsdata.backObjects);
    else app.backgroundDrawingEnvironment.clear();
    this.shapeGroups = wsdata.shapeGroups.map((groupData) => {
      let group = new ShapeGroup(0, 1);
      group.initFromObject(groupData);
      return group;
    });

    this.zoomLevel = wsdata.zoomLevel;
    this.translateOffset = new Coordinates(wsdata.translateOffset);

    if (
      wsdata.canvasSize &&
      (wsdata.canvasSize.width != app.canvasWidth ||
        wsdata.canvasSize.height != app.canvasHeight)
    ) {
      let scaleOffset =
          wsdata.canvasSize.width / app.canvasWidth <
          wsdata.canvasSize.height / app.canvasHeight
            ? app.canvasHeight / wsdata.canvasSize.height
            : app.canvasWidth / wsdata.canvasSize.width,
        originalZoom = this.zoomLevel,
        newZoom = originalZoom * scaleOffset,
        originalTranslateOffset = this.translateOffset,
        actualCenter = new Coordinates({
          x: wsdata.canvasSize.width,
          y: wsdata.canvasSize.height,
        })
          .multiply(1 / 2)
          .substract(originalTranslateOffset)
          .multiply(newZoom / originalZoom),
        newCenter = new Coordinates({
          x: app.canvasWidth,
          y: app.canvasHeight,
        }).multiply(1 / 2),
        newTranslateoffset = newCenter.substract(actualCenter);

      this.setZoomLevel(newZoom, false);
      this.setTranslateOffset(newTranslateoffset);
    }
  }

  get data() {
    const wsdata = {};

    wsdata.id = this.id;

    // wsdata.shapes = this.shapes.map(s => {
    //   return s.saveToObject();
    // });
    wsdata.objects = app.mainDrawingEnvironment.saveData();
    wsdata.backObjects = app.backgroundDrawingEnvironment.saveData();
    wsdata.shapeGroups = this.shapeGroups.map((group) => {
      return group.saveToObject();
    });

    wsdata.zoomLevel = this.zoomLevel;
    wsdata.translateOffset = this.translateOffset;

    wsdata.canvasSize = { width: app.canvasWidth, height: app.canvasHeight };

    return wsdata;
  }

  /**
   * Exporter le Workspace en JSON
   * @return {String} le JSON
   */
  saveToJSON() {
    const json = JSON.stringify(this.data);
    return json;
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

    // window.dispatchEvent(
    //   new CustomEvent('scaleView', {
    //     detail: { scale: newZoomLevel / this.zoomLevel },
    //   })
    // );
    this.zoomLevel = newZoomLevel;

    if (doRefresh) {
      window.dispatchEvent(new CustomEvent('refresh'));
      window.dispatchEvent(new CustomEvent('refreshUpper'));
      window.dispatchEvent(new CustomEvent('refreshBackground'));
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
      window.dispatchEvent(new CustomEvent('refreshBackground'));
    }
  }

  toSVG() {
    let svg_data =
      '<svg width="' +
      app.canvasWidth +
      '" height="' +
      app.canvasHeight +
      '" encoding="UTF-8" xmlns="http://www.w3.org/2000/svg" >\n\n';
    svg_data += app.backgroundDrawingEnvironment.toSVG();
    svg_data += app.mainDrawingEnvironment.toSVG();
    if (document.body.querySelector('forbidden-canvas') != null) {
      svg_data +=
        '<rect x="' +
        app.canvasWidth / 2 +
        '" width="' +
        app.canvasWidth / 2 +
        '" height="' +
        app.canvasHeight +
        '" style="fill:rgb(255,0,0, 0.2);" />';
    }
    svg_data += '</svg>';

    return svg_data;
  }
}
