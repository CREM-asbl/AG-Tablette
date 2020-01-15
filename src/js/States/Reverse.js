import { app } from '../App';
import { State } from './State';
import { Point } from '../Objects/Point';
import { Segment } from '../Objects/Segment';

/**
 * Retourner une forme (ou un ensemble de formes liées) sur l'espace de travail
 */
export class ReverseState extends State {
  constructor() {
    super('reverse_shape');

    // listen-canvas-click -> selecting-symmetrical-arch -> reversing-shape
    this.currentStep = null;

    //La forme que l'on retourne
    this.selectedShape = null;

    //Timestamp au démarrage de l'animation
    this.startTime = null;

    //Objet représentant l'axe de symétrie utilisée pour le retournement
    this.axe = null;

    //Durée en secondes de l'animation
    this.duration = 2;

    //Couleur des axes de symétrie
    this.symmetricalAxeColor = '#080';

    this.axeAngle = null;

    //Longueur en pixels des 4 arcs de symétrie
    this.symmetricalAxeLength = 200;

    /*
      L'ensemble des formes liées à la forme sélectionnée, y compris la forme
      elle-même
    */
    this.involvedShapes = [];

    this.requestAnimFrameId = null;
  }

  /**
   * initialiser l'état
   */
  start() {
    this.currentStep = 'listen-canvas-click';
    app.interactionAPI.setFastSelectionConstraints('click_all_shape');

    window.addEventListener('objectSelected', this.handler);
  }

  restart() {
    this.end();
    if (this.currentStep == 'selecting-symmetrical-arch') {
      let constr = app.interactionAPI.getEmptySelectionConstraints();
      constr.eventType = 'click';
      constr.shapes.canSelect = true;
      constr.points.blacklist = [this.selectedShape];
      app.interactionAPI.setSelectionConstraints(constr);
      window.addEventListener('canvasclick', this.handler);
    } else {
      app.interactionAPI.setFastSelectionConstraints('click_all_shape');
    }

    window.addEventListener('canvasclick', this.handler);
    window.addEventListener('objectSelected', this.handler);
  }

  end() {
    window.cancelAnimationFrame(this.requestAnimFrameId);
    if (this.status != 'paused') {
      this.currentStep = 'listen-canvas-click';
      this.selectedShape = null;
      app.editingShapes = [];
    }

    window.removeEventListener('objectSelected', this.handler);
    window.removeEventListener('canvasclick', this.handler);
  }

  _actionHandle(event) {
    if (event.type == 'objectSelected') {
      this.objectSelected(event.detail.object, event.detail.mousePos);
    } else if (event.type == 'canvasclick') {
      this.onClick(event.detail.mousePos);
    } else {
      console.log('unsupported event type : ', event.type);
    }
  }

  /**
   * Appelée par interactionAPI quand une forme est sélectionnée (onClick)
   * @param  {Shape} shape            La forme sélectionnée
   * @param  {Point} mouseCoordinates Les coordonnées du click
   * @param  {Event} event            l'événement javascript
   */
  objectSelected(shape, mouseCoordinates, event) {
    if (this.currentStep == 'reversing-shape') return;
    if (this.selectedShape && this.selectedShape.id == shape.id) return;
    if (
      this.selectedShape &&
      mouseCoordinates.dist(this.selectedShape.center) < this.symmetricalAxeLength
    )
      return;

    this.selectedShape = shape;
    this.involvedShapes = app.workspace.getAllBindedShapes(shape, true);

    let constr = app.interactionAPI.getEmptySelectionConstraints();
    constr.eventType = 'click';
    constr.shapes.canSelect = true;
    constr.points.blacklist = [shape];
    app.interactionAPI.setSelectionConstraints(constr);

    window.removeEventListener('canvasclick', this.handler);
    window.addEventListener('canvasclick', this.handler);
    this.currentStep = 'selecting-symmetrical-arch';
    app.editingShapes = this.involvedShapes;
    app.lastKnownMouseCoordinates = mouseCoordinates;
    window.dispatchEvent(new CustomEvent('refreshUpper'));
    window.dispatchEvent(new CustomEvent('refresh'));
  }

  /**
   * Appelée lorsque l'événement click est déclanché sur le canvas
   * @param  {Point} mouseCoordinates les coordonnées de la souris
   * @param  {Event} event     l'événement javascript
   */
  onClick(mouseCoordinates, event) {
    if (this.currentStep != 'selecting-symmetrical-arch') return true;

    let clickDistance = this.selectedShape.center.dist(mouseCoordinates);
    if (clickDistance > this.symmetricalAxeLength / 2) return true; //Le click n'est pas sur les axes de symétrie

    let shapeCenter = this.selectedShape.center,
      angle = shapeCenter.getAngle(mouseCoordinates) % Math.PI;

    let symmetricalAxeOrientation;
    if (angle <= Math.PI / 8 || angle > (7 * Math.PI) / 8) symmetricalAxeOrientation = 'H';
    else if (angle > Math.PI / 8 && angle <= (3 * Math.PI) / 8) symmetricalAxeOrientation = 'NW';
    else if (angle > (3 * Math.PI) / 8 && angle <= (5 * Math.PI) / 8)
      symmetricalAxeOrientation = 'V';
    else symmetricalAxeOrientation = 'SW';

    this.currentStep = 'reversing-shape';
    this.startTime = Date.now();
    this.axe = this.getSymmetricalAxe(symmetricalAxeOrientation);
    this.axeAngle = this.axe.vertexes[0].getAngle(this.axe.vertexes[1]);

    this.involvedShapes.forEach(shape => {
      shape.segments.forEach(seg => {
        if (seg.arcCenter) {
          seg.tangentPoint1 = seg.centerProjectionOnSegment(this.axeAngle);
          seg.tangentPoint2 = seg.centerProjectionOnSegment(this.axeAngle + Math.PI / 2);
        }
      });
    });

    window.dispatchEvent(new CustomEvent('refresh'));
    this.animate();

    return false;
  }

