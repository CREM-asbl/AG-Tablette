import { app } from '../../App'
import { Action } from './Action'
import { Shape } from '../../Objects/Shape'
import { Points } from '../../Tools/points'

export class DivideAction extends Action {
    constructor(name) {
        super(name);

        //L'id de la forme
        this.shapeId = null;

        //Nombre de parties de découpe (numberOfparts-1 points)
        this.numberOfparts = null;

        //Mode de découpe: 'segment' ou 'two_points'
        this.mode = null;

        //Index du segment (dans le tableau des buildSteps), si mode segment
        this.segmentIndex = null;

        /**
         * Premier point (si mode two_points)
         * {
         *     'type': 'point',
         *     'pointType': 'vertex' ou 'segmentPoint',
         *     'shape': Shape,
         *     'segmentIndex': int, //Seulement si pointType = segmentPoint
         *     'index': int, //Seulement si pointType = vertex
         *     'coordinates': Point
         *     'relativeCoordinates': Point
         * }
         */
        this.firstPoint = null;

        /**
         * Second point (si mode two_points)
         * {
         *     'type': 'point',
         *     'pointType': 'vertex' ou 'segmentPoint',
         *     'shape': Shape,
         *     'segmentIndex': int, //Seulement si pointType = segmentPoint
         *     'index': int, //Seulement si pointType = vertex
         *     'coordinates': Point
         *     'relativeCoordinates': Point
         * }
         */
        this.secondPoint = null;

        //Tableau des coordonnées des points créés
        this.createdPoints = null;
    }

    saveToObject() {
        let save = {
            'name': this.name,
            'shapeId': this.shapeId,
            'numberOfparts': this.numberOfparts,
            'mode': this.mode,
            'segmentIndex': this.segmentIndex,
            'firstPoint': this.firstPoint,
            'secondPoint': this.secondPoint,
            'createdPoints': [...this.createdPoints]
        };
        return save;
    }

    initFromObject(save) {
        this.name = save.name;
        this.shapeId = save.shapeId;
        this.numberOfparts = save.numberOfparts;
        this.mode = save.mode;
        this.segmentIndex = save.segmentIndex;
        this.firstPoint = save.firstPoint;
        this.secondPoint = save.secondPoint;
        this.createdPoints = [...save.createdPoints];
    }

    checkDoParameters() {
        if(!this.shapeId || !Number.isFinite(this.numberOfparts))
            return false;
        if(this.mode != 'segment' && this.mode != 'two_points')
            return false;
        if(this.mode == "segment" && !Number.isFinite(this.segmentIndex))
            return false;
        if(this.mode == "two_points" &&
            (!this.firstPoint || !this.secondPoint))
            return false;
        return true;
    }

    checkUndoParameters() {
        if(!this.shapeId)
            return false;
        if(this.mode != 'segment' && this.mode != 'two_points')
            return false;
        if(!this.createdPoints)
            return false;
        return true;
    }


    segmentModeAddArcPoints() {
        this.createdPoints = [];
        let shape = app.workspace.getShapeById(this.shapeId),
            bs = shape.buildSteps,
            segment = shape.buildSteps[this.segmentIndex],
            arcEnds = shape.getArcEnds(this.segmentIndex), //Extrémités de l'arc
            arcLength = shape.getArcLength(this.segmentIndex),
            part = arcLength/this.numberOfparts, //Longueur d'une "partie"
            nbParts = this.numberOfparts;
        //Pour un cercle entier, on ajoute un point de division supplémentaire
        if(arcEnds[0]==1 && arcEnds[1]==bs.length-1)
            nbParts++;

        let bsIndex=arcEnds[0], //index du segment (arc) de départ.
            remainingLenFromPrevArc=0;
        //Un tour de boucle par point ajouté.
        for(let i=1; i<nbParts; i++) {
            let remainingLenUntilNextPoint = part,
                bsLen;
            //Sélectionner le segment (de type arc) sur lequel ajouter le point
            for( ; ; bsIndex=(bsIndex+1)%bs.length) {
                if(bsIndex==0) continue;
                bsLen = Points.dist(bs[bsIndex].coordinates, bs[bsIndex-1].coordinates);
                if(bsLen-remainingLenFromPrevArc > remainingLenUntilNextPoint)
                    break;
                remainingLenUntilNextPoint -= (bsLen-remainingLenFromPrevArc);
                remainingLenFromPrevArc = 0;
            }
            remainingLenFromPrevArc += remainingLenUntilNextPoint;

            //Ajoute le point au segment d'index bsIndex.
            let startCoord = bs[bsIndex-1].coordinates,
                endCoord = bs[bsIndex].coordinates,
                diff = Points.sub(endCoord, startCoord),
                nextPt = {
                    'x': startCoord.x + diff.x * (remainingLenFromPrevArc/bsLen),
                    'y': startCoord.y + diff.y * (remainingLenFromPrevArc/bsLen)
                };

            bs[bsIndex].addPoint(nextPt);
            this.createdPoints.push({
                'segmentIndex': bsIndex,
                'coordinates': Points.copy(nextPt)
            });
        }
    }

