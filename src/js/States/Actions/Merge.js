import { app } from '../../App'
import { Action } from './Action'
import { Shape } from '../../Objects/Shape'
import { Points } from '../../Tools/points'
import { getAverageColor } from '../../Tools/general'
import { Segment, Vertex, MoveTo } from '../../Objects/ShapeBuildStep'

export class MergeAction extends Action {
    constructor() {
        super();

        //Première forme
        this.firstShapeId = null;

        //Seconde forme
        this.secondShapeId = null;

        //Id de la forme résultant de la fusion
        this.createdShapeId = null;
    }

    saveToObject() {
        let save = {

            'firstShapeId': this.firstShapeId,
            'secondShapeId': this.secondShapeId
        };
        return save;
    }

    initFromObject(save) {

        this.firstShapeId = save.firstShapeId;
        this.secondShapeId = save.secondShapeId;
    }

    checkDoParameters() {
        if(!this.firstShapeId || !this.secondShapeId)
            return false;
        return true;
    }

    checkUndoParameters() {
        if(!this.createdShapeId)
            return false;
        return true;
    }

    //Si renvoie false, annulera l'ajout à l'historique
    do() {
        if(!this.checkDoParameters()) return;

        let shape1 = app.workspace.getShapeById(this.firstShapeId),
            shape2 = app.workspace.getShapeById(this.secondShapeId),
            commonSegments = this.getCommonSegments(shape1, shape2);

        if(commonSegments.length==0)
            return false;

        //Calculer la liste des morceaux de formes (parts: liste de tableaux
        //de buildSteps)
        let toDeleteInShape1 = commonSegments.filter(x => x.shape==1),
            toDeleteInShape2 = commonSegments.filter(x => x.shape==2),
            parts = [],
            mainRefPoint = Points.copy(shape1);
        toDeleteInShape1.sort((a, b) => a.start - b.start);
        toDeleteInShape2.sort((a, b) => a.start - b.start);

        let travelShape = (shape, toDelete) => {
            let bs = [...shape.buildSteps],
                bsIndex = 0,
                offset = Points.sub(shape, mainRefPoint),
                addPart = (part) => {
                    part = part.map(bs => {
                        bs = bs.copy();
                        bs.coordinates = Points.add(bs.coordinates, offset);
                        if(bs.type=='segment') {
                            bs.points = [];
                        }
                        return bs;
                    });
                    //Last buildStep should be a vertex
                    if(part[part.length-1].type!="vertex") {
                        part.push(new Vertex(part[part.length-1].coordinates));
                    }
                    parts.push(part);
                },
                deleteMovetoAndAdd = (part) => {
                    let index;
                    while((index = part.findIndex(p => p.type=="moveTo"))!=-1) {
                        let newpart = part.splice(0, index);
                        part.shift();
                        if(!newpart.every(p => p.type!='segment'))
                            addPart(newpart); //Contient au moins un segment
                    }
                    if(!part.every(p => p.type!='segment'))
                        addPart(part); //Contient au moins un segment
                };
            let firstStep = true;
            toDelete.forEach(line => {
                let start = line.start,
                    end = line.end,
                    part = bs.slice(bsIndex, end), //slice to end-1!
                    nextIndex = end+1;
                if(line.type=='partial') {
                    if(line.pt1 != 'start') {
                        let add1 = new Segment(line.pt1),
                            add2 = new Vertex(line.pt1);
                        part.push(add1, add2);
                    }
                    if(line.pt2 != 'end') {
                        let add1 = new Vertex(line.pt2),
                            add2 = new Segment(bs[end].coordinates);
                        bs.splice(end-1, 2, add1, add2);
                        nextIndex = end-1;
                    }
                }
                deleteMovetoAndAdd(part);
                bsIndex = nextIndex;
                firstStep = false;
            });
            let part = bs.slice(bsIndex, bs.length);
            deleteMovetoAndAdd(part);
        };

        travelShape(shape1, toDeleteInShape1);
        travelShape(shape2, toDeleteInShape2);

        //Construire la nouvelle liste buildSteps
        let reversePart = (part) => {
            let reversed = [...part].reverse(),
                newPart = [];
            for(let i=0; i<part.length-1; i++) {
                let bs = reversed[i].copy();
                bs.coordinates = Points.copy(reversed[i+1].coordinates);
                newPart.push(bs);
            }
            newPart.push(reversed[ part.length-1 ].copy());
            return newPart;
        };
        let changed = true;
        while(changed) {
            changed = false;
            /*
            parts: liste de listes de buildSteps. Chaque liste de buildSteps
            commence et termine par un Vertex, et contient des Segments (arcs ou
            non) et d'autres Vertex.
             */
            for(let i=0; i<parts.length; i++) {
                for(let j=i+1; j<parts.length && i<parts.length; j++) {
                    let p1LastCoord = parts[i][ parts[i].length-1 ].coordinates,
                        p1FirstCoord = parts[i][ 0 ].coordinates,
                        p2LastCoord = parts[j][ parts[j].length-1 ].coordinates,
                        p2FirstCoord = parts[j][ 0 ].coordinates;
                    if(Points.equal(p1LastCoord, p2FirstCoord)) {
                        parts[j].shift();
                        parts[i] = parts[i].concat(parts[j]);
                        parts.splice(j, 1);
                        j--;
                        changed = true;
                    } else if(Points.equal(p1LastCoord, p2LastCoord)) {
                        parts[i].pop();
                        parts[i] = parts[i].concat(reversePart(parts[j]));
                        parts.splice(j, 1);
                        j--;
                        changed = true;
                    } else if(Points.equal(p1FirstCoord, p2LastCoord)) {
                        let reversed = reversePart(parts[i]);
                        reversed.pop();
                        parts[i] = reversed.concat(reversePart(parts[j]));
                        parts.splice(j, 1);
                        j--;
                        changed = true;
                    } else if(Points.equal(p1FirstCoord, p2FirstCoord)) {
                        parts[j].shift();
                        parts[i] = reversePart(parts[i]).concat(parts[j]);
                        parts.splice(j, 1);
                        j--;
                        changed = true;
                    }
                }
            }
        }

        let buildSteps;
        if(parts.length>1) {
            /*
            Ne marche pas actuellement; drawAPI considère qu'il y a 2 formes l'une
            dans l'autre, et pas qu'il ne faut pas colorier la zone.
            let buildSteps;
            if(parts.length>1) {
                buildSteps = parts.map(part => {
                    //retire le sommet à la fin
                    part.pop();
                    //Ajoute un moveTo au début
                    part.unshift(new MoveTo(part[0].coordinates));
                    return part;
                }).reduce((total, val) => {
                    return total.concat(val);
                }, []);
            }
            */

            //Forme creuse...
            alert("Les formes creuses ne sont pas supportées actuellement");
            return false;
        } else {
            buildSteps = parts[0];
            buildSteps.pop(); //retire le sommet à la fin
            buildSteps.unshift(new MoveTo(buildSteps[0].coordinates));
        }

        //Créer la forme
        let newShape = shape1.copy();
        if(this.createdShapeId)
            newShape.id = this.createdShapeId;
        else
            this.createdShapeId = newShape.id;
        newShape.name = "Custom";
        newShape.familyName = "Custom";
        newShape.color = getAverageColor(shape1.color, shape2.color);
        newShape.borderColor = getAverageColor(shape1.borderColor, shape2.borderColor);
        newShape.isCenterShown = false;
        newShape.opacity = (shape1.opacity + shape2.opacity)/2;
        newShape.buildSteps = buildSteps;
        newShape.updateInternalState();
        newShape.setCoordinates(Points.sub(newShape, Points.create(20, 20)));

        app.workspace.addShape(newShape);

        return;
    }