  getSymmetricalAxe(orientation) {
    let shape = app.workspace.getShapeById(this.shapeId),
      center = this.selectedShape.center,
      axe;
    if (orientation == 'V') {
      axe = new Segment(
        new Point(center.x, center.y - this.symmetricalAxeLength / 2),
        new Point(center.x, center.y + this.symmetricalAxeLength / 2),
      );
    } else if (orientation == 'NW') {
      axe = new Segment(
        new Point(
          center.x - (0.683 * this.symmetricalAxeLength) / 2,
          center.y - (0.683 * this.symmetricalAxeLength) / 2,
        ),
        new Point(
          center.x + (0.683 * this.symmetricalAxeLength) / 2,
          center.y + (0.683 * this.symmetricalAxeLength) / 2,
        ),
      );
    } else if (orientation == 'H') {
      axe = new Segment(
        new Point(center.x + this.symmetricalAxeLength / 2, center.y),
        new Point(center.x - this.symmetricalAxeLength / 2, center.y),
      );
    } else {
      // SW
      axe = new Segment(
        new Point(
          center.x + (0.683 * this.symmetricalAxeLength) / 2,
          center.y - (0.683 * this.symmetricalAxeLength) / 2,
        ),
        new Point(
          center.x - (0.683 * this.symmetricalAxeLength) / 2,
          center.y + (0.683 * this.symmetricalAxeLength) / 2,
        ),
      );
    }
    return axe;
  }

  /**
   * Gère l'animation du retournement.
   */
  animate() {
    this.progress = (Date.now() - this.startTime) / (this.duration * 1000);
    if (this.progress > 1 && app.state == 'reverse_shape') {
      this.actions = [
        {
          name: 'ReverseAction',
          shapeId: this.selectedShape.id,
          involvedShapesIds: this.involvedShapes.map(s => s.id),
          axe: this.axe,
        },
      ];
      this.executeAction();
      this.restart();
      window.dispatchEvent(new CustomEvent('refreshUpper'));
      window.dispatchEvent(new CustomEvent('refresh'));
    } else {
      window.dispatchEvent(new CustomEvent('refreshUpper'));
      this.requestAnimFrameId = window.requestAnimationFrame(() => this.animate());
    }
  }

  /**
   * Appelée par la fonction de dessin, lorsqu'il faut dessiner l'action en cours
   * @param  {Context2D} ctx              Le canvas
   * @param  {Point} mouseCoordinates Les coordonnées de la souris
   */
  draw(ctx, mouseCoordinates) {
    if (this.currentStep == 'reversing-shape' && this.status == 'running') {
      //TODO: opti: ne pas devoir faire des copies à chaque refresh!
      this.involvedShapes.forEach(s => {
        let s2 = s.copy();
        this.reverseShape(s2, this.axe, this.progress);
        app.drawAPI.drawShape(ctx, s2, 1, this.axeAngle);
      });

      //Dessiner l'axe:
      app.drawAPI.drawLine(
        ctx,
        this.axe.vertexes[0],
        this.axe.vertexes[1],
        this.symmetricalAxeColor,
        1,
        false,
      );
      return;
    } else if (this.currentStep == 'selecting-symmetrical-arch') {
      this.involvedShapes.forEach(s => {
        app.drawAPI.drawShape(ctx, s);
      });

      let axes = [
        this.getSymmetricalAxe('V'),
        this.getSymmetricalAxe('NW'),
        this.getSymmetricalAxe('H'),
        this.getSymmetricalAxe('SW'),
      ];

      axes.forEach(axe => {
        app.drawAPI.drawLine(
          ctx,
          axe.vertexes[0],
          axe.vertexes[1],
          this.symmetricalAxeColor,
          1,
          false,
        );
      });
    }
  }

  /**
   * Retourne une forme
   * @param  {Shape} shape       la forme à retourner
   * @param  {Object} axe        L'axe de symétrie à utiliser
   */
  reverseShape(shape, axe) {
    if (this.progress > 0.5) {
      // milieu animation
      shape.isReversed = !shape.isReversed;
      shape.reverse();
    }

    shape.segments.forEach(seg => {
      let points = [
        ...seg.vertexes,
        ...seg.points,
        seg.arcCenter,
        seg.tangentPoint1,
        seg.tangentPoint2,
      ];
      points.forEach(pt => {
        if (pt) this.computePointPosition(pt, axe);
      });
    });
  }

  /**
   * Calcule les nouvelles coordonnées d'un point lors de l'animation d'une symétrie axiale
   * @param  {Point} point    le point
   * @param  {Object} axe      L'axe de symétrie
   * @return {Point}          Nouvelles coordonnées
   */
  computePointPosition(point, axe) {
    let center = axe.projectionOnSegment(point);

    //Calculer la nouvelle position du point à partir de l'ancienne et de la projection.
    point.setCoordinates({
      x: point.x + 2 * (center.x - point.x) * this.progress,
      y: point.y + 2 * (center.y - point.y) * this.progress,
    });
  }
}
