import { app } from '../js/App';
import { State } from '../js/States/State';
import { uniqId } from '../js/Tools/general';
import { ShapeManager } from '../js/ShapeManager';
import { Segment } from '../js/Objects/Segment';

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
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
    let toolName = 'Fusionner';
    return `
            <h2>${toolName}</h2>
            <p>
            	Vous avez sélectionné l'outil <b>"${toolName}"</b>. Cet outil
                permet de fusionner deux formes ayant au moins un côté commun
                en une seule forme. Une nouvelle forme (le fruit de la fusion)
                est créée, et les deux formes d'origine restent intactes.<br />

                Pour fusionner les deux formes, touchez la première forme puis
                la seconde.<br /><br />

                <b>Note:</b> pour qu'une fusion entre deux formes soit possible,
                il faut que les deux formes aient au moins un segment en commun
                (un côté entier, ou une partie d'un côté). Il ne faut pas que
                les deux formes se chevauchent pour que la fusion puisse être
                réalisée.
            </p>
      `;
  }

  /**
   * (ré-)initialiser l'état
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

    let segments = this.involvedShapes.map(s => s.segments.map(seg => seg.copy())).flat();

    for (let i = 0; i < segments.length; i++) {
      let seg = segments[i];
      let commonSegmentIdx = segments.findIndex(
        (segment, idx) =>
          idx != i &&
          seg.subSegments.some(subseg =>
            segment.subSegments.some(subseg2 => subseg.equal(subseg2)),
          ),
      );
      if (commonSegmentIdx == -1) continue;
      let commonSegment = segments[commonSegmentIdx];
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
      segments.splice(indexToRemove[1], 1);
      segments.splice(indexToRemove[0], 1, ...createdSegments);
      i = -1;
    }

    return segments;
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