    segmentModeAddSegPoints() {
        this.createdPoints = [];
        let shape = app.workspace.getShapeById(this.shapeId),
            segment = shape.buildSteps[this.segmentIndex],
            start = shape.buildSteps[this.segmentIndex-1].coordinates,
            end = segment.coordinates,
            segLength = Points.sub(end, start),
            part = {
                'x': segLength.x / this.numberOfparts,
                'y': segLength.y / this.numberOfparts
            };

        //Un tour de boucle par point ajouté.
        for(let i=1, nextPt=start; i<this.numberOfparts; i++) {
            nextPt = Points.add(nextPt, part);
            segment.addPoint(nextPt);
            this.createdPoints.push({
                'segmentIndex': this.segmentIndex,
                'coordinates': Points.copy(nextPt)
            });
        }
    }

    pointsModeAddArcPoints(pt1, pt2, pt1Index, pt2Index) {
        this.createdPoints = [];
        let shape = app.workspace.getShapeById(this.shapeId),
            bs = shape.buildSteps;

        //Mettre les 2 points dans l'ordre
        if(pt1Index > pt2Index) {
            [pt1, pt2] = [pt2, pt1];
            [pt1Index, pt2Index] = [pt2Index, pt1Index];
        }
        if(pt1Index == pt2Index) {
            let segEnd = bs[pt1Index].coordinates,
                pt1Dist = Points.dist(segEnd, pt1.relativeCoordinates),
                pt2Dist = Points.dist(segEnd, pt2.relativeCoordinates);
            if(pt1Dist < pt2Dist) {
                [pt1, pt2] = [pt2, pt1];
                [pt1Index, pt2Index] = [pt2Index, pt1Index];
            }
        }

        //Calculer la longueur de l'arc
        let startSegmentIndex,
            endSegmentIndex = pt2Index,
            arcLen = 0,
            remainingLenFromPrevArc = 0;
        if(bs[pt1Index].isArc) {
            startSegmentIndex = pt1Index;
            arcLen -= Points.dist(bs[pt1Index-1].coordinates, pt1.relativeCoordinates);
            remainingLenFromPrevArc = -arcLen;
        } else { //vertex
            startSegmentIndex = pt1Index+1 % bs.length;
        }

        if(bs[pt2Index].isArc) {
            arcLen -= Points.dist(bs[pt2Index].coordinates, pt2.relativeCoordinates);
        }

        for(let i=0, curIndex=startSegmentIndex-1; i<bs.length-1;i++) {
            curIndex = (curIndex+1) % bs.length;
            if(curIndex == 0 && bs[curIndex].type=="moveTo") continue;

            arcLen += Points.dist(bs[curIndex].coordinates, bs[curIndex-1].coordinates);
            if(curIndex == endSegmentIndex) break;
        }
        let part = arcLen/this.numberOfparts,
            bsIndex=startSegmentIndex;

        //Un tour de boucle par point ajouté.
        for(let i=1; i<this.numberOfparts; i++) {
            let remainingLenUntilNextPoint = part,
                bsLen;
            //Sélectionner le segment (de type arc) sur lequel ajouter le point
            for( ; ; bsIndex=(bsIndex+1)%bs.length) {
                if(bsIndex==0) continue;
                bsLen = Points.dist(bs[bsIndex].coordinates, bs[bsIndex-1].coordinates);
                if(bsLen-remainingLenFromPrevArc > remainingLenUntilNextPoint)
                    break;
                remainingLenUntilNextPoint -= (bsLen-remainingLenFromPrevArc);
                remainingLenFromPrevArc = 0;
            }
            remainingLenFromPrevArc += remainingLenUntilNextPoint;

            //Ajoute le point au segment d'index bsIndex.
            let startCoord = bs[bsIndex-1].coordinates,
                endCoord = bs[bsIndex].coordinates,
                diff = Points.sub(endCoord, startCoord),
                nextPt = {
                    'x': startCoord.x + diff.x * (remainingLenFromPrevArc/bsLen),
                    'y': startCoord.y + diff.y * (remainingLenFromPrevArc/bsLen)
                };

            bs[bsIndex].addPoint(nextPt);
            this.createdPoints.push({
                'segmentIndex': bsIndex,
                'coordinates': Points.copy(nextPt)
            });
        }
    }

