
/**
 * Groupe de formes liées. Un tel groupe est créé par l'utilisateur à l'aide de
 * l'outil de création de groupes (Grouper/Dégrouper).
 */
export class UserShapeGroup {
    /**
     * Constructeur
     * @param {Shape} shape1   La première forme du groupe
     * @param {Shape} shape2   La seconde forme du groupe
     */
    constructor(shape1, shape2) {
        if(shape1 === shape2) {
            throw new Error("Une même forme ne peut pas être ajoutée 2 fois à un groupe");
        }
        //La liste des formes contenues dans le groupe
        this.shapes = [ shape1, shape2 ];
    }

    /**
     * Ajouter une forme au groupe
     * @param {Shape} shape    La forme que l'on ajoute
     */
    addShape(shape) {
        if(this.shapes.includes(shape)) {
            console.error("This shape is already part of this user group.");
            return;
        }
        this.shapes.push(newShape);
    }
}
