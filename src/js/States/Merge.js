import { app } from '../App';
import { State } from './State';
import { uniqId, getComplementaryColor } from '../Tools/general';
import { ShapeManager } from '../ShapeManager';
import { Segment } from '../Objects/Segment';

/**
 * Fusionner 2 formes en une nouvelle forme
 */
export class MergeState extends State {
  constructor() {
    super('merge', 'Fusionner', 'operation');

    // listen-canvas-click -> selecting-second-shape
    this.currentStep = null;

    this.firstShape = null;

    this.secondShape = null;
  }

  /**
   * initialiser l'état
   */
  start() {
    this.currentStep = 'listen-canvas-click';
    setTimeout(
      () => (app.workspace.selectionConstraints = app.fastSelectionConstraints.click_all_shape),
    );

    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  /**
   * ré-initialiser l'état
   */
  restart() {
    this.end();
    if (this.currentStep == 'selecting-second-shape')
      app.workspace.editingShapes = [this.firstShape];
    setTimeout(
      () => (app.workspace.selectionConstraints = app.fastSelectionConstraints.click_all_shape),
    );

    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    if (this.status != 'paused') {
      this.currentStep = 'listen-canvas-click';
      app.workspace.editingShapes = [];
    }
    app.removeListener('objectSelected', this.objectSelectedId);
  }

  _actionHandle(event) {
    if (event.type == 'objectSelected') {
      this.objectSelected(event.detail.object, event.detail.mousePos);
    } else {
      console.log('unsupported event type : ', event.type);
    }
  }

  /**
   * Appelée par événement du SelectManager lorsqu'une forme a été sélectionnée (onClick)
   * @param  {Shape} shape            La forme sélectionnée
   * @param  {Point} mouseCoordinates Les coordonnées du click
   * @param  {Event} event            l'événement javascript
   */
  objectSelected(shape) {
    if (this.currentStep == 'listen-canvas-click') {
      this.involvedShapes = ShapeManager.getAllBindedShapes(shape, true);
      if (this.involvedShapes.length > 1) {
        let mergeDone = (() => {
          const newSegments = this.checkGroupMerge();
          if (!newSegments) return false;

          const linkedSegments = this.linkNewSegments(newSegments);
          if (!linkedSegments) return false;

          this.actions = [
            {
              name: 'MergeAction',
              mode: 'mulitpleShapes',
              involvedShapesIds: this.involvedShapes.map(s => s.id),
              newSegments: linkedSegments,
              createdShapeId: uniqId(),
            },
          ];

          this.executeAction();
          this.restart();
          window.dispatchEvent(new CustomEvent('refresh'));
          window.dispatchEvent(new CustomEvent('refreshUpper'));
          return true;
        })();
        if (mergeDone) {
          this.restart();
          return;
        }
      }
      this.currentStep = 'selecting-second-shape';
      this.firstShape = shape;
      app.workspace.editingShapes = [shape];
      window.dispatchEvent(new CustomEvent('refresh'));
      window.dispatchEvent(new CustomEvent('refreshUpper'));
      return;
    }
    if (this.currentStep != 'selecting-second-shape') return;
    if (this.firstShape.id == shape.id) {
      this.currentStep = 'listen-canvas-click';
      this.firstShape = null;
      app.workspace.editingShapes = [];
      window.dispatchEvent(new CustomEvent('refresh'));
      window.dispatchEvent(new CustomEvent('refreshUpper'));
      return;
    }
    this.secondShape = shape;

    if (this.firstShape.getCommonsPoints(this.secondShape).length < 2) {
      window.dispatchEvent(
        new CustomEvent('show-notif', { detail: { message: 'Pas de segment commun' } }),
      );
      return;
    }

    if (this.firstShape.overlapsWith(this.secondShape)) {
      window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Superposition' } }));
      return;
    }

    this.actions = [
      {
        name: 'MergeAction',
        mode: 'twoShapes',
        firstShapeId: this.firstShape.id,
        secondShapeId: this.secondShape.id,
        createdShapeId: uniqId(),
      },
    ];

    this.executeAction();
    this.restart();
    window.dispatchEvent(new CustomEvent('refresh'));
    window.dispatchEvent(new CustomEvent('refreshUpper'));
  }

  checkGroupMerge() {
    if (
      this.involvedShapes.some(shape =>
        this.involvedShapes.some(s => {
          if (s.id == shape.id) return false;
          else return s.overlapsWith(shape);
        }),
      )
    )
      return null;

    let oldSegments = this.involvedShapes.map(s => s.segments.map(seg => seg.copy())).flat();

    // TODO replace indexes by real segments

    // console.log(oldSegments.map(seg => seg.vertexes[0].x + ' ' + seg.vertexes[0].y + ' ' + seg.vertexes[1].x + ' ' + seg.vertexes[1].y))

    // delete common segments
    let newSegments = [];
    oldSegments.forEach((seg, i, segments) => {
      if (seg.used) return;
      let indexes = oldSegments
        .map((segment, idx) => {
          if (segment.equal(seg)) {
            return idx;
          }
        })
        .filter(el => el !== undefined);
      if (indexes.length == 1) newSegments.push(seg);
      else indexes.forEach(idx => (segments[idx].used = true));
    });

    // delete segments inside others
    newSegments.forEach(seg => (seg.used = false));
    oldSegments = newSegments;
    newSegments = [];
    oldSegments.forEach((seg, i, segments) => {
      if (seg.used) return;
      let indexes = oldSegments
        .map((segment, idx) => {
          if (idx != i && seg.subSegments.some(subseg => subseg.equal(segment))) {
            return idx;
          }
        })
        .filter(el => el !== undefined);
      if (indexes.length != 0) {
        segments[i].used = true;
        indexes.forEach(idx => (segments[idx].used = true));
        let subsegs = indexes.map(idx => segments[idx]);
        subsegs.forEach(subseg => !subseg.hasSameDirection(seg) && subseg.reverse());
        subsegs.sort((subseg1, subseg2) =>
          subseg1.vertexes[1].dist(seg.vertexes[1]) < subseg2.vertexes[1].dist(seg.vertexes[1])
            ? 1
            : -1,
        );
        let currentSegment = seg;
        subsegs.forEach(subseg => {
          if (!subseg.vertexes[0].equal(currentSegment.vertexes[0]))
            newSegments.push(new Segment(currentSegment.vertexes[0], subseg.vertexes[0]));
          currentSegment = new Segment(subseg.vertexes[1], currentSegment.vertexes[1]);
        });
        if (currentSegment.length > 0.001) newSegments.push(currentSegment);
      }
    });
    oldSegments.forEach(seg => {
      return !seg.used ? newSegments.push(seg) : undefined;
    });

    // resize segments that share subSegments with others
    newSegments.forEach(seg => (seg.used = false));
    oldSegments = newSegments;
    newSegments = [];
    for (let i = 0; i < oldSegments.length; i++) {
      let seg = oldSegments[i];
      let commonSegmentIdx = oldSegments.findIndex(
        (segment, idx) =>
          idx != i &&
          seg.subSegments.some(subseg =>
            segment.subSegments.some(subseg2 => subseg.equal(subseg2)),
          ),
      );
      if (commonSegmentIdx == -1) continue;
      let commonSegment = oldSegments[commonSegmentIdx];
      let junction = seg.subSegments
        .filter(subseg => commonSegment.subSegments.some(subseg2 => subseg.equal(subseg2)))
        .sort((seg1, seg2) => (seg1.length < seg2.length ? 1 : -1))[0];
      !commonSegment.hasSameDirection(seg) && commonSegment.reverse();
      !junction.hasSameDirection(seg) && junction.reverse();
      let createdSegments = [];
      if (!seg.vertexes[0].equal(junction.vertexes[0]))
        createdSegments.push(new Segment(seg.vertexes[0], junction.vertexes[0]));
      if (!seg.vertexes[1].equal(junction.vertexes[1]))
        createdSegments.push(new Segment(seg.vertexes[1], junction.vertexes[1]));
      if (!commonSegment.vertexes[0].equal(junction.vertexes[0]))
        createdSegments.push(new Segment(commonSegment.vertexes[0], junction.vertexes[0]));
      if (!commonSegment.vertexes[1].equal(junction.vertexes[1]))
        createdSegments.push(new Segment(commonSegment.vertexes[1], junction.vertexes[1]));
      let indexToRemove = [i, commonSegmentIdx].sort((idx1, idx2) => idx1 - idx2);
      oldSegments.splice(indexToRemove[1], 1);
      oldSegments.splice(indexToRemove[0], 1, ...createdSegments);
      i = -1;
    }
    newSegments = oldSegments;

    return newSegments;
  }

  linkNewSegments(segmentsList) {
    // Todo : Voir si on ne peut pas la simplifier
    let newSegments = [];

    // segment beeing in use (may be prolongated)
    let currentSegment = segmentsList[0].copy(false);
    // last segment used (not modified)
    let lastSegment = currentSegment;
    let firstSegment = currentSegment;
    let nextSegment;
    let segmentUsed = 0;

    newSegments.push(currentSegment);
    segmentUsed++;

    while (!firstSegment.vertexes[0].equal(currentSegment.vertexes[1])) {
      // while not closed
      const newPotentialSegments = segmentsList.filter(
        seg => !seg.equal(lastSegment) && seg.contains(currentSegment.vertexes[1], false),
      );
      if (newPotentialSegments.length != 1) {
        if (newPotentialSegments.length == 0) console.log('shape cannot be closed (dead end)');
        else console.log('shape is dig (a segment has more than one segment for next)');
        return null;
      }
      nextSegment = newPotentialSegments[0].copy(false);
      if (nextSegment.vertexes[1].equal(currentSegment.vertexes[1])) nextSegment.reverse(true);

      if (currentSegment.hasSameDirection(nextSegment, 1, 0, false)) {
        currentSegment.vertexes[1] = nextSegment.vertexes[1];
      } else {
        newSegments.push(nextSegment);
        currentSegment = nextSegment;
      }
      segmentUsed++;
      lastSegment = nextSegment;
    }
    if (segmentUsed != segmentsList.length) {
      console.log('shape is dig (not all segments have been used)');
      return null;
    }
    if (newSegments.length != 1 && currentSegment.hasSameDirection(firstSegment, 1, 0, false)) {
      newSegments[0].vertexes[0] = newSegments.pop().vertexes[0];
    }
    return newSegments;
  }

  /**
   * Appelée par la fonction de dessin, lorsqu'il faut dessiner l'action en cours
   */
  draw(ctx) {
    if (this.currentStep == 'selecting-second-shape') {
      let shape = this.firstShape,
        borderColor = shape.borderColor;
      shape.borderColor = '#E90CC8';

      window.dispatchEvent(
        new CustomEvent('draw-shape', { detail: { shape: shape, borderSize: 3 } }),
      );
      shape.borderColor = borderColor;
    }
  }
}
