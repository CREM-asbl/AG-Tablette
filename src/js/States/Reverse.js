import { app } from '../App';
import { State } from './State';
import { Point } from '../Objects/Point';
import { Segment } from '../Objects/Segment';
import { ShapeManager } from '../ShapeManager';

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
    if (this.currentStep == 'selecting-symmetrical-arch') {
      window.dispatchEvent(new CustomEvent('reset-selection-constrains'));
      app.workspace.selectionConstraints.eventType = 'click';
      app.workspace.selectionConstraints.shapes.canSelect = true;
      app.workspace.selectionConstraints.points.blacklist = [this.selectedShape];
      this.mouseClickId = app.addListener('canvasclick', this.handler);
    } else {
      setTimeout(
        () => (app.workspace.selectionConstraints = app.fastSelectionConstraints.click_all_shape),
      );
    }

    this.mouseClickId = app.addListener('canvasclick', this.handler);
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    window.cancelAnimationFrame(this.requestAnimFrameId);
    if (this.status != 'paused') {
      this.currentStep = 'listen-canvas-click';
      this.selectedShape = null;
      app.workspace.editingShapes = [];
    }

    app.removeListener('objectSelected', this.objectSelectedId);
    app.removeListener('canvasclick', this.mouseClickId);
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
   * Appelée par événement du SelectManager quand une forme est sélectionnée (onClick)
   * @param  {Shape} shape            La forme sélectionnée
   * @param  {Point} mouseCoordinates Les coordonnées du click
   */
  objectSelected(shape, mouseCoordinates) {
    if (this.currentStep == 'reversing-shape') return;
    if (
      this.selectedShape &&
      (this.selectedShape.id == shape.id ||
        mouseCoordinates.dist(this.selectedShape.center) < this.symmetricalAxeLength)
    )
      return;

    this.selectedShape = shape;
    this.involvedShapes = ShapeManager.getAllBindedShapes(shape, true);

    window.dispatchEvent(new CustomEvent('reset-selection-constrains'));
    app.workspace.selectionConstraints.eventType = 'click';
    app.workspace.selectionConstraints.shapes.canSelect = true;
    app.workspace.selectionConstraints.points.blacklist = [shape];

    app.removeListener('canvasclick', this.mouseClickId);
    window.setTimeout(() => (this.mouseClickId = app.addListener('canvasclick', this.handler)));
    this.currentStep = 'selecting-symmetrical-arch';
    app.workspace.editingShapes = this.involvedShapes;
    window.dispatchEvent(new CustomEvent('refreshUpper'));
    window.dispatchEvent(new CustomEvent('refresh'));
  }

  /**
   * Appelée lorsque l'événement click est déclanché sur le canvas
   * @param  {Point} mouseCoordinates les coordonnées de la souris
   */
  onClick(mouseCoordinates) {
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
    let shape = ShapeManager.getShapeById(this.shapeId),
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
   * @param  {Point} mouseCoordinates Les coordonnées de la souris
   */
  draw(mouseCoordinates) {
    if (this.currentStep == 'reversing-shape' && this.status == 'running') {
      //TODO: opti: ne pas devoir faire des copies à chaque refresh!
      this.involvedShapes.forEach(s => {
        let s2 = s.copy();
        this.reverseShape(s2, this.axe, this.progress);
        window.dispatchEvent(
          new CustomEvent('draw-shape', { detail: { shape: s2, axeAngle: this.axeAngle } }),
        );
      });

      //Dessiner l'axe:
      window.dispatchEvent(
        new CustomEvent('draw-line', {
          detail: { line: this.axe, color: this.symmetricalAxeColor, doSave: false },
        }),
      );
      return;
    } else if (this.currentStep == 'selecting-symmetrical-arch') {
      this.involvedShapes.forEach(s => {
        window.dispatchEvent(new CustomEvent('draw-shape', { detail: { shape: s } }));
      });

      let axes = [
        this.getSymmetricalAxe('V'),
        this.getSymmetricalAxe('NW'),
        this.getSymmetricalAxe('H'),
        this.getSymmetricalAxe('SW'),
      ];

      axes.forEach(axe => {
        window.dispatchEvent(
          new CustomEvent('draw-line', {
            detail: { line: axe, color: this.symmetricalAxeColor, doSave: false },
          }),
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
