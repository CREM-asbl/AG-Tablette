import { app } from '../../App';
import { Action } from './Action';
import { Point } from '../../Objects/Point';
import { Segment } from '../../Objects/Segment';

export class DivideAction extends Action {
  constructor() {
    super();

    this.name = 'DivideAction';

    //L'id de la forme
    this.shapeId = null;

    //Nombre de parties de découpe (numberOfparts-1 points)
    this.numberOfparts = null;

    //Mode de découpe: 'segment' ou 'two_points'
    this.mode = null;

    //Index du segment (dans le tableau des segments), si mode segment
    this.segmentIndex = null;

    /**
     * Premier point (si mode two_points)
     * {
     *     'type': 'point',
     *     'pointType': 'vertex' ou 'segmentPoint',
     *     'shape': Shape,
     *     'index': int,
     *     'coordinates': Point
     * }
     */
    this.firstPoint = null;

    /**
     * Second point (si mode two_points)
     * {
     *     'type': 'point',
     *     'pointType': 'vertex' ou 'segmentPoint',
     *     'shape': Shape,
     *     'index': int,
     *     'coordinates': Point
     * }
     */
    this.secondPoint = null;

    //Tableau des coordonnées des points créés
    this.createdPoints = null;
  }

  saveToObject() {
    let save = {
      shapeId: this.shapeId,
      numberOfparts: this.numberOfparts,
      mode: this.mode,
      segmentIndex: this.segmentIndex,
      firstPoint: this.firstPoint,
      secondPoint: this.secondPoint,
      createdPoints: [...this.createdPoints],
    };
    return save;
  }

  initFromObject(save) {
    this.shapeId = save.shapeId;
    this.numberOfparts = save.numberOfparts;
    this.mode = save.mode;
    this.segmentIndex = save.segmentIndex;
    this.firstPoint = save.firstPoint;
    this.secondPoint = save.secondPoint;
    this.createdPoints = [...save.createdPoints];
  }

  checkDoParameters() {
    if (!this.shapeId || !Number.isFinite(this.numberOfparts)) return false;
    if (this.mode != 'segment' && this.mode != 'two_points') return false;
    if (this.mode == 'segment' && !Number.isFinite(this.segmentIndex)) return false;
    if (this.mode == 'two_points' && (!this.firstPoint || !this.secondPoint)) return false;
    return true;
  }

  checkUndoParameters() {
    if (!this.shapeId) return false;
    if (this.mode != 'segment' && this.mode != 'two_points') return false;
    if (!this.createdPoints) return false;
    return true;
  }

  do() {
    if (!this.checkDoParameters()) return;

    this.createdPoints = [];
    let shape = app.workspace.getShapeById(this.shapeId);

    if (this.mode == 'segment') {
      let segment = shape.segments[this.segmentIndex];
      if (segment.isArc) {
        this.segmentModeAddArcPoints();
      } else {
        this.segmentModeAddSegPoints();
      }
    } else {
      let segments = shape.segments,
        pt1 = this.firstPoint,
        pt2 = this.secondPoint,
        isArc =
          segments[pt1.segment.idx].isArc ||
          segments[pt2.segment.idx].isArc ||
          (segments[pt1.segment.idx].type == 'vertex' &&
            segments[pt2.segment.idx].type == 'vertex' &&
            !shape.contains(new Segment(segments[pt1.segment.idx], segments[pt2.segment.idx])));

      if (isArc) {
        this.pointsModeAddArcPoints(pt1, pt2, pt1.segment.idx, pt2.segment.idx);
      } else {
        this.pointsModeAddSegPoints(pt1, pt2);
      }
    }
  }

  undo() {
    if (!this.checkUndoParameters()) return;
    let shape = app.workspace.getShapeById(this.shapeId),
      bs = shape.buildSteps;

    this.createdPoints.forEach(pt => {
      bs[pt.index].deletePoint(pt.coordinates);
    });
  }

