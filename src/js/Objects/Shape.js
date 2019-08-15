import { uniqId } from '../Tools/general'
import { Points } from '../Tools/points'
import { collinear } from '../Tools/geometry'
import { Segment, Vertex, MoveTo } from '../Objects/ShapeBuildStep'
import { app } from '../App'

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
     */
    constructor({x, y}, buildSteps, name, familyName) {
        this.id = uniqId();

        this.x = x;
        this.y = y;
        this.buildSteps = buildSteps;
        this.name = name;
        this.familyName = familyName;
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
     * Renvoie true si la forme est un cercle, c'est-à-dire si buildSteps
     * commence par un moveTo puis est uniquement composé de segments de
     * type arc.
     * @return {Boolean} true si cercle, false sinon.
     */
    isCircle() {
        return this.buildSteps.every((bs, index) => {
            if(index==0)
                return bs.type == "moveTo";
            return bs.type == "segment" && bs.isArc;
        });
    }

    getNextBuildstepIndex(bsIndex) {
        if(bsIndex+1==this.buildSteps.length) {
            return 1; //skip 0 (moveTo)
        }
        if(this.buildSteps[bsIndex+1].type == 'moveTo') {
            /*
            Cela signifie que la forme est en fait composée de 2 formes...
             */
            console.error("Cas non prévu!");
            return null;
        }
        return bsIndex+1;
    }

    getPrevBuildstepIndex(bsIndex) {
        if(bsIndex==1) {
            return this.buildSteps.length-1; //skip 0 (moveTo)
        }
        if(this.buildSteps[bsIndex-1].type == 'moveTo') {
            /*
            Cela signifie que la forme est en fait composée de 2 formes...
             */
            console.error("Cas non prévu!");
            return null;
        }
        return bsIndex-1;
    }

    /**
     * Renvoie -1 si il n'y a pas de vertex suivant (->cercle)
     */
    getNextVertexIndex(bsIndex) {
        let nextVertexIndex = -1,
            index = bsIndex+1;

        while(index!=bsIndex) {
            if(index==this.buildSteps.length) {
                index = 1; //skip 0 (moveTo)
                continue;
            }
            if(this.buildSteps[index].type == 'moveTo') {
                /*
                Cela signifie que la forme est en fait composée de 2 formes...
                 */
                console.error("Cas non prévu!");
                return null;
            }
            if(this.buildSteps[index].type == 'vertex') {
                nextVertexIndex = index;
                break;
            }
            index++;
        }
        return nextVertexIndex;
    }

    /**
     * Renvoie -1 si il n'y a pas de vertex précédent (->cercle)
     */
    getPrevVertexIndex(bsIndex) {
        let prevVertexIndex = -1,
            index = bsIndex-1;

        while(index!=bsIndex) {
            if(index<=0) {
                index = this.buildSteps.length-1; //skip 0 (moveTo)
                continue;
            }
            if(this.buildSteps[index].type == 'moveTo') {
                /*
                Cela signifie que la forme est en fait composée de 2 formes...
                 */
                console.error("Cas non prévu!");
                return null;
            }
            if(this.buildSteps[index].type == 'vertex') {
                prevVertexIndex = index;
                break;
            }
            index--;
        }
        return prevVertexIndex;
    }

    /**
     * Renvoie l'index du premier et du dernier segment constituant un arc de
     * cercle.
     * @param  {int} buildStepIndex L'index d'un des segments de l'arc
     * @return {[int, int]}
     */
    getArcEnds(buildStepIndex) {
        let segmentsIds = this.getArcSegmentIndexes(buildStepIndex);
        return [
            segmentsIds[0],
            segmentsIds[ segmentsIds.length-1 ]
        ];
    }

    /**
     * Renvoie la liste des index des segments constituant un arc de cercle.
     * @param  {int} buildStepIndex L'index d'un des segments de l'arc
     * @return {[int]}
     */
    getArcSegmentIndexes(buildStepIndex) {
        let bs = this.buildSteps;
        if(this.isCircle()) {
            let rep = [];
            for(let i=1; i<bs.length; i++)
                rep.push(i);
            return rep;
        }

        const mod = (x, n) => (x % n + n) % n;

        let indexList = [buildStepIndex];

        for(let i=0, curIndex=buildStepIndex; i<bs.length-1;i++) {
            curIndex = mod(curIndex-1, bs.length);

            if(curIndex==0 && bs[curIndex].type=='moveTo')
                continue;

            if(bs[curIndex].type!='segment' || !bs[curIndex].isArc)
                break;

            indexList.unshift(curIndex);
        }

        let lastIndex = buildStepIndex;
        for(let i=0, curIndex=buildStepIndex; i<bs.length-1;i++) {
            curIndex = (curIndex+1)%bs.length;

            if(curIndex==0 && bs[curIndex].type=='moveTo')
                continue;

            if(bs[curIndex].type!='segment' || !bs[curIndex].isArc)
                break;

            indexList.push(curIndex);
        }

        return [firstIndex, lastIndex];
    }

    /**
     * Renvoie la longueur d'un arc de cercle
     * @param  {int} buildStepIndex l'index (dans buildSteps) d'un des segments
     * de l'arc de cercle
     * @return {float}                La longueur de l'arc
     */
    getArcLength(buildStepIndex) {
        let arcEnds = this.getArcEnds(buildStepIndex),
            length = 0;
        for(let i=arcEnds[0]; i!=arcEnds[1]; i = (i+1)%this.buildSteps.length) {
            if(i==0) continue; //moveTo
            length += Points.dist(this.buildSteps[i].coordinates, this.buildSteps[i-1].coordinates);
        }

        return length;
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
     * Vérifie si un point se trouve sur un bord de la forme.
     * @param  {Point}  point Le point (coordonnées absolues)
     * @return {Boolean}       true si le point se trouve sur le bord.
     */
    isPointInBorder(point) {
        return this.buildSteps.some((bs, index) => {
            if(bs.type=="vertex")
                return Points.equal(Points.add(this, bs.coordinates), point);
            if(bs.type=="segment") {
                let pt1 = Points.add(this, this.buildSteps[index-1].coordinates),
                    pt2 = Points.add(this, bs.coordinates),
                    refDist = Points.dist(pt1, pt2),
                    d1 = Points.dist(pt1, point),
                    d2 = Points.dist(pt2, point);
                return collinear(pt1, pt2, point) && d1<refDist && d2<refDist;
            }
            return false;
        });
    }

    /**
     * Vérifie si cette forme se superpose avec une autre forme.
     * @param  {Shape} shape L'autre forme
     * @return {overlap}     true: si les 2 formes se superposent
     */
    overlapsWith(shape) {
        /**
         * TODO pistes d'amélioration:
         * vérifier si une des formes est dans l'autre, ou si au moins un des
         * segment d'une forme croise au moins un segment de l'autre.
         * Problème: pour les algorithmes existants, si 2 segments sont l'un
         * sur l'autre, ils considèrent que les formes se superposent. Pas
         * évident de les adapter vu la situation...
         * ex: algorithme sweep line
         * ->wikipédia: https://en.wikipedia.org/wiki/Sweep_line_algorithm
         * ->explication détaillée: http://www.cs.tufts.edu/comp/163/notes05/seg_intersection_handout.pdf
         */
        let precision = 50; //complexité de precision²

        let s1 = this,
            s2 = shape;

        //Carré le plus petit contenant les 2 formes:
        let minX = s1.x + s1.buildSteps[0].coordinates.x,
            maxX = s1.x + s1.buildSteps[0].coordinates.x,
            minY = s1.y + s1.buildSteps[0].coordinates.y,
            maxY = s1.y + s1.buildSteps[0].coordinates.y;
        [s1, s2].forEach(s => {
            s.buildSteps.forEach(bs => {
                minX = Math.min(minX, s.x + bs.coordinates.x);
                maxX = Math.max(maxX, s.x + bs.coordinates.x);
                minY = Math.min(minY, s.y + bs.coordinates.y);
                maxY = Math.max(maxY, s.y + bs.coordinates.y);
            });
        });
        let partX = (maxX - minX)/precision,
            partY = (maxY - minY)/precision;

        for(let i=minX; i<maxX; i+=partX) {
            for(let j=minY; j<maxY; j+=partY) {
                let pt = Points.create(i, j),
                    inS1 = app.drawAPI.isPointInShape(pt, s1),
                    inS2 = app.drawAPI.isPointInShape(pt, s2);
                if(inS1 && inS2) {
                    let inS1Border = s1.isPointInBorder(pt),
                        inS2Border = s2.isPointInBorder(pt);
                    if(!inS1Border || !inS2Border) return true;
                }
            }
        }
        return false;
    }

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
            this.name, this.familyName);

        copy.color = this.color;
        copy.borderColor = this.borderColor;
        copy.isCenterShown = this.isCenterShown;
        copy.isReversed = this.isReversed;
        copy.opacity = this.opacity;

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

        //TODO: si tri des points des buildSteps, les trier ici (->pour cut et
        //      merge). faire un updateInternalState pour buildStep?
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
            'color': this.color,
            'borderColor': this.borderColor,
            'isCenterShown': this.isCenterShown,
            'isReversed': this.isReversed,
            'opacity': this.opacity,
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

        this.color = save.color;
        this.borderColor = save.borderColor;
        this.isCenterShown = save.isCenterShown;
        this.isReversed = save.isReversed;
        this.opacity = save.opacity;
        this.updateInternalState();
    }
}
