import { uniqId } from '../Tools/general'

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

        //Identifiant unique du groupe
        this.id = uniqId();

        //Pour chaque forme, la forme à laquelle celle-ci est liée.
        this.sourceShapeLinks = {};

        //Pour chaque forme, la liste des formes liées à celle-ci.
        this.childrenShapeLinks = {};


        this.sourceShapeLinks[mainShape.id] = null; //La racine n'a pas de source
        this.childrenShapeLinks[mainShape.id] = [];
        this.addShape(linkedShape, mainShape);
    }

    saveToObject() {
        let save = {
            'id': this.id,
            'shapes': this.shapes.map(s => s.id),
            'sources': {},
            'childs': {}
        };
        for(let sId in this.sourceShapeLinks) {
            if(this.sourceShapeLinks[sId])
                save.sources[sId] = this.sourceShapeLinks[sId].id;
            else
                save.sources[sId] = null;
        }
        for(let sId in this.childrenShapeLinks)
            save.childs[sId] = this.childrenShapeLinks[sId].map(s => s.id);
        return save;
    }

    initFromObject(object) {
        this.id = object.id;
        this.shapes = object.shapes.map(sId => app.workspace.getShapeById(sId));
        for(let sId in object.sources) {
            if(object.sources[sId]) {
                let shape = app.workspace.getShapeById(object.sources[sId]);
                this.sourceShapeLinks[sId] = shape;
            } else {
                this.sourceShapeLinks[sId] = null;
            }

        }
        for(let sId in object.childs) {
            this.childrenShapeLinks[sId] = object.childs[sId].map(id => {
                return app.workspace.getShapeById(id);
            });
        }
    }

    /**
     * Ajouter une forme au groupe
     * @param {Shape} newShape    La forme que l'on ajoute
     * @param {Shape} sourceShape La forme à laquelle la nouvelle forme est liée
     */
    addShape(newShape, sourceShape) {
        if(this.contains(newShape)) {
            console.log("This shape is already part of this system group.");
            return;
        }
        if(!this.contains(sourceShape)) {
            console.log("Source shape is not part of this system group.");
            return;
        }
        this.shapes.push(newShape);
        this.sourceShapeLinks[newShape.id] = sourceShape;
        this.childrenShapeLinks[newShape.id] = [];
        this.childrenShapeLinks[sourceShape.id].push(newShape);
    }

    /**
     * Retire une forme du groupe. La forme doit être une forme feuille (c'est
     * -à-dire qu'aucune forme n'est liée à cette forme). S'il ne reste qu'une (ou zéro)
     * forme, le groupe ne sera pas supprimé.
     * @param  {Shape} shape La forme à retirer
     */
    removeLeafShape(shape) {
        if(!this.contains(shape)) {
            console.log("This shape is not part of this system group.");
            return;
        }
        if(this.childrenShapeLinks[shape.id].length>0) {
            console.log("Shape is not a leaf node!");
            return;
        }

        let index = this.shapes.findIndex(s => s.id == shape.id);
        this.shapes.splice(index, 1);

        delete this.childrenShapeLinks[shape.id];
        let src = this.sourceShapeLinks[shape.id];
        if(src) {
            let srcChildren = this.childrenShapeLinks[src.id],
                srcIndex = srcChildren.findIndex(s => s.id == shape.id);
            srcChildren.splice(srcIndex, 1);
        }
        delete this.sourceShapeLinks[shape.id];
    }

    /**
     * Vérifier si une forme fait partie du groupe
     * @param  {Shape} shape la forme
     * @return {Boolean}       true si elle fait partie du groupe, false sinon
     */
    contains(shape) {
        return this.shapes.findIndex(s => s.id == shape.id) != -1;
    }

    /**
     * Récupérer la liste des formes liées à une forme donnée
     * @param  {Shape} shape La forme
     * @return {[Shape]}     La liste des formes liées
     */
    getShapeChilds(shape) {
        return [...this.childrenShapeLinks[shape.id]];
    }

    /**
     * Récupérer la forme source d'une forme
     * @param  {Shape} shape la forme
     * @return {Shape}       La forme source, ou null (si shape = la racine)
     */
    getSourceShape(shape) {
        return this.sourceShapeLinks[shape.id];
    }
}
