import { app } from '../App';
import { ReverseAction } from './Actions/Reverse';
import { State } from './State';
import { Point } from '../Objects/Point';

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

    /*
        L'ensemble des formes liées à la forme sélectionnée, y compris la forme
        elle-même
         */
    this.involvedShapes = [];

    this.timeoutRef = null;
  }

  /**
   * (ré-)initialiser l'état
   */
  start() {
    this.actions = [new ReverseAction(this.name)];
    this.currentStep = 'listen-canvas-click';

    this.selectedShape = null;
    this.startTime = null;
    this.axe = null;
    this.involvedShapes = [];
    this.timeoutRef = null;

    app.interactionAPI.setFastSelectionConstraints('click_all_shape');
    app.appDiv.cursor = 'default';
  }

  abort() {
    clearTimeout(this.timeoutRef);
    this.start();
  }

  /**
   * Appelée par interactionAPI quand une forme est sélectionnée (onClick)
   * @param  {Shape} shape            La forme sélectionnée
   * @param  {{x: float, y: float}} clickCoordinates Les coordonnées du click
   * @param  {Event} event            l'événement javascript
   */
  objectSelected(shape, clickCoordinates, event) {
    if (this.currentStep == 'reversing-shape') return;

    this.selectedShape = shape;
    this.involvedShapes = app.workspace.getAllBindedShapes(shape, true);

    this.actions[0].shapeId = shape.id;
    this.actions[0].involvedShapesIds = this.involvedShapes.map(s => s.id);

    let constr = app.interactionAPI.getEmptySelectionConstraints();
    constr.eventType = 'click';
    constr.shapes.canSelect = true;
    constr.points.blacklist = [shape];
    app.interactionAPI.setSelectionConstraints(constr);

    this.currentStep = 'selecting-symmetrical-arch';
    app.drawAPI.askRefresh('upper');
    app.drawAPI.askRefresh();
  }

  /**
   * Appelée lorsque l'événement click est déclanché sur le canvas
   * @param  {{x: float, y: float}} mouseCoordinates les coordonnées de la souris
   * @param  {Event} event     l'événement javascript
   * @return {Boolean}         false: désactive l'appel à objectSelected pour cet événement.
   */
  onClick(mouseCoordinates, event) {
    if (this.currentStep != 'selecting-symmetrical-arch') return true;

    let clickDistance = this.selectedShape.center.dist(mouseCoordinates);
    if (clickDistance > this.symmetricalAxeLength / 2) return true; //Le click n'est pas sur les axes de symétrie

    let shapeCenter = this.selectedShape.center,
      angle = shapeCenter.getAngle(mouseCoordinates) % Math.PI;

    if (angle <= Math.PI / 8 || angle > (7 * Math.PI) / 8)
      this.actions[0].symmetricalAxeOrientation = 'H';
    else if (angle > Math.PI / 8 && angle <= (3 * Math.PI) / 8)
      this.actions[0].symmetricalAxeOrientation = 'NW';
    else if (angle > (3 * Math.PI) / 8 && angle <= (5 * Math.PI) / 8)
      this.actions[0].symmetricalAxeOrientation = 'V';
    else this.actions[0].symmetricalAxeOrientation = 'SW';

    this.currentStep = 'reversing-shape';
    this.startTime = Date.now();
    this.axe = this.actions[0].getSymmetricalAxe();
    this.axeAngle = this.axe.vertexes[0].getAngle(this.axe.vertexes[1]);

    this.involvedShapes.forEach(shape => {
      shape.segments.forEach(seg => {
        if (seg.arcCenter) {
          seg.tangentPoint1 = seg.centerProjectionOnSegment(this.axeAngle);
          seg.tangentPoint2 = seg.centerProjectionOnSegment(this.axeAngle + Math.PI / 2);
        }
      });
    });

    this.animate();

    return false;
  }

  /**
   * Gère l'animation du retournement.
   */
  animate() {
    let progress = this.getAnimationProgress();
    if (progress == 1) {
      this.involvedShapes.forEach(shape => (shape.haveBeenReversed = false));
      this.executeAction();
      this.start();
      app.drawAPI.askRefresh('upper');
      app.drawAPI.askRefresh();
    } else {
      app.drawAPI.askRefresh('upper');
      this.timeoutRef = setTimeout(() => {
        //TODO requestAnimFrame
        this.animate();
      }, 100);
      /*
            this.requestAnimFrameId = window.requestAnimFrame(function () {
                that.animate()
            })
             */
    }
  }

  /**
   * Renvoie l'avancement de l'animation de retournement
   * @return {float} avancement, dans l'intervalle [0, 1]
   */
  getAnimationProgress() {
    if (this.currentStep != 'reversing-shape') return null;
    let progress = (Date.now() - this.startTime) / (this.duration * 1000);
    return Math.min(progress, 1);
  }

  /**
   * Appelée par la fonction de dessin, lorsqu'il faut dessiner l'action en cours
   * @param  {Context2D} ctx              Le canvas
   * @param  {{x: float, y: float}} mouseCoordinates Les coordonnées de la souris
   */
  draw(ctx, mouseCoordinates) {
    if (this.currentStep == 'listen-canvas-click') return;
    if (this.currentStep == 'selecting-symmetrical-arch') {
      this.involvedShapes.forEach(s => {
        app.drawAPI.drawShape(ctx, s);
      });

      let axes = [
        this.actions[0].getSymmetricalAxe('V'),
        this.actions[0].getSymmetricalAxe('NW'),
        this.actions[0].getSymmetricalAxe('H'),
        this.actions[0].getSymmetricalAxe('SW'),
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
      return;
    }
    if (this.currentStep == 'reversing-shape') {
      let progress = this.getAnimationProgress();
      //TODO: opti: ne pas devoir faire des copies à chaque refresh!
      this.involvedShapes.forEach(s => {
        let s2 = s.copy();
        this.actions[0].reverseShape(s2, this.axe, progress);
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
    }
  }

  /**
   * Appelée par la fonction de dessin, renvoie les formes qu'il ne faut pas
   * dessiner sur le canvas principal.
   * @return {[Shape]} les formes à ne pas dessiner
   */
  getEditingShapes() {
    if (this.currentStep == 'listen-canvas-click') return [];
    return this.involvedShapes;
  }
}
