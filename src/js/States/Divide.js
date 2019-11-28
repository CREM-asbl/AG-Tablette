import { app } from '../App';
import { DivideAction } from './Actions/Divide';
import { State } from './State';
import { Points } from '../Tools/points';

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
  }

  /**
   * (ré-)initialiser l'état
   */
  start(openPopup = true) {
    this.actions = [new DivideAction(this.name)];

    this.currentStep = 'choose-nb-parts';

    this.shape = null;
    this.timeoutRef = null;

    this.selConstr = app.interactionAPI.getEmptySelectionConstraints();
    this.selConstr.eventType = 'click';
    this.selConstr.segments.canSelect = true;
    this.selConstr.points.canSelect = true;
    this.selConstr.points.types = ['vertex', 'segmentPoint'];
    app.interactionAPI.setSelectionConstraints(this.selConstr);

    if (openPopup) document.querySelector('divide-popup').style.display = 'block';
    app.appDiv.cursor = 'default';
  }

  abort() {
    window.clearTimeout(this.timeoutRef);
  }

  setNumberOfparts(parts) {
    this.actions[0].numberOfparts = parseInt(parts);
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
      if (object.type === 'segment') {
        this.actions[0].shapeId = object.shape.id;
        this.actions[0].mode = 'segment';
        this.actions[0].segmentIndex = object.index;
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
        pt1.index == object.index &&
        (pt1.pointType == 'vertex' || pt1.coordinates.equal(object.coordinates))
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
      if (pt1.pointType == 'vertex' && object.pointType == 'vertex') {
        let bsList = object.shape.buildSteps;
        if (
          bsList.filter(bs => bs.type == 'vertex').length == 2 &&
          bsList.filter(bs => bs.type == 'segment' && bs.isArc !== true).length == 1 &&
          bsList.filter(bs => bs.type == 'moveTo').length == 1 &&
          bsList.filter(bs => bs.type == 'segment' && bs.isArc === true).length > 0
        ) {
          console.log('ambiguité, ne rien faire');
          let parts = this.actions[0].numberOfparts;
          this.start(false);
          this.setNumberOfparts(parts);

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
    this.executeAction();
    let parts = this.actions[0].numberOfparts;
    this.start(false);
    this.setNumberOfparts(parts);

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
      let coords = this.actions[0].firstPoint.coordinates;
      app.drawAPI.drawPoint(ctx, coords, '#E90CC8', 2);
    }
    if (this.currentStep == 'showing-points') {
      let coords1 = this.actions[0].firstPoint.coordinates,
        coords2 = this.actions[0].secondPoint.coordinates;
      app.drawAPI.drawPoint(ctx, coords1, '#E90CC8', 2);
      app.drawAPI.drawPoint(ctx, coords2, '#E90CC8', 2);
    }
    if (this.currentStep == 'showing-segment') {
      let bs = this.shape.buildSteps,
        sIndex = this.actions[0].segmentIndex,
        indexes = [sIndex];
      if (bs[sIndex].isArc) indexes = this.shape.getArcSegmentIndexes(sIndex);
      indexes.forEach(index =>
        app.drawAPI.drawLine(ctx, bs[index].vertexes[0], bs[index].vertexes[1], '#E90CC8', 3),
      );
    }
  }

  /**
   * Calcule la liste des points que l'on peut sélectionner comme 2ème point
   * @return {[Object]} Liste de points au même format qu'interactionAPI
   */
  getCandidatePoints(object) {
    let shape = object.shape,
      bs = object.shape.buildSteps,
      vertexToAdd = [],
      segmentsToAdd = [],
      isVertexAfter = false;

    if (object.pointType === 'vertex') {
      let nextBSIndex = shape.getNextBuildstepIndex(object.index);
      if (bs[nextBSIndex].isArc === true) isVertexAfter = true;
    } else if (bs[object.index].isArc === true) isVertexAfter = true;

    //Vertex précédent et suivant:
    if (!isVertexAfter) {
      vertexToAdd.push(shape.getNextVertexIndex(object.index));
    }

    if (!shape.isCircle() && !shape.isSegment())
      vertexToAdd.push(shape.getPrevVertexIndex(object.index));

    if (object.pointType === 'vertex') {
      //segmentPoints suivant et précédent
      if (!isVertexAfter || shape.isCircle()) {
        segmentsToAdd.push([shape.getNextBuildstepIndex(object.index), false]);
      }
      if (!shape.isSegment())
        segmentsToAdd.push([shape.getPrevBuildstepIndex(object.index), false]);
    } else {
      //segmentPoint actuel
      segmentsToAdd.push([object.index, isVertexAfter && !shape.isCircle()]);
    }

    vertexToAdd = vertexToAdd.map(vertex => {
      return {
        shape: shape,
        type: 'vertex',
        index: vertex,
      };
    });

    //segmentsToAdd ??? les points sur les segments possibles ?
    segmentsToAdd = segmentsToAdd
      .map(data => {
        let [segment, skipPointsAfter] = data,
          start = segment,
          end = segment,
          pts = [];
        if (bs[segment].isArc) {
          let data = shape.getArcEnds(segment);
          start = data[0];
          end = skipPointsAfter ? segment : data[1];
        }
        let index = start - 1,
          first = true;

        while (index !== end || first) {
          index = shape.getNextBuildstepIndex(index);
          pts = pts.concat(
            bs[index].points.map(pt => {
              return {
                shape: shape,
                type: 'segmentPoint',
                index: index,
                coordinates: new Point(pt),
              };
            }),
          );
          first = false;
        }
        return pts;
      })
      .reduce((total, pts) => {
        return total.concat(pts);
      }, []);

    return vertexToAdd.concat(segmentsToAdd);
  }
}
