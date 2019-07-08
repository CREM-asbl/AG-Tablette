
/**
 * Groupe de formes liées. Un tel groupe est créé automatiquement
 * lorsque l'utilisateur crée une forme en cliquant sur un point d'une autre
 * forme. Les liens sont unidirectionnels. Une forme est liée à au plus une
 * seule autre forme, mais une forme peut avoir plusieurs formes qui y sont
 * liées.
 *
 * /!\ À ne pas confondre avec les UserShapeGroups, qui sont créés manuellement
 * par l'utilisateur.
 */
export class SystemShapeGroup {
    /**
     * Constructeur
     * @param {Shape} mainShape   la première forme du groupe
     * @param {Shape} linkedShape la seconde forme (liée à la première)
     */
    constructor(mainShape, linkedShape) {
        //La liste des formes contenues dans le groupe
        this.shapes = [ mainShape ];

        //Pour chaque forme, la forme à laquelle celle-ci est liée.
        this.sourceShapeLinks = {};

        //Pour chaque forme, la liste des formes liées à celle-ci.
        this.childrenShapeLinks = {};

        //La forme principale n'est pas liée à une autre forme
        this.sourceShapeLinks[mainShape.id] = null;
        this.childrenShapeLinks[mainShape.id] = [];
        this.addShape(linkedShape, mainShape);
    }

    /**
     * Ajouter une forme au groupe
     * @param {Shape} newShape    La forme que l'on ajoute
     * @param {Shape} sourceShape La forme à laquelle la nouvelle forme est liée
     */
    addShape(newShape, sourceShape) {
        if(this.shapes.includes(newShape)) {
            console.log("This shape is already part of this system group.");
            return;
        }
        this.shapes.push(newShape);
        this.sourceShapeLinks[newShape.id] = sourceShape;
        this.childrenShapeLinks[newShape.id] = [];
        this.childrenShapeLinks[sourceShape.id].push(newShape);
    }
}
