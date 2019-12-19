import { loadManifest } from '../Manifest';
import { app } from '../App';
import { uniqId } from '../Tools/general';
import { WorkspaceHistory } from './WorkspaceHistory';
import { GridManager } from '../GridManager';
import { ShapeGroup } from './ShapeGroup';
import { Shape } from './Shape';
import { Settings } from '../Settings';
import { Point } from '../Objects/Point';

/**
 * Représente un projet, qui peut être sauvegardé/restauré. Un utilisateur peut
 * travailler sur plusieurs projets en même temps.
 */
export class Workspace {
  constructor(environment) {
    //Version de l'application dans laquelle ce projet a été créé
    loadManifest().then(manifest => (this.appVersion = manifest.version));

    //Identifiant unique de l'espace de travail
    this.id = uniqId();

    //Représente l'historique
    this.history = new WorkspaceHistory();

    //liste des formes du projet ([Shape])
    this.shapes = [];

    //Liste des groupes créés par l'utilisateur
    this.shapeGroups = [];

    this.settings = new Settings();
    this.initSettings();

    //Niveau de zoom de l'interface
    this.zoomLevel = 1;

    /**
     * décalage du canvas (translation horizontale et verticale), un chiffre
     * positif signifie un décalage horizontal vers la droite ou vertical
     * vers le bas.
     * ->Le zoom du plan est appliqué après la translation du plan.
     */
    this.translateOffset = { x: 0, y: 0 };

    //L'environnement de travail de ce Workspace (ex: "Grandeur")
    this.environment = environment;

    //Managers:
    this.grid = GridManager;
  }

