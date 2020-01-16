import { app } from '../App';
import { State } from './State';
import { Point } from '../Objects/Point';
import { mod, uniqId } from '../Tools/general';

/**
 * Découper une forme
 */
export class CutState extends State {
  constructor() {
    super('cut_shape');

    // listen-canvas-click -> select-second-point -> select-third-point -> showing-points
    //                                            -> showing-points
    this.currentStep = null;

    this.timeoutRef = null;

    this.shape = null;

    this.drawColor = '#E90CC8';

    this.constr = app.interactionAPI.getEmptySelectionConstraints();
  }

  /**
   * initialiser l'état
   */
  start() {
    this.currentStep = 'listen-canvas-click';
    this.setSelConstraints(this.currentStep);

    window.addEventListener('objectSelected', this.handler);
  }

  /**
   * ré-initialiser l'état
   */
  restart() {
    this.end();
    this.setSelConstraints(this.currentStep);

    window.addEventListener('objectSelected', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    window.clearTimeout(this.timeoutRef);
    if (this.status != 'paused' || this.currentStep == 'showing-points')
      this.currentStep = 'listen-canvas-click';

    window.removeEventListener('objectSelected', this.handler);
  }

  _actionHandle(event) {
    if (event.type == 'objectSelected') {
      this.objectSelected(event.detail.object, event.detail.mousePos);
    } else {
      console.log('unsupported event type : ', event.type);
    }
  }

  /**
   * Appelée par l'interactionAPI lorsqu'un point a été sélectionnée (click)
   * @param  {Object} object            L'élément sélectionné
   * @param  {Point} mouseCoordinates Les coordonnées du click
   * @param  {Event} event            l'événement javascript
   */
  objectSelected(object) {
    if (this.currentStep == 'listen-canvas-click') {
      //On a sélectionné le premier point
      this.shape = object.shape;
      this.firstPoint = object;
      this.currentStep = 'select-second-point';
      this.setSelConstraints(this.currentStep);
    } else if (this.currentStep == 'select-second-point') {
      const pt1 = this.firstPoint,
        pt2 = object;
      if (pt2.type == 'center') {
        // On a sélectionné le second point: le centre
        if (!this.isLineValid(pt2.shape, pt1, pt2)) return;
        this.centerPoint = pt2;
        this.currentStep = 'select-third-point';
        this.setSelConstraints(this.currentStep);
      } else if (pt1.equal(pt2, 0.001)) {
        // Désélectionner le premier point
        this.shape = null;
        this.firstPoint = null;
        this.currentStep = 'listen-canvas-click';
        this.setSelConstraints(this.currentStep);
      } else if (this.isLineValid(pt2.shape, pt1, pt2)) {
        // On a sélectionné le second point: un autre point
        this.secondPoint = pt2;
        this.currentStep = 'showing-points';
        window.clearTimeout(this.timeoutRef);
        this.timeoutRef = window.setTimeout(() => {
          this.execute();
        }, 500);
      }
    } else if (this.currentStep == 'select-third-point') {
      const pt1 = this.firstPoint,
        pt2 = object;
      //On a sélectionné le dernier point
      if (pt2.pointType == 'center') {
        // Désélectionner le centre
        this.centerPoint = null;
        this.currentStep = 'select-second-point';
        this.setSelConstraints(this.currentStep);
      } else if (pt1.equal(pt2, 0.001)) {
        // Désélectionner le premier point et le centre
        this.shape = null;
        this.firstPoint = null;
        this.centerPoint = null;
        this.currentStep = 'listen-canvas-click';
        this.setSelConstraints(this.currentStep);
      } else if (this.isLineValid(pt2.shape, this.centerPoint, pt2)) {
        this.secondPoint = pt2;
        this.currentStep = 'showing-points';
        window.clearTimeout(this.timeoutRef);
        this.timeoutRef = window.setTimeout(() => {
          this.execute();
        }, 500);
      }
    }
    window.dispatchEvent(new CustomEvent('refresh'));
    window.dispatchEvent(new CustomEvent('refreshUpper'));
  }

  execute() {
    this.actions = [
      {
        name: 'CutAction',
        shapeId: this.shape.id,
        firstPoint: this.firstPoint,
        secondPoint: this.secondPoint,
        centerPoint: this.centerPoint,
        createdShapesIds: [uniqId(), uniqId()],
      },
    ];
    this.executeAction();
    this.currentStep = 'listen-canvas-click';
    this.restart();

    window.dispatchEvent(new CustomEvent('refresh'));
    window.dispatchEvent(new CustomEvent('refreshUpper'));
  }

  /**
   * Appelée par la fonction de dessin, lorsqu'il faut dessiner l'action en cours
   * @param  {Context2D} ctx              Le canvas
   * @param  {Point} mouseCoordinates Les coordonnées de la souris
   */
  draw(ctx) {
    if (this.currentStep == 'select-second-point') {
      window.dispatchEvent(
        new CustomEvent('draw-point', {
          detail: { point: this.firstPoint, color: this.drawColor, size: 2 },
        }),
      );
    } else if (this.currentStep == 'select-third-point') {
      window.dispatchEvent(
        new CustomEvent('draw-point', {
          detail: { point: this.firstPoint, color: this.drawColor, size: 2 },
        }),
      );
      window.dispatchEvent(
        new CustomEvent('draw-point', {
          detail: { point: this.centerPoint, color: this.drawColor, size: 2 },
        }),
      );
    } else if (this.currentStep == 'showing-points') {
      window.dispatchEvent(
        new CustomEvent('draw-point', {
          detail: { point: this.firstPoint, color: this.drawColor, size: 2 },
        }),
      );
      window.dispatchEvent(
        new CustomEvent('draw-point', {
          detail: { point: this.secondPoint, color: this.drawColor, size: 2 },
        }),
      );
      if (this.centerPoint)
        window.dispatchEvent(
          new CustomEvent('draw-point', {
            detail: { point: this.centerPoint, color: this.drawColor, size: 2 },
          }),
        );
    }
  }

  /**
   * Vérifie si le segment de droite reliant pt1 et pt2 reste bien à
   * l'intérieur de la forme ou non, et qu'il y a au moins un point de ce
   * segment qui n'est pas au bord de la forme.
   * @param  {Shape}  shape
   * @param  {Point}  pt1  coordonnées du point 1
   * @param  {Point}  pt2  coordonnées du point 2
   * @return {Boolean}     Retourne false s'il sort de la forme.
   */
  isLineValid(shape, pt1, pt2) {
    let length = pt1.dist(pt2),
      part = pt2.subCoordinates(pt1).multiplyWithScalar(1 / length),
      precision = 1, //px
      amountOfParts = length / precision,
      pointsInBorder = 0;
    for (let i = 1; i < amountOfParts; i++) {
      let pt = pt1.addCoordinates(part.multiplyWithScalar(i, false));
      if (!shape.isPointInPath(pt)) return false;
      pointsInBorder += shape.isPointInBorder(pt) ? 1 : 0;
    }
    return pointsInBorder <= 40 * precision;
  }

  setSelConstraints(step) {
    this.constr.eventType = 'click';
    this.constr.points.canSelect = true;
    if (step == 'listen-canvas-click') {
      this.constr.points.types = ['vertex', 'segmentPoint'];
      this.constr.points.whitelist = null;
      this.constr.points.blacklist = null;
    } else if (step == 'select-second-point') {
      let object = this.firstPoint,
        shape = object.shape,
        segments = shape.segments;

      this.constr.points.types = ['vertex', 'segmentPoint', 'center'];
      this.constr.points.whitelist = [shape];

      //blacklist
      let vertexToAdd = [],
        segmentsToAdd = [];

      if (!object.segment.arcCenter) segmentsToAdd.push(object.segment.idx);
      if (object.type == 'vertex') {
        const nextSeg = mod(object.segment.idx + 1, segments.length);
        if (!segments[nextSeg].arcCenter) {
          segmentsToAdd.push(nextSeg);
          vertexToAdd.push(nextSeg);
        }
      } else if (!object.segment.arcCenter) vertexToAdd.push(object.segment.idx);
      let list = vertexToAdd.map(vertex => {
        return {
          shape: shape,
          type: 'vertex',
          index: vertex,
        };
      });
      list = list.concat(
        segmentsToAdd
          .map(segIdx => {
            return segments[segIdx].points
              .filter(pt => !pt.equal(object))
              .map(pt => {
                return {
                  shape: shape,
                  type: 'segmentPoint',
                  index: segIdx,
                  coordinates: new Point(pt),
                };
              });
          })
          .flat(),
      );
      this.constr.points.blacklist = list;
    } else if (step == 'select-third-point') {
      this.constr.points.types = ['vertex', 'segmentPoint', 'center'];
      this.constr.points.whitelist = null;
      this.constr.points.blacklist = null;
    }
    app.interactionAPI.setSelectionConstraints(this.constr);
  }
}
