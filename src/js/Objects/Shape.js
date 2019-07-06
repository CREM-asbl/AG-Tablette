import { uniqId } from '../Tools/general'

/**
 * Représente une forme
 */
export class Shape {

    /**
     * Constructeur
     * @param {float} x          position X
     * @param {float} y          position Y
     * @param {[ShapeBuildStep]} buildSteps étapes de construction de la forme (Segment, Vertex, MoveTo)
     * @param {String} name       nom de la forme
     * @param {String} familyName     nom de la famille de la forme
     * @param {Coordinates} refPoint    point de référence pour le dessin de la forme
     */
    constructor({x, y}, buildSteps, name, familyName, refPoint) {
        this.id = uniqId();

        this.x = x;
        this.y = y;
        this.buildSteps = buildSteps;
        this.name = name;
        this.familyName = familyName;
        this.refPoint = refPoint;

        this.color = "#aaa";
        this.borderColor = "#000";

        this.path = null;
        this.updateInternalState();
    }

    /**
     * Renvoie une copie d'une forme
     * @return {Shape} la copie
     */
    copy() {
        let buildStepsCopy = this.buildSteps.map(bs => bs.copy());
        let copy = new Shape(
            {x: this.x, y: this.y}, buildStepsCopy,
            this.name, this.familyName,
            {x: this.refPoint.x, y: this.refPoint.y});

        copy.color = this.color;
        copy.borderColor = this.borderColor;

        return copy;
    }

    /**
     * À appeler si buildSteps a été modifié.
     * @return {[type]} [description]
     */
    updateInternalState() {
        const path = new Path2D();
        this.buildSteps.forEach(buildStep => {
            if(buildStep.type=="moveTo")
                path.moveTo(buildStep.coordinates.x, buildStep.coordinates.y);
            else if(buildStep.type=="segment")
                path.lineTo(buildStep.coordinates.x, buildStep.coordinates.y);
        });
		path.closePath();
        this.path = path;
    }

    getPath() {
        return this.path;
	}
}
