import { loadManifest } from '../Manifest'
import { app } from '../App'
import { uniqId } from '../Tools/general'
import { WorkspaceHistory } from './WorkspaceHistory'

/**
 * Représente un projet, qui peut être sauvegardé/restauré. Un utilisateur peut
 * travailler sur plusieurs projets en même temps.
 */
export class Workspace {

	constructor(environment) {
		//Version de l'application dans laquelle ce projet a été créé
		loadManifest().then(manifest => this.appVersion = manifest.version)

		//Identifiant unique de l'espace de travail
		this.id = uniqId();

		//Représente l'historique
		this.history = new WorkspaceHistory();

		//liste des formes du projet ([Shape])
		this.shapes = [];

		//Liste des groupes créés par l'utilisateur
		this.userShapeGroups = [];

		//Liste des groupes de formes qui sont liées par des points
		this.systemShapeGroups = [];

		//Niveau de zoom de l'interface
		this.zoomLevel = 1;

		/**
		 * décalage du canvas (translation horizontale et verticale)
		 * un chiffre positif signifie un décalage horizontal vers la droite ou vertical vers le bas.
		 */
		this.translateOffset = { 'x': 0, 'y': 0 };

		//L'environnement de travail de ce Workspace (ex: "Grandeur")
        this.environment = environment;
	}

	/**
	 * Ajoute une forme au workspace
	 * @param {Shape} shape la forme à ajouter
	 */
	addShape(shape) {
		this.shapes.push(shape);
	}

	/**
	 * Renvoie la liste des formes contenant un certain point
	 * @param point: le point (Point)
	 * @return la liste des formes ([Shape])
	 */
	shapesOnPoint(point) {
		const list = this.shapes.filter(shape => app.drawAPI.isPointInShape(point, shape));
		return list;
	};

	/**
	 * Supprime une forme. Ne la supprime pas des groupes (à faire manuellement)
	 * @param  {Shape} shape La forme à supprimer
	 */
	removeShape(shape) {
		//TODO: quand on fera l'action delete, supprimer les formes liées
		//var removedShapes = [shape]; //pour l'historique
		let shapeIndex = this.getShapeIndex(shape);
		if (shapeIndex == null) {
			console.error("Workspace.removeShape: couldn't remove the shape");
			return;
		}
		//supprime la forme
		this.shapes.splice(shapeIndex, 1);

		//supprimer la forme des 2 types de groupes (et les formes liées dans sysGroup)

		/*
		//supprime les formes créées après la forme supprimée et qui sont (indirectement)
		//liées à cette forme par un point.

		var that = this;
		var removeLinkedShapes = function (list, srcShape) {
			var local_removed = [];
			var to_remove = [];
			for (var i = 0; i < list.length; i++) {
				if (list[i].linkedShape == srcShape) { //la forme est liée à la forme supprimée (srcShape)
					var s = list.splice(i, 1)[0]; //la supprimer de la liste du groupe
					local_removed.push(s);
					var shapeIndex = that.getShapeIndex(s);
					if (shapeIndex !== null) {
						that.shapesList.splice(shapeIndex, 1); //la supprimer de la liste des formes
					}

					to_remove.push(s); //ajouter la forme pour la récursion
					i--;
				}
			}
			for (var i = 0; i < to_remove.length; i++)
				local_removed = local_removed.concat(removeLinkedShapes(list, to_remove[i])); //supprimer les formes liées à chacune des formes supprimées dans la boucle précédente.
			return local_removed;
		};

		var userShapeGroup = { 'exists': false, 'ids': [] };

		var groupLists = [this.systemShapeGroups, this.userShapeGroups];
		for (var g = 0; g < groupLists.length; g++) {
			var groupList = groupLists[g];
			//parcours des groupes d'un certain type:
			for (var i = 0; i < groupList.length; i++) {
				var group = groupList[i];
				//parcours d'un groupe:
				var found = false;
				for (var j = 0; j < group.length; j++) {
					if (group[j] == shape) { //on a trouvé la forme dans le groupe
						found = true;
						group.splice(j, 1); //supprimer cette forme du groupe
						break;
					}
				}
				if (found) {
					var tmp_removed = removeLinkedShapes(group, shape); //supprimer (récursivement) les formes liées à la forme supprimée

					if (g == 1) { //c'est le userShapeGroup:
						userShapeGroup.exists = true;
						for (var j = 0; j < group.length; j++) {
							userShapeGroup.ids.push(group[j].id);
						}
					}

					if (group.length <= 1) {
						groupList.splice(i, 1);
						i--;
					}

					removedShapes = removedShapes.concat(tmp_removed);
				}

			}
		}

		return {
			"shapesInfo": removedShapes,
			"userGroupInfo": userShapeGroup
		};
		*/

	};

