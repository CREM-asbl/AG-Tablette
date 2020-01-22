import { loadManifest } from '../Manifest';
import { app } from '../App';
import { uniqId } from '../Tools/general';
import { CompleteHistory } from './CompleteHistory';
import { ShapeGroup } from './ShapeGroup';
import { Shape } from './Shape';
import { Settings } from '../Settings';
import { Point } from '../Objects/Point';

/**
 * Représente un projet, qui peut être sauvegardé/restauré. Un utilisateur peut
 * travailler sur plusieurs projets en même temps.
 */
export class Workspace {
  constructor() {
    //Version de l'application dans laquelle ce projet a été créé
    loadManifest().then(manifest => (this.appVersion = manifest.version));

    //Identifiant unique de l'espace de travail
    this.id = uniqId();

    // Représente l'historique complet
    this.completeHistory = null;

    //liste des formes du projet ([Shape])
    this.shapes = [];

    //Liste des groupes créés par l'utilisateur
    this.shapeGroups = [];

    // Liste des shapes a ne pas redessiner pendant une action
    this.editingShapes = [];

    this.settings = new Settings();
    this.initSettings();

    //Niveau de zoom de l'interface
    this.zoomLevel = 1;

    // Historique des actions
    this.history = [];

    // Index de la dernière action effectuée dans app.workspace.history
    this.historyIndex = null;

    // Coordonnées du dernier événement
    this.lastKnownMouseCoordinates = { x: 0, y: 0 };

    // Couleur sélectionnée pour border- ou backgroundColor
    this.selectedColor = '#000';

    // Opacité sélectionnée dans le popup
    this.selectedOpacity = 0.7;

    // contrainte de sélection pour formes, segments et points
    this.selectionConstraints = null;

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

  /**
   * Importer les données du Workspace depuis une sauvegarde JSON
   * @param  {String} json
   */
  initFromJSON(json) {
    let wsdata = JSON.parse(json);

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

    this.history = wsdata.history;
    this.historyIndex = wsdata.historyIndex;
    window.dispatchEvent(new CustomEvent('history-changed'));
    if (wsdata.completeHistory) {
      this.completeHistory = new CompleteHistory();
      this.completeHistory.initFromObject(wsdata.completeHistory);
    }

    this.zoomLevel = wsdata.zoomLevel;
    this.translateOffset = new Point(wsdata.translateOffset);
    if (wsdata.WSSettings) this.settings.initFromObject(wsdata.WSSettings);
    else this.initSettings();
  }

  get data() {
    const wsdata = {};
    wsdata.appVersion = this.appVersion;
    wsdata.id = this.id;

    wsdata.shapes = this.shapes.map(s => {
      return s.saveToObject();
    });
    wsdata.shapeGroups = this.shapeGroups.map(group => {
      return group.saveToObject();
    });

    wsdata.history = app.workspace.history;
    wsdata.historyIndex = app.workspace.historyIndex;
    if (this.completeHistory) wsdata.completeHistory = this.completeHistory.saveToObject();

    wsdata.zoomLevel = this.zoomLevel;
    wsdata.translateOffset = this.translateOffset.saveToObject();
    wsdata.envName = app.environment.name;
    wsdata.WSSettings = this.settings.saveToObject();
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
