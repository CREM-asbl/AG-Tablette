import { app } from '../App';
import { uniqId } from '../Tools/general';
import { CompleteHistory } from './CompleteHistory';
import { ShapeGroup } from './ShapeGroup';
import { Shape } from './Shape';
import { Settings } from '../Settings';
import { Point } from '../Objects/Point';
import { History } from './History';

/**
 * Représente un projet, qui peut être sauvegardé/restauré. Un utilisateur peut
 * travailler sur plusieurs projets en même temps.
 */
export class Workspace {
  constructor() {
    // Identifiant unique de l'espace de travail
    this.id = uniqId();

    // Liste des formes du projet ([Shape])
    this.shapes = [];

    // Liste des groupes créés par l'utilisateur
    this.shapeGroups = [];

    // Liste des shapes a ne pas redessiner pendant une action
    this.editingShapes = [];

    this.settings = new Settings();
    this.initSettings();

    // Historique des actions
    this.history = new History();

    // Historique complet des événements
    this.completeHistory = new CompleteHistory(new Event('useless').timeStamp);

    // Coordonnées du dernier événement
    this.lastKnownMouseCoordinates = new Point(0, 0);

    // Couleur sélectionnée pour border- ou backgroundColor
    this.selectedColor = '#000';

    // Opacité sélectionnée dans le popup
    this.selectedOpacity = 0.7;

    // contrainte de sélection pour formes, segments et points
    this.selectionConstraints = {};

    // Niveau de zoom de l'interface
    this.zoomLevel = 1;

    /**
     * décalage du canvas (translation horizontale et verticale), un chiffre
     * positif signifie un décalage horizontal vers la droite ou vertical
     * vers le bas.
     * ->Le zoom du plan est appliqué après la translation du plan.
     */
    this.translateOffset = new Point(0, 0);
  }

  initSettings() {
    //La grille est-elle affichée ?
    this.settings.set('isGridShown', false);

    //Taille de la grille
    this.settings.set('gridSize', 1);

    //Type de grille: 'square' ou 'triangle'
    this.settings.set('gridType', 'none');

    //Tangram affiché ?
    this.settings.set('isTangramShown', false);

    //Type (main/local) et id du tangram affiché.
    this.settings.set('shownTangram', {
      type: null, //'main' ou 'local'
      id: null,
    });

    window.dispatchEvent(new CustomEvent('workspace-settings-changed'));
  }

  set selectionConstraints(value) {
    this.pvSelectCstr = value;
  }

  get selectionConstraints() {
    return this.pvSelectCstr;
  }

  initFromObject(wsdata) {
    this.id = wsdata.id;

    this.shapes = wsdata.shapes.map(sData => {
      let shape = new Shape({ x: 0, y: 0 }, []);
      shape.initFromObject(sData);
      return shape;
    });
    this.shapeGroups = wsdata.shapeGroups.map(groupData => {
      let group = new ShapeGroup(0, 1);
      group.initFromObject(groupData);
      return group;
    });

    if (wsdata.completeHistory) {
      this.completeHistory.initFromObject(wsdata.completeHistory);
    } else {
      this.completeHistory.initFromObject({
        steps: [],
        startTimestamp: new Event('useless').timeStamp,
        endTimestamp: 0,
      });
    }

    this.zoomLevel = wsdata.zoomLevel;
    this.translateOffset = new Point(wsdata.translateOffset);

    if (wsdata.settings) {
      this.settings.initFromObject(wsdata.settings);
    } else this.initSettings();

    if (wsdata.history) {
      if (app.lastFileVersion == '1.0.0') {
        this.history.initFromObject({
          data: wsdata.history.history,
          index: wsdata.history.historyIndex,
        });
      } else {
        this.history.initFromObject(wsdata.history);
      }
      window.dispatchEvent(new CustomEvent('history-changed'));
    } else {
      this.history.initFromObject({ index: -1, data: [] });
    }

    if (
      wsdata.canvasSize &&
      (wsdata.canvasSize.width != app.canvasWidth || wsdata.canvasSize.height != app.canvasHeight)
    ) {
      let scaleOffset =
          wsdata.canvasSize.width / app.canvasWidth < wsdata.canvasSize.height / app.canvasHeight
            ? app.canvasHeight / wsdata.canvasSize.height
            : app.canvasWidth / wsdata.canvasSize.width,
        originalZoom = this.zoomLevel,
        newZoom = originalZoom * scaleOffset,
        originalTranslateOffset = this.translateOffset,
        actualCenter = new Point(
          wsdata.canvasSize.width,
          wsdata.canvasSize.height,
        ).multiplyWithScalar(1 / originalZoom),
        newCenter = new Point(app.canvasWidth, app.canvasHeight).multiplyWithScalar(1 / newZoom),
        corr = originalTranslateOffset.multiplyWithScalar(1 / originalZoom), // error with the old zoom that move the center
        newTranslateoffset = newCenter
          .subCoordinates(actualCenter)
          .multiplyWithScalar(0.5)
          .addCoordinates(corr)
          .multiplyWithScalar(newZoom);

      this.setZoomLevel(newZoom, false);
      this.setTranslateOffset(newTranslateoffset);
    }
  }

  get data() {
    const wsdata = {};

    wsdata.id = this.id;

    wsdata.shapes = this.shapes.map(s => {
      return s.saveToObject();
    });
    wsdata.shapeGroups = this.shapeGroups.map(group => {
      return group.saveToObject();
    });

    wsdata.history = this.history.saveToObject();
    if (this.completeHistory) wsdata.completeHistory = this.completeHistory.saveToObject();

    wsdata.zoomLevel = this.zoomLevel;
    wsdata.translateOffset = this.translateOffset.saveToObject();

    wsdata.settings = this.settings.saveToObject();

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
    if (newZoomLevel < app.settings.get('minZoomLevel'))
      newZoomLevel = app.settings.get('minZoomLevel');
    if (newZoomLevel > app.settings.get('maxZoomLevel'))
      newZoomLevel = app.settings.get('maxZoomLevel');

    window.dispatchEvent(
      new CustomEvent('scaleView', { detail: { scale: newZoomLevel / this.zoomLevel } }),
    );
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
    window.dispatchEvent(new CustomEvent('scaleView', { detail: { scale: 1 / this.zoomLevel } }));

    let offset = newOffset.subCoordinates(this.translateOffset);

    window.dispatchEvent(new CustomEvent('translateView', { detail: { offset: offset } }));
    this.translateOffset = newOffset;

    window.dispatchEvent(new CustomEvent('scaleView', { detail: { scale: this.zoomLevel } }));

    if (doRefresh) {
      window.dispatchEvent(new CustomEvent('refresh'));
      window.dispatchEvent(new CustomEvent('refreshUpper'));
      window.dispatchEvent(new CustomEvent('refreshBackground'));
    }
  }
}