  initSettings() {
    //La grille est-elle affichée ?
    this.settings.set('isGridShown', false, true);

    //Taille de la grille
    this.settings.set('gridSize', 1, true);

    //Type de grille: 'square' ou 'triangle'
    this.settings.set('gridType', 'none', true);

    //Tangram affiché ?
    this.settings.set('isTangramShown', false, true);

    //Type (main/local) et id du tangram affiché.
    this.settings.set(
      'shownTangram',
      {
        type: null, //'main' ou 'local'
        id: null,
      },
      true,
    );
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

    this.history = new WorkspaceHistory();
    this.history.initFromObject(wsdata.history);

    this.shapeGroups = wsdata.shapeGroups.map(groupData => {
      let group = new ShapeGroup({ id: 0 }, { id: 1 });
      group.initFromObject(groupData);
      return group;
    });

    this.zoomLevel = wsdata.zoomLevel;

    this.translateOffset = wsdata.translateOffset;

    this.environment = app.envManager.getNewEnv(wsdata.envName);

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

    wsdata.history = this.history.saveToObject();

    wsdata.shapeGroups = this.shapeGroups.map(group => {
      return group.saveToObject();
    });

    wsdata.zoomLevel = this.zoomLevel;

    wsdata.translateOffset = this.translateOffset;

    wsdata.envName = this.environment.name;

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

    app.drawAPI.scaleView(newZoomLevel / this.zoomLevel);
    this.zoomLevel = newZoomLevel;

    if (doRefresh) {
      app.drawAPI.askRefresh('main');
      app.drawAPI.askRefresh('upper');
      app.drawAPI.askRefresh('background');
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
    app.drawAPI.scaleView(1 / this.zoomLevel); //TODO: nécessaire?

    let offset = {
      x: newOffset.x - this.translateOffset.x,
      y: newOffset.y - this.translateOffset.y,
    };

    app.drawAPI.translateView(offset);
    this.translateOffset = newOffset;

    app.drawAPI.scaleView(this.zoomLevel); //TODO: nécessaire?

    if (doRefresh) {
      app.drawAPI.askRefresh('main');
      app.drawAPI.askRefresh('upper');
      app.drawAPI.askRefresh('background');
    }
  }

  /* #################################################################### */
  /* ############################## FORMES ############################## */
  /* #################################################################### */
  //TODO: déplacer dans un shapeManager ?

  /**
   * Ajoute une forme au workspace
   * @param {Shape} shape la forme à ajouter
   */
  addShape(shape, index = null) {
    if (index !== null) {
      this.shapes.splice(index, 0, shape);
    } else {
      this.shapes.push(shape);
    }
  }

  /**
   * Renvoie l'index d'une forme (index dans le tableau de formes du
   * Workspace actuel), ou -1 si la forme n'a pas été trouvée.
   * @param  {Shape} shape la forme
   * @return {int}       l'index de cette forme dans le tableau des formes
   */
  getShapeIndex(shape) {
    return this.shapes.findIndex(s => s.id == shape.id);
  }

  /**
   * Renvoie la forme ayant un certain id
   * @param  {int} id l'id de la forme
   * @return {Shape}         l'objet forme, ou null si la forme n'existe pas
   */
  getShapeById(id) {
    let shape = this.shapes.find(s => s.id == id);
    return shape ? shape : null;
  }

  /**
   * Renvoie la liste des formes contenant un certain point.
   * Le tableau renvoyé est trié de la forme la plus en avant à la forme la
   * plus en arrière.
   * @param point: le point (Point)
   * @return la liste des formes ([Shape])
   */
  shapesOnPoint(point) {
    let list = this.shapes.filter(
      shape => app.drawAPI.isPointInShape(point, shape) || shape.isPointOnSegment(new Point(point)),
    );
    list.reverse();
    return list;
  }

  /**
   * Renvoie la liste des formes solidaires à la forme donnée (c'est-à-dire
   * faisant partie du même groupe).
   * @param  {Shape} shape Une forme
   * @param  {Boolean} [includeReceivedShape=false] true: inclus la forme
   * 												   reçue dans les résultats
   * @return {[Shape]}     Les formes liées
   */
  getAllBindedShapes(shape, includeReceivedShape = false) {
    let shapes = [shape],
      group = this.getShapeGroup(shape);
    if (group) {
      shapes = [...group.shapes];
    }

    if (!includeReceivedShape) {
      shapes = shapes.filter(s => s.id != shape.id);
    }
    return shapes;
  }

  /**
   * Supprime une forme. Ne la supprime pas des groupes (à faire manuellement)
   * @param  {Shape} shape La forme à supprimer
   */
  deleteShape(shape) {
    let shapeIndex = this.getShapeIndex(shape);
    if (shapeIndex == -1) {
      console.error("Workspace.deleteShape: couldn't delete the shape");
      return;
    }
    //supprime la forme
    this.shapes.splice(shapeIndex, 1);
  }

  /* #################################################################### */
  /* ############################## GROUPES ############################# */
  /* #################################################################### */
  //TODO: déplacer dans un groupManager ?

  /**
   * Ajouter un groupe à l'espace de travail
   * @param {Group} group         Le groupe
   * @param {int}	index			L'index où placer le groupe. Par défaut: à la fin
   */
  addGroup(group, index = null) {
    if (Number.isFinite(index)) {
      this.shapeGroups.splice(index, 0, group);
    } else {
      this.shapeGroups.push(group);
    }
  }

  /**
   * Récupérer l'index d'un groupe dans le tableau de groupes
   * @param  {Group} group         Le groupe
   * @return {int}               L'index (peut varier dans le temps!)
   */
  getGroupIndex(group) {
    return this.shapeGroups.findIndex(gr => gr.id == group.id);
  }

  /**
   * Réupérer le groupe d'une forme
   * @param  {Shape} shape         la forme
   * @return {Group}               le groupe, ou null s'il n'y en a pas.
   */
  getShapeGroup(shape) {
    let group = this.shapeGroups.find(gr => gr.contains(shape));
    return group ? group : null;
  }

  /**
   * Récupérer un groupe à partir de son id
   * @param  {String} id            L'id du groupe
   * @return {Group}               Le groupe, ou null s'il n'existe pas
   */
  getGroup(id) {
    for (let i = 0; i < this.shapeGroups.length; i++) {
      if (this.shapeGroups[i].id == id) return this.shapeGroups[i];
    }
    return null;
  }

  /**
   * Supprimer un groupe
   * @param  {Group} group         Le groupe
   */
  deleteGroup(group) {
    for (let i = 0; i < this.shapeGroups.length; i++) {
      if (this.shapeGroups[i].id == group.id) {
        this.shapeGroups.splice(i, 1);
        return;
      }
    }
    console.error("Couldn't delete group");
    return null;
  }
}