  segmentModeAddArcPoints() {
    this.createdPoints = [];
    let shape = app.workspace.getShapeById(this.shapeId),
      bs = shape.buildSteps,
      segment = shape.buildSteps[this.segmentIndex],
      arcEnds = shape.getArcEnds(this.segmentIndex), //Extrémités de l'arc
      arcLength = shape.getArcLength(this.segmentIndex),
      part = arcLength / this.numberOfparts, //Longueur d'une "partie"
      nbParts = this.numberOfparts;
    //Pour un cercle entier, on ajoute un point de division supplémentaire
    if (arcEnds[0] == 1 && arcEnds[1] == bs.length - 1) {
      this.createdPoints.push({
        index: 1,
        coordinates: new Point(bs[0].coordinates),
      });
      bs[1].addPoint(new Point(bs[0].coordinates));
    }

    let bsIndex = arcEnds[0], //index du segment (arc) de départ.
      lenToRemoveFromPrevArc = 0;
    //Un tour de boucle par point ajouté.
    for (let i = 1; i < nbParts; i++) {
      let remainingLenUntilNextPoint = part,
        bsLen;
      //Sélectionner le segment (de type arc) sur lequel ajouter le point
      for (; ; bsIndex = (bsIndex + 1) % bs.length) {
        if (bsIndex == 0) continue;
        bsLen = bs[bsIndex].coordinates.dist(bs[bsIndex - 1].coordinates);
        if (bsLen - lenToRemoveFromPrevArc > remainingLenUntilNextPoint) break;
        remainingLenUntilNextPoint -= bsLen - lenToRemoveFromPrevArc;
        lenToRemoveFromPrevArc = 0;
      }
      lenToRemoveFromPrevArc += remainingLenUntilNextPoint;

      //Ajoute le point au segment d'index bsIndex.
      let startCoord = bs[bsIndex - 1].coordinates,
        endCoord = bs[bsIndex].coordinates,
        diff = endCoord.subCoordinates(startCoord),
        nextPt = {
          x: startCoord.x + diff.x * (lenToRemoveFromPrevArc / bsLen),
          y: startCoord.y + diff.y * (lenToRemoveFromPrevArc / bsLen),
        };

      bs[bsIndex].addPoint(nextPt);
      this.createdPoints.push({
        index: bsIndex,
        coordinates: new Point(nextPt),
      });
    }
  }

  segmentModeAddSegPoints() {
    const shape = app.workspace.getShapeById(this.shapeId),
      segment = shape.segments[this.segmentIndex];
    this.pointsModeAddSegPoints(segment.vertexes[0], segment.vertexes[1]);
  }

  pointsModeAddArcPoints(pt1, pt2, pt1Index, pt2Index) {
    this.createdPoints = [];
    let shape = app.workspace.getShapeById(this.shapeId),
      bs = shape.buildSteps;

    [pt1, pt2] = [pt2, pt1];
    [pt1Index, pt2Index] = [pt2Index, pt1Index];

    //Calculer la longueur de l'arc
    let startSegmentIndex,
      endSegmentIndex = pt2Index,
      arcLen = 0,
      lenToRemoveFromPrevArc = 0;
    if (bs[pt1Index].isArc) {
      startSegmentIndex = pt1Index;
      arcLen -= bs[pt1Index - 1].coordinates.dist(pt1.relativeCoordinates);
      lenToRemoveFromPrevArc = -arcLen;
    } else {
      //vertex
      startSegmentIndex = pt1Index + (1 % bs.length);
    }

    if (bs[pt2Index].isArc) {
      arcLen -= bs[pt2Index].coordinates.dist(pt2.relativeCoordinates);
    }

    for (let i = 0, curIndex = startSegmentIndex - 1; i < bs.length - 1; i++) {
      curIndex = (curIndex + 1) % bs.length;
      if (curIndex == 0 && bs[curIndex].type == 'moveTo') continue;

      arcLen += bs[curIndex].coordinates.dist(bs[curIndex - 1].coordinates);
      if (curIndex == endSegmentIndex) break;
    }
    let part = arcLen / this.numberOfparts,
      bsIndex = startSegmentIndex;

    //Un tour de boucle par point ajouté.
    for (let i = 1; i < this.numberOfparts; i++) {
      let remainingLenUntilNextPoint = part,
        bsLen;
      //Sélectionner le segment (de type arc) sur lequel ajouter le point
      for (; ; bsIndex = (bsIndex + 1) % bs.length) {
        if (bsIndex == 0) continue;
        bsLen = bs[bsIndex].coordinates.dist(bs[bsIndex - 1].coordinates);
        if (bsLen - lenToRemoveFromPrevArc > remainingLenUntilNextPoint) break;
        remainingLenUntilNextPoint -= bsLen - lenToRemoveFromPrevArc;
        lenToRemoveFromPrevArc = 0;
      }
      lenToRemoveFromPrevArc += remainingLenUntilNextPoint;

      //Ajoute le point au segment d'index bsIndex.
      let startCoord = bs[bsIndex - 1].coordinates,
        endCoord = bs[bsIndex].coordinates,
        diff = endCoord.subCoordinates(startCoord),
        nextPt = {
          x: startCoord.x + diff.x * (lenToRemoveFromPrevArc / bsLen),
          y: startCoord.y + diff.y * (lenToRemoveFromPrevArc / bsLen),
        };

      bs[bsIndex].addPoint(nextPt);
      this.createdPoints.push({
        index: bsIndex,
        coordinates: new Point(nextPt),
      });
    }
  }

  pointsModeAddSegPoints(pt1, pt2) {
    const shape = app.workspace.getShapeById(this.shapeId),
      segment = pt1.segment,
      segLength = pt2.subCoordinates(pt1),
      part = new Point(segLength.x / this.numberOfparts, segLength.y / this.numberOfparts);

    this.createdPoints = [];
    for (let i = 1, nextPt = new Point(pt1); i < this.numberOfparts; i++) {
      nextPt = nextPt.addCoordinates(part);
      segment.addPoint(nextPt);
      this.createdPoints.push({
        index: segment.id,
        coordinates: new Point(nextPt),
      });
    }
  }
}