    undo() {
        if(!this.checkUndoParameters()) return;

        let shape = app.workspace.getShapeById(this.createdShapeId);
        app.workspace.deleteShape(shape);
    }

    getCommonSegments(shape1, shape2) {
        let commonSegments = [];
        shape1.buildSteps.forEach((bs1, index1) => {
            if(bs1.type!="segment" || bs1.isArc) return;
            let bs1StartRelative = shape1.buildSteps[index1-1].coordinates,
                bs1EndRelative = bs1.coordinates,
                bs1Start = Points.add(shape1, bs1StartRelative),
                bs1End = Points.add(shape1, bs1EndRelative),
                s1Points = [
                    { 'x': bs1StartRelative.x, 'y': bs1StartRelative.y, 'start': true },
                    { 'x': bs1EndRelative.x, 'y': bs1EndRelative.y, 'end': true }
                ].concat(bs1.points);

            let fullFound = null,
                partialFound = null;
            shape2.buildSteps.forEach((bs2, index2) => {
                if(bs2.type!="segment" || bs2.isArc) return;
                let bs2StartRelative = shape2.buildSteps[index2-1].coordinates,
                    bs2EndRelative = bs2.coordinates,
                    bs2Start = Points.add(shape2, bs2StartRelative),
                    bs2End = Points.add(shape2, bs2EndRelative),
                    s2Points = [
                        { 'x': bs2StartRelative.x, 'y': bs2StartRelative.y, 'start': true },
                        { 'x': bs2EndRelative.x, 'y': bs2EndRelative.y, 'end': true }
                    ].concat(bs2.points);

                //Segment entier commun ?
                if(Points.equal(bs1Start, bs2Start) && Points.equal(bs1End, bs2End)
                    || Points.equal(bs1Start, bs2End) && Points.equal(bs1End, bs2Start)) {
                    fullFound = [];
                    fullFound.push({
                        'shape': 1,
                        'start': index1-1,
                        'end': index1,
                        'type': 'fullSegment'
                    });
                    fullFound.push({
                        'shape': 2,
                        'start': index2-1,
                        'end': index2,
                        'type': 'fullSegment'
                    });
                    return;
                }

                //Vérifier si partie de segment en commun.
                let commonPointsIndexes = [];
                s1Points.forEach((pt1, i1) => {
                    let abs1 = Points.add(shape1, pt1);
                    s2Points.forEach((pt2, i2) => {
                        let abs2 = Points.add(shape2, pt2);
                        if(Points.equal(abs1, abs2))
                            commonPointsIndexes.push([i1, i2]);
                    });
                });
                if(commonPointsIndexes.length<2)
                    return; //il n'y a pas au moins 2 points communs

                //Trouver les 2 points communs les plus éloignés
                let best = {
                    'pt1Indexes': null,
                    'pt2Indexes': null,
                    'dist': -1
                };
                for(let i=0; i<commonPointsIndexes.length; i++) {
                    for(let j=i+1; j<commonPointsIndexes.length; j++) {
                        let pt1 = s1Points[ commonPointsIndexes[i][0] ],
                            pt2 = s1Points[ commonPointsIndexes[j][0] ],
                            dist = Points.dist(pt1, pt2);
                        if(dist > best.dist) {
                            best.dist = dist;
                            best.pt1Indexes = commonPointsIndexes[ i ];
                            best.pt2Indexes = commonPointsIndexes[ j ];
                        }
                    }
                }

                let s1p1 = s1Points[ best.pt1Indexes[0] ],
                    s1p2 = s1Points[ best.pt2Indexes[0] ],
                    s2p1 = s2Points[ best.pt1Indexes[1] ],
                    s2p2 = s2Points[ best.pt2Indexes[1] ];

                //Trier les 2 points pour chaque forme: le plus proche de start
                //en premier.
                if(Points.dist(s1p1, bs1StartRelative) > Points.dist(s1p2, bs1StartRelative)) {
                    [s1p1, s1p2] = [s1p2, s1p1];
                }
                if(Points.dist(s2p1, bs2StartRelative) > Points.dist(s2p2, bs2StartRelative)) {
                    [s2p1, s2p2] = [s2p2, s2p1];
                }

                //ajouter à la liste des segments communs
                partialFound = [];
                partialFound.push({
                    'shape': 1,
                    'start': index1-1,
                    'end': index1,
                    'type': 'partial',
                    'pt1': s1p1.start ? 'start' : s1p1,
                    'pt2': s1p2.end ? 'end' : s1p2
                });
                partialFound.push({
                    'shape': 2,
                    'start': index2-1,
                    'end': index2,
                    'type': 'partial',
                    'pt1': s2p1.start ? 'start' : s2p1,
                    'pt2': s2p2.end ? 'end' : s2p2
                });
            });
            if(fullFound) {
                commonSegments.push(...fullFound);
            } else if(partialFound) {
                commonSegments.push(...partialFound);
            }
        });
        return commonSegments;
    }
}