	/**
	 * Renvoie la liste des formes solidaires à la forme donnée (c'est-à-dire
	 * faisant partie du même userGroup et/ou du même systemGroup).
	 * @param  {Shape} shape Une forme
	 * @param  {Boolean} [includeReceivedShape=false] true: inclus la forme
	 * 												   reçue dans les résultats
	 * @return {[Shape]}     Les formes liées
	 */
	getAllBindedShapes(shape, includeReceivedShape = false) {
		let shapes = [],
			userGroup = this.getShapeGroup(shape, 'user'),
			systemGroup = this.getShapeGroup(shape, 'system');
		if(userGroup) {
			/*
			Si la forme fait aussi partie d'un systemGroup, toutes les formes
			du systemGroup doivent être dans le userGroup, donc rien d'autre
			à faire.
			 */
			shapes = [...userGroup.shapes];
		} else if(systemGroup) {
			shapes = [...systemGroup.shapes];
		} else {
			shapes = [ shape ];
		}

		if(!includeReceivedShape) {
			shapes = shapes.filter(s => s.id != shape.id);
		}
		return shapes;
	}

	/**
     * Renvoie l'index d'une forme (index dans le tableau de formes du Workspace actuel)
     * @param  {Shape} shape la forme
     * @return {int}       l'index de cette forme dans le tableau des formes
     */
	getShapeIndex(shape) {
		for (let i = 0; i < this.shapes.length; i++) {
			if (this.shapes[i] == shape) {
				return i;
			}
		}
		return null;
	}

	/**
	 * Renvoie la forme ayant un certain id
	 * @param  {int} shapeId l'id de la forme
	 * @return {Shape}         l'objet forme, ou null si la forme n'existe pas
	 */
	getShapeById(shapeId) {
		for (let i = 0; i < this.shapes.length; i++) {
			let s = this.shapes[i];
			if (s.id == shapeId)
				return s;
		}
		return null;
	}

    /**
	 * définir le niveau de zoom général du canvas
	 * @param newZoomLevel: le niveau de zoom, entre 0.1 et 10 (float)
	 */
	setZoomLevel(newZoomLevel, doRefresh) {
		if (newZoomLevel < settings.get('minZoomLevel'))
			newZoomLevel = settings.get('minZoomLevel');
		if (newZoomLevel > settings.get('maxZoomLevel'))
			newZoomLevel = settings.get('maxZoomLevel');

		//app.canvas.updateRelativeScaleLevel(newZoomLevel / this.zoomLevel);

		this.zoomLevel = newZoomLevel; //TODO?
		/*if (doRefresh !== false) {
			app.canvas.refresh();

		}
		app.canvas.refreshBackgroundCanvas();*/
	}

	/**
	 * Ajouter un groupe à l'espace de travail
	 * @param {Group} group         Le groupe
	 * @param {String} [type='user'] Le type de groupe (user ou system)
	 * @param {int}	index			L'index où placer le groupe. Par défaut: à la fin
	 */
	addGroup(group, type = 'user', index = null) {
		let groupList = (type=="user") ? this.userShapeGroups : this.systemShapeGroups;
		if(Number.isFinite(index)) {
			groupList.splice(index, 0, group);
		} else {
			groupList.push(group);
		}
	}

	/**
	 * Récupérer l'index d'un groupe dans le tableau de groupes
	 * @param  {Group} group         Le groupe
	 * @param  {String} [type='user'] Le type de groupe (user ou system)
	 * @return {int}               L'index (peut varier dans le temps!)
	 */
	getGroupIndex(group, type = 'user') {
		let groupList = (type=="user") ? this.userShapeGroups : this.systemShapeGroups;
		for(let i=0; i<groupList.length; i++) {
			if(groupList[i].id == group.id)
				return i;
		}
		return -1;
	}

	/**
	 * Réupérer le groupe d'une forme (soit user, soit system)
	 * @param  {Shape} shape         la forme
	 * @param  {String} [type='user'] user ou system
	 * @return {Group}               le groupe, ou null s'il n'y en a pas.
	 */
	getShapeGroup(shape, type = 'user') {
		let groupList = (type=="user") ? this.userShapeGroups : this.systemShapeGroups;
		for(let i=0; i<groupList.length; i++) {
			if(groupList[i].contains(shape))
				return groupList[i];
		}
		return null;
	}

	/**
	 * Récupérer un groupe à partir de son id
	 * @param  {String} id            L'id du groupe
	 * @param  {String} [type='user'] Le type de groupe (user ou system)
	 * @return {Group}               Le groupe, ou null s'il n'existe pas
	 */
	getGroup(id, type = 'user') {
		let groupList = (type=="user") ? this.userShapeGroups : this.systemShapeGroups;
		for(let i=0; i<groupList.length; i++) {
			if(groupList[i].id == id)
				return groupList[i];
		}
		return null;
	}

	/**
	 * Supprimer un groupe
	 * @param  {Group} group         Le groupe
	 * @param  {String} [type='user'] Le type du groupe (user ou system)
	 */
	deleteGroup(group, type = 'user') {
		let groupList = (type=="user") ? this.userShapeGroups : this.systemShapeGroups;
		for(let i=0; i<groupList.length; i++) {
			if(groupList[i].id == group.id) {
				groupList.splice(i, 1);
				return;
			}
		}
		console.error("Couldn't remove "+type+" group");
		return null;
	}
}
