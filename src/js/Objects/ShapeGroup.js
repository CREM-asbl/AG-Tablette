import { uniqId } from '../Tools/general'

/**
 * Groupe de formes liées. Un tel groupe est créé par l'utilisateur à l'aide de
 * l'outil de création de groupes (Grouper/Dégrouper).
 */
export class ShapeGroup {
    /**
     * Constructeur
     * @param {Shape} shape1   La première forme du groupe
     * @param {Shape} shape2   La seconde forme du groupe
     */
    constructor(shape1, shape2) {
        if(shape1 === shape2) {
            throw new Error("Une même forme ne peut pas être ajoutée 2 \
            fois à un groupe");
        }
        //La liste des formes contenues dans le groupe
        this.shapes = [ shape1, shape2 ];

        //Identifiant unique du groupe
        this.id = uniqId();
    }

    saveToObject() {
        let save = {
            'id': this.id,
            'shapes': this.shapes.map(s => s.id)
        };
        return save;
    }

    initFromObject(object) {
        this.id = object.id;
        this.shapes = object.shapes.map(sId => app.workspace.getShapeById(sId));
    }

    /**
     * Ajouter une forme au groupe
     * @param {Shape} shape    La forme que l'on ajoute
     */
    addShape(shape) {
        if(this.contains(shape)) {
            console.error("This shape is already part of this user group.");
            return;
        }
        this.shapes.push(shape);
    }

    /**
     * Retirer une forme du groupe. Ne supprime pas le groupe s'il ne reste
     * qu'une ou zéro formes (cela doit être fait manuellement).
     * @param {Shape} shape    La forme que l'on retire
     */
    deleteShape(shape) {
        for(let i=0; i<this.shapes.length;i++) {
            if(this.shapes[i].id == shape.id) {
                this.shapes.splice(i, 1);
                return;
            }
        }
        console.error("Couldn't delete shape from user group.");
    }

    /**
     * Vérifier si une forme fait partie du groupe
     * @param  {Shape} shape la forme
     * @return {Boolean}       true si elle fait partie du groupe, false sinon
     */
    contains(shape) {
        return this.shapes.findIndex(s => s.id == shape.id) != -1;
    }
}