    pointsModeAddSegPoints(pt1, pt2, pt1Index, pt2Index) {
        let shape = app.workspace.getShapeById(this.shapeId),
            bs = shape.buildSteps;

        //mettre le plus petit index en premier, sauf si il y a plus de 2 d'écart
        //entre pt1Index et pt2Index (->signifie qu'on est aux extrémités de
        //buildSteps)
        if((pt1Index > pt2Index && Math.abs(pt1Index-pt2Index)<=2)
            || (pt1Index < pt2Index && Math.abs(pt1Index-pt2Index)>2)) {
            [pt1, pt2] = [pt2, pt1];
            [pt1Index, pt2Index] = [pt2Index, pt1Index];
        }
        if(pt1Index == pt2Index) {
            let segEnd = bs[pt1Index].coordinates,
                pt1Dist = Points.dist(segEnd, pt1.relativeCoordinates),
                pt2Dist = Points.dist(segEnd, pt2.relativeCoordinates);
            if(pt1Dist < pt2Dist) {
                [pt1, pt2] = [pt2, pt1];
                [pt1Index, pt2Index] = [pt2Index, pt1Index];
            }
        }

        this.createdPoints = [];

        let segmentId = pt1.pointType == 'vertex' ? pt1Index+1 : pt1Index,
            segment = shape.buildSteps[segmentId],
            startPos = pt1.relativeCoordinates,
            endPos = pt2.relativeCoordinates,
            diff = Points.sub(endPos, startPos),
            part = {
                'x': diff.x / this.numberOfparts,
                'y': diff.y / this.numberOfparts
            };

        //Un tour de boucle par point ajouté.
        for(let i=1, nextPt=startPos; i<this.numberOfparts; i++) {
            nextPt = Points.add(nextPt, part);
            segment.addPoint(nextPt);
            this.createdPoints.push({
                'segmentIndex': segmentId,
                'coordinates': Points.copy(nextPt)
            });
        }
    }


    do() {
        if(!this.checkDoParameters()) return;

        this.createdPoints = [];
        let shape = app.workspace.getShapeById(this.shapeId);

        if(this.mode=='segment') {
            let segment = shape.buildSteps[this.segmentIndex];
            if(segment.isArc) {
                this.segmentModeAddArcPoints();
            } else {
                this.segmentModeAddSegPoints();
            }
        } else {
            let bs = shape.buildSteps,
                pt1 = this.firstPoint,
                pt2 = this.secondPoint,
                pt1Index = pt1.pointType == 'segmentPoint' ? pt1.segmentIndex : pt1.index,
                pt2Index = pt2.pointType == 'segmentPoint' ? pt2.segmentIndex : pt2.index;

            if(bs[pt1Index].isArc || bs[pt2Index].isArc) {
                this.pointsModeAddArcPoints(pt1, pt2, pt1Index, pt2Index);
            } else {
                this.pointsModeAddSegPoints(pt1, pt2, pt1Index, pt2Index);
            }
        }
    }

    undo() {
        if(!this.checkUndoParameters()) return;
        let shape = app.workspace.getShapeById(this.shapeId),
            bs = shape.buildSteps;

        this.createdPoints.forEach(pt => {
            bs[pt.segmentIndex].removePoint(pt.coordinates);
        });
    }
}
