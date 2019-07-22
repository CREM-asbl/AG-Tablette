import { uniqId } from '../Tools/general'
import { Segment, Vertex, MoveTo } from '../Objects/ShapeBuildStep'

//TODO: supprimer refPoint (-> sera toujours 0,0)

/**
 * Représente une forme
 */
export class Shape {

    /**
     * Constructeur
     * @param {float} x          position X
     * @param {float} y          position Y
     * @param {[ShapeBuildStep]} buildSteps étapes de construction de la forme
     *                                          (Segment, Vertex, MoveTo)
     * @param {String} name       nom de la forme
     * @param {String} familyName     nom de la famille de la forme
     * @param {Coordinates} refPoint    point de référence pour le dessin
     */
    constructor({x, y}, buildSteps, name, familyName, refPoint) {
        this.id = uniqId();

        this.x = x;
        this.y = y;
        this.buildSteps = buildSteps;
        this.name = name;
        this.familyName = familyName;
        this.refPoint = refPoint;
        this.center = null;

        this.color = "#aaa";
        this.borderColor = "#000";
        this.opacity = 1;
        this.isCenterShown = false;
        this.isReversed = false;

        this.path = null;
        this.updateInternalState();
    }

    /**
     * Renvoie les coordonnées absolues du centre de la forme
     * @return {Point} coordonnées
     */
    getAbsoluteCenter() {
        return {
            'x': this.x + this.center.x,
            'y': this.y + this.center.y
        };
    }

	/**
     * Récupère les coordonnées de la forme
     * @return {{x: float, y: float}} les coordonnées ({x: float, y: float})
     */
	getCoordinates() {
		return { "x": this.x, "y": this.y };
	};

	/**
     * défini les coordonnées de la forme
     * @param {{x: float, y: float}} coordinates les coordonnées
     */
	setCoordinates(coordinates) {
		this.x = coordinates.x;
		this.y = coordinates.y;
	};

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
        copy.isCenterShown = this.isCenterShown;
        copy.isReversed = this.isReversed;

        return copy;
    }

    /**
     * À appeler si buildSteps a été modifié. Calcule le draw path et le centre
     */
    updateInternalState() {
        if(this.buildSteps.length==0) return; //La forme n'a pas été initialisée.
        //Compute center
        let total = {
            'sumX': 0,
            'sumY': 0,
            'amount': 0
        };
        this.buildSteps.forEach(bs => {
            //TODO: vérifier si cela fonctionne pour des formes contenant un arc de cercle.
            if(bs.type=="vertex" || (bs.type=="segment" && bs.isArc)) {
                total.sumX += bs.coordinates.x;
                total.sumY += bs.coordinates.y;
                total.amount++;
            }
        });
        this.center = {
            'x': total.sumX/total.amount,
            'y': total.sumY/total.amount
        };

        //Compute draw path
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

    /**
     * Renvoie un objet Path2D permettant de dessiner la forme.
     * @return {Path2D} le path de dessin de la forme
     */
    getDrawPath() {
        return this.path;
	}

    saveToObject() {
        let save = {
            'id': this.id,
            'coordinates': this.getCoordinates(),
            'name': this.name,
            'familyName': this.familyName,
            'refPoint': this.refPoint,
            'color': this.color,
            'borderColor': this.borderColor,
            'isCenterShown': this.isCenterShown,
            'isReversed': this.isReversed,
            'buildSteps': this.buildSteps.map(bs => bs.saveToObject())
        };
        return save;
    }

    initFromObject(save) {
        this.buildSteps = save.buildSteps.map(bsData => {
            if(bsData.type=='vertex')
                return new Vertex(bsData.coordinates);
            else if(bsData.type=='moveTo')
                return new MoveTo(bsData.coordinates);
            else {
                let segment = new Segment(bsData.coordinates, bsData.isArc);
                bsData.points.forEach(pt => segment.addPoint(pt));
                return segment;
            }
        });
        this.id = save.id;
        this.x = save.coordinates.x;
        this.y = save.coordinates.y;
        this.name = save.name;
        this.familyName = save.familyName;
        this.refPoint = save.refPoint;

        this.color = save.color;
        this.borderColor = save.borderColor;
        this.isCenterShown = save.isCenterShown;
        this.isReversed = save.isReversed;
        this.updateInternalState();
    }
}
