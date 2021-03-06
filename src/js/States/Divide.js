import { app } from '../App';
import { DivideAction } from './Actions/Divide';
import { State } from './State';
import { Segment } from '../Objects/Segment';

/**
 * Découper un segment (ou partie de segment) en X parties (ajoute X-1 points)
 */
export class DivideState extends State {
  constructor() {
    super('divide_segment');

    // choose-nb-parts -> listen-canvas-click -> select-second-point -> showing-points
    //                                        -> showing-segment
    this.currentStep = null;

    this.shape = null;

    this.timeoutRef = null;

    this.selConstr = null;

    this.numberOfparts = null;
  }

  /**
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
      let toolName = "Diviser";
      return `
            <h2>${toolName}</h2>
            <p>
            	Vous avez sélectionné l'outil <b>"${toolName}"</b>. Cet outil
                permet de diviser un segment d'une forme en plusieurs parties
                (délimitées par des points).<br />
                Après avoir choisit en combien de partie vous souhaitez diviser
                le segment, touchez le segment que vous souhaitez diviser.<br />
                Il est également possible de sélectionner deux points situés sur
                le même segment, afin de diviser le segment formé par ces deux
                points.<br /><br />

                <b>Note:</b> il est également possible de diviser un arc de
                cercle, soit en touchant l'arc lui-même, soit en sélectionnant
                deux points situés sur cet arc. Dans ce dernier cas, la division
                est effectuée dans le sens horlogique.
            </p>
      `;
  }

  /**
   * (ré-)initialiser l'état
   */
  start(openPopup = true) {
    this.shape = null;
    this.timeoutRef = null;

    this.selConstr = app.interactionAPI.getEmptySelectionConstraints();
    this.selConstr.eventType = 'click';
    this.selConstr.segments.canSelect = true;
    this.selConstr.points.canSelect = true;
    this.selConstr.points.types = ['vertex', 'segmentPoint'];
    app.interactionAPI.setSelectionConstraints(this.selConstr);

    this.actions = [new DivideAction(this.name)];
    if (openPopup) {
      this.currentStep = 'choose-nb-parts';
      app.appDiv.shadowRoot.querySelector('divide-popup').style.display = 'block';
    } else {
      this.currentStep = 'listen-canvas-click';
    }
    app.appDiv.cursor = 'default';
  }

  abort() {
    window.clearTimeout(this.timeoutRef);
  }

  setNumberOfparts(parts) {
    this.numberOfparts = parseInt(parts);
    this.currentStep = 'listen-canvas-click';
  }

  /**
   * Appelée par l'interactionAPI lorsqu'un point/segment a été sélectionnée (click)
   * @param  {Object} object            L'élément sélectionné
   * @param  {{x: float, y: float}} clickCoordinates Les coordonnées du click
   * @param  {Event} event            l'événement javascript
   */
  objectSelected(object) {
    if (this.currentStep != 'listen-canvas-click' && this.currentStep != 'select-second-point')
      return;

    if (this.currentStep == 'listen-canvas-click') {
      if (object instanceof Segment) {
        this.actions[0].shapeId = object.shape.id;
        this.actions[0].mode = 'segment';
        this.actions[0].segmentIndex = object.idx;
        this.shape = object.shape;
        this.currentStep = 'showing-segment';
      } else {
        this.currentStep = 'select-second-point';
        this.actions[0].mode = 'two_points';
        this.actions[0].shapeId = object.shape.id;
        this.actions[0].firstPoint = object;

        //Liste des points que l'on peut sélectionner comme 2ème point:
        let pointsList = this.getCandidatePoints(object);

        this.selConstr.segments.canSelect = false;
        this.selConstr.points.whitelist = pointsList;
        app.interactionAPI.setSelectionConstraints(this.selConstr);

        app.drawAPI.askRefresh();
        app.drawAPI.askRefresh('upper');
        return;
      }
    } else {
      //Check if pt1 == object
      let pt1 = this.actions[0].firstPoint;

      if (
        pt1.type == object.type &&
        pt1.segment.idx == object.segment.idx &&
        (pt1.pointType == 'vertex' || pt1.equal(object))
      ) {
        //pt1 = object => désélectionner le point.
        this.currentStep = 'listen-canvas-click';
        this.actions[0].mode = null;
        this.actions[0].shapeId = null;
        this.actions[0].firstPoint = null;

        //reset selection constraints:
        this.selConstr.segments.canSelect = true;
        this.selConstr.points.whitelist = null;
        app.interactionAPI.setSelectionConstraints(this.selConstr);

        app.drawAPI.askRefresh();
        app.drawAPI.askRefresh('upper');
        return;
      }

      /*
            Vérifie s'il y a une ambiguité sur l'action à réaliser: si les 2
            poins sont reliés par un arc de cercle, et aussi par un segment (la
            forme est donc constituée uniquement de 2 sommets, un segment et un
            arc de cercle), on annulle l'action.
             */
      if (pt1.type == 'vertex' && object.type == 'vertex') {
        let segments = object.shape.segments;
        if (
          segments.length == 2 &&
          segments[0].contains(pt1) &&
          segments[1].contains(pt1) &&
          segments[0].contains(object) &&
          segments[1].contains(object)
        ) {
          console.log('ambiguité, ne rien faire');
          this.start(false);

          app.drawAPI.askRefresh();
          app.drawAPI.askRefresh('upper');
          return;
        }
      }

      this.actions[0].secondPoint = object;
      this.currentStep = 'showing-points';
    }

    window.clearTimeout(this.timeoutRef);
    this.timeoutRef = window.setTimeout(() => {
      this.execute();
    }, 500);
    app.drawAPI.askRefresh();
    app.drawAPI.askRefresh('upper');
  }

  execute() {
    this.actions[0].numberOfparts = this.numberOfparts;
    this.executeAction();
    this.start(false);

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
    if (this.currentStep == 'showing-points') {
      let coords1 = this.actions[0].firstPoint,
        coords2 = this.actions[0].secondPoint;
      app.drawAPI.drawPoint(ctx, coords1, '#E90CC8', 2);
      app.drawAPI.drawPoint(ctx, coords2, '#E90CC8', 2);
    }
    if (this.currentStep == 'showing-segment') {
      let segments = this.shape.segments,
        index = this.actions[0].segmentIndex,
        segment = segments[index];

      if (segment.arcCenter) {
        app.drawAPI.drawArc(
          ctx,
          segment.vertexes[0],
          segment.vertexes[1],
          segment.arcCenter,
          segment.counterclockwise,
          '#E90CC8',
          3,
        );
      } else {
        app.drawAPI.drawLine(ctx, segment.vertexes[0], segment.vertexes[1], '#E90CC8', 3);
      }
    }
  }

  /**
   * Calcule la liste des points que l'on peut sélectionner comme 2ème point
   * @return {[Object]} Liste de points au même format qu'interactionAPI
   */
  getCandidatePoints(object) {
    const shape = object.shape;

    const concerned_segments = object.shape.segments.filter(seg => seg.contains(object));

    let candidates = [];

    concerned_segments.forEach(seg => {
      if (!seg) return;
      object.shape.segments.forEach(segment => {
        const vertex = segment.vertexes[1];
        if (
          seg.contains(vertex) &&
          !candidates.some(candi => candi.type == 'vertex' && candi.index == segment.idx)
        )
          candidates.push({
            shape: shape,
            type: 'vertex',
            index: segment.idx,
          });
      });
      candidates.push({
        shape: shape,
        type: 'segmentPoint',
        index: seg.idx,
      });
    });

    return candidates;
  }
}
