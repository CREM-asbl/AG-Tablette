import { loadManifest } from '../Manifest'
import { app } from '../App'
import { uniqId } from '../Tools/general'

export class Workspace {

	constructor() {
		//Version de l'application dans laquelle ce projet a été créé
		loadManifest().then(manifest => this.appVersion = manifest.version)

		this.id = uniqId();

		//Représente l'historique
		//TODO this.history = new AppHistory(app);

		//liste des formes du projet ([Shape])
		this.shapes = [];

		/**
		 * Groupes. Une forme fait partie de 0 ou 1 'systemGroup', et de 0 ou 1 'userGroup'
		 * Les systemGroup sont créés automatiquement lorsqu'un utilisateur crée une forme en cliquant
		 * sur un point d'une autre forme (ce qui implique que les 2 formes seront liées), ou en utilisant
		 * la fonction diviser en sélectionnant 2 points de 2 formes différentes
		 * Les userGroup sont créés manuellement par l'utilisateur en sélectionnant plusieurs formes.
		 * Si l'une des formes faisant partie d'un systemGroup fait aussi partie d'un userGroup, les autres
		 * formes de ce systemGroup font d'office également partie du même userGroup.
		 * //TODO

         //Groupes de formes qui sont liées par des points
 		this.systemShapeGroups = [];

 		//Groupes de formes qui ont été liées par l'utilisateur après leur création.
 		this.userShapeGroups = [];

		 */

		//niveau de zoom de l'interface
		this.zoomLevel = 1;

		/**
		 * décalage du canvas (translation horizontale et verticale)
		 * un chiffre positif signifie un décalage horizontal vers la droite ou vertical vers le bas.
		 */
		this.translateOffset = { 'x': 0, 'y': 0 };

        this.environment = null;
	}

    setEnvironment(env) {
        this.environment = env;
    }

    /**
	 * ajoute une forme au workspace
	 * @param shape: la forme (Shape)
	 */
	addShape(shape) {
		this.shapes.push(shape);
	}

	/**
	 * Supprime une forme
	 * @param  {Shape} shape La forme à supprimer
	 */
	removeShape(shape) {
		//var removedShapes = [shape]; //pour l'historique
		var shapeIndex = this.getShapeIndex(shape);
		if (shapeIndex == null) {
			console.error("Workspace.removeShape: couldn't remove the shape");
			return;
		}
		//supprime la forme
		this.shapesList.splice(shapeIndex, 1);

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
     * Renvoie l'index d'une forme
     * @param  {Shape} shape la forme
     * @return {int}       l'index de cette forme dans le tableau des formes
     */
	getShapeIndex(shape) {
		var index = -1;
		for (var i = 0; i < this.shapesList.length; i++) {
			if (this.shapesList[i] == shape) {
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
		for (var i = 0; i < this.shapesList.length; i++) {
			var s = this.shapesList[i];
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

		this.zoomLevel = newZoomLevel;
		/*if (doRefresh !== false) {
			app.canvas.refresh();

		}
		app.canvas.refreshBackgroundCanvas();*/
	}
}
