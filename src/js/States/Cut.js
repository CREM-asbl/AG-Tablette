import { app } from '../App';
import { CutAction } from './Actions/Cut';
import { State } from './State';
import { Point } from '../Objects/Point';
import { mod } from '../Tools/general';

/**
 * Découper une forme
 */
export class CutState extends State {
  constructor() {
    super('cut_shape');

    // listen-canvas-click -> select-second-point -> select-third-point -> showing-selected-points
    //                                            -> showing-selected-points
    this.currentStep = null;

    this.timeoutRef = null;

    this.shape = null;

    this.constr = null;
  }

  /**
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
      let toolName = "Découper";
      return `
            <h2>${toolName}</h2>
            <p>
            	Vous avez sélectionné l'outil <b>"${toolName}"</b>. Cet outil
                permet de découper une forme en deux nouvelles formes, tout en
                laissant la forme d'origine intacte.<br /><br />

                Pour découper une forme, touchez un premiet sommet de la forme,
                puis éventuellement le centre de la forme (non obligatoire), et
                enfin un second sommet de la forme.<br /><br />

                <b>Note:</b> il n'est pas toujours possible de découper une
                forme en sélectionnant deux sommets quelconques. La ligne de
                découpe doit en effet rester à l'intérieur de la forme, sans
                quoi la découpe ne sera pas réalisée.
            </p>
      `;
  }

  /**
   * (ré-)initialiser l'état
   */
  start() {
    this.actions = [new CutAction(this.name)];
    this.constr = app.interactionAPI.getEmptySelectionConstraints();
    app.appDiv.cursor = 'default';
    this.currentStep = 'listen-canvas-click';
    this.timeoutRef = null;
    this.shape = null;
    this.setSelConstraints(this.currentStep);
  }

  abort() {
    window.clearTimeout(this.timeoutRef);
  }

  /**
   * Appelée par l'interactionAPI lorsqu'un point a été sélectionnée (click)
   * @param  {Object} object            L'élément sélectionné
   * @param  {{x: float, y: float}} clickCoordinates Les coordonnées du click
   * @param  {Event} event            l'événement javascript
   */
  objectSelected(object) {
    if (this.currentStep == 'listen-canvas-click') {
      //On a sélectionné le premier point
      this.shape = object.shape;
      this.actions[0].shapeId = this.shape.id;
      this.actions[0].firstPoint = object;
      this.currentStep = 'select-second-point';
      this.setSelConstraints(this.currentStep);
    } else if (this.currentStep == 'select-second-point') {
      const pt1 = this.actions[0].firstPoint,
        pt2 = object;
      if (pt2.type == 'center') {
        // On a sélectionné le second point: le centre
        if (!this.isLineValid(pt2.shape, pt1, pt2)) return;
        this.actions[0].centerPoint = pt2;
        this.currentStep = 'select-third-point';
        this.setSelConstraints(this.currentStep);
      } else if (pt1.equal(pt2, 0.001)) {
        // Désélectionner le premier point
        this.actions[0].mode = null;
        this.actions[0].shapeId = null;
        this.actions[0].firstPoint = null;
        this.currentStep = 'listen-canvas-click';
        this.setSelConstraints(this.currentStep);
      } else if (this.isLineValid(pt2.shape, pt1, pt2)) {
        // On a sélectionné le second point: un autre point
        this.actions[0].secondPoint = pt2;
        this.currentStep = 'showing-selected-points';
        window.clearTimeout(this.timeoutRef);
        this.timeoutRef = window.setTimeout(() => {
          this.execute();
        }, 500);
      }
    } else if (this.currentStep == 'select-third-point') {
      const pt1 = this.actions[0].firstPoint,
        pt2 = object;
      //On a sélectionné le dernier point
      if (pt2.pointType == 'center') {
        // Désélectionner le centre
        this.actions[0].centerPoint = null;
        this.currentStep = 'select-second-point';
        this.setSelConstraints(this.currentStep);
      } else if (pt1.equal(pt2, 0.001)) {
        // Désélectionner le premier point et le centre
        this.actions[0].mode = null;
        this.actions[0].shapeId = null;
        this.actions[0].firstPoint = null;
        this.actions[0].centerPoint = null;
        this.currentStep = 'listen-canvas-click';
        this.setSelConstraints(this.currentStep);
      } else if (this.isLineValid(pt2.shape, this.actions[0].centerPoint, pt2)) {
        this.actions[0].secondPoint = pt2;
        this.currentStep = 'showing-selected-points';
        window.clearTimeout(this.timeoutRef);
        this.timeoutRef = window.setTimeout(() => {
          this.execute();
        }, 500);
      }
    }
    app.drawAPI.askRefresh();
    app.drawAPI.askRefresh('upper');
  }

  execute() {
    this.executeAction();
    this.start();

    app.drawAPI.askRefresh();
    app.drawAPI.askRefresh('upper');
  }

  /**
   * Appelée par la fonction de dessin, lorsqu'il faut dessiner l'action en cours
   * @param  {Context2D} ctx              Le canvas
   * @param  {{x: float, y: float}} mouseCoordinates Les coordonnées de la souris
   */
  draw(ctx) {
    if (this.currentStep == 'select-second-point') {
      let coords = this.actions[0].firstPoint;
      app.drawAPI.drawPoint(ctx, coords, '#E90CC8', 2);
    }
    if (this.currentStep == 'select-third-point') {
      let coords1 = this.actions[0].firstPoint,
        coords2 = this.actions[0].centerPoint;
      app.drawAPI.drawPoint(ctx, coords1, '#E90CC8', 2);
      app.drawAPI.drawPoint(ctx, coords2, '#E90CC8', 2);
    }
    if (this.currentStep == 'showing-selected-points') {
      let coords1 = this.actions[0].firstPoint,
        coords2 = this.actions[0].secondPoint;
      app.drawAPI.drawPoint(ctx, coords1, '#E90CC8', 2);
      app.drawAPI.drawPoint(ctx, coords2, '#E90CC8', 2);
      if (this.actions[0].centerPoint) {
        let coords3 = this.actions[0].centerPoint;
        app.drawAPI.drawPoint(ctx, coords3, '#E90CC8', 2);
      }
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
      if (!app.drawAPI.isPointInShape(pt, shape)) return false;
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
      let object = this.actions[0].firstPoint,
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
