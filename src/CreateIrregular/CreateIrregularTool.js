import { app, setState } from '../Core/App';
import { Tool } from '../Core/States/Tool';
import { html } from 'lit';
import { SelectManager } from '../Core/Managers/SelectManager';
import { Segment } from '../Core/Objects/Segment';
import { Point } from '../Core/Objects/Point';
import { uniqId } from '../Core/Tools/general';
import { Coordinates } from '../Core/Objects/Coordinates';
import { Shape } from '../Core/Objects/Shape';
import { getShapeAdjustment } from '../Core/Tools/automatic_adjustment';

/**
 * Ajout de figures sur l'espace de travail
 */
export class CreateIrregularTool extends Tool {
  constructor() {
    super(
      'createIrregularPolygon',
      'Dessiner un polygone irrégulier',
      'geometryCreator',
    );

    // listen-canvas-click
    this.points = [];

    this.shapeId = null;
  }

  /**
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
    let toolName = this.title;
    return html`
      <h2>${toolName}</h2>
      <p>Vous avez sélectionné l'outil <b>"${toolName}"</b>.<br /></p>
    `;
  }

  /**
   * (ré-)initialiser l'état
   */
  start() {
    this.removeListeners();

    this.points = [];
    this.segments = [];

    setTimeout(() => setState({ tool: { ...app.tool, name: this.name, currentStep: 'drawPoint' } }), 50);
  }

  drawPoint() {
    this.removeListeners();
    this.stopAnimation();

    this.mouseDownId = app.addListener('canvasMouseDown', this.handler);
  }

  animatePoint() {
    this.animate();

    this.mouseUpId = app.addListener('canvasMouseUp', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    this.removeListeners();
    this.stopAnimation();
  }

  canvasMouseDown() {
    let newCoordinates = new Coordinates(
      app.workspace.lastKnownMouseCoordinates,
    );

    this.points.push(
      new Point({
        drawingEnvironment: app.upperDrawingEnvironment,
        coordinates: newCoordinates,
        color: app.settings.temporaryDrawColor,
        size: 2,
      }),
    );
    if (this.points.length > 1) {
      let seg = new Segment({
        drawingEnvironment: app.upperDrawingEnvironment,
        vertexIds: [
          this.points[this.points.length - 2].id,
          this.points[this.points.length - 1].id,
        ],
      });
      this.segments.push(seg);
      new Shape({
        drawingEnvironment: app.upperDrawingEnvironment,
        segmentIds: [seg.id],
        pointIds: seg.vertexIds,
        borderColor: app.settings.temporaryDrawColor,
      });
    }
    setState({
      tool: { ...app.tool, name: this.name, currentStep: 'animatePoint' },
    });
  }

  canvasMouseUp() {
    if (
      this.points.length > 2 &&
      SelectManager.areCoordinatesInMagnetismDistance(
        this.points[0].coordinates,
        this.points[this.points.length - 1].coordinates,
      )
    ) {
      this.stopAnimation();

      this.executeAction();
      app.upperDrawingEnvironment.removeAllObjects();
      setState({
        tool: { ...app.tool, name: this.name, currentStep: 'start' },
      });
    } else {
      setState({
        tool: { ...app.tool, name: this.name, currentStep: 'drawPoint' },
      });
    }
  }

  adjustPoint(point) {
    if (
      this.points.length > 2 &&
      SelectManager.areCoordinatesInMagnetismDistance(
        this.points[0].coordinates,
        point.coordinates,
      )
    )
      point.coordinates = new Coordinates(this.points[0].coordinates);
    else {
      let constraints = SelectManager.getEmptySelectionConstraints().points;
      constraints.canSelect = true;
      let adjustedCoordinates = SelectManager.selectPoint(
        point.coordinates,
        constraints,
        false,
      );
      if (adjustedCoordinates)
        point.coordinates = new Coordinates(adjustedCoordinates.coordinates);
    }
  }

  refreshStateUpper() {
    if (app.tool.currentStep == 'animatePoint') {
      this.points[this.points.length - 1].coordinates = new Coordinates(
        app.workspace.lastKnownMouseCoordinates,
      );
      this.adjustPoint(this.points[this.points.length - 1]);
    }
  }


  _executeAction() {
    const shapeSize = 1;

    let path = this.linkSegments(this.segments);
    console.log(path);

    let shape = new Shape({
      path: path,
      borderColor: '#000000',
      size: shapeSize,
      drawingEnvironment: app.mainDrawingEnvironment,
    });

    let transformation = getShapeAdjustment([shape], shape);
    shape.rotate(transformation.rotationAngle, shape.centerCoordinates);
    shape.translate(transformation.translation);
    app.upperDrawingEnvironment.removeAllObjects();
    window.dispatchEvent(new CustomEvent('refreshUpper'));
  }

  linkSegments(segmentsList) {
    let startCoordinates = segmentsList[0].vertexes[0].coordinates;
    let path = ['M', startCoordinates.x, startCoordinates.y];
    let segmentUsed = 0;
    let numberOfSegments = segmentsList.length;

    let nextSegmentIndex = 0;
    this.addPathElem(path, segmentsList[0]);
    this.lastUsedCoordinates = segmentsList[0].vertexes[1].coordinates;
    segmentsList.splice(nextSegmentIndex, 1);
    segmentUsed++;

    while (!this.lastUsedCoordinates.equal(startCoordinates)) {
      const potentialSegmentIdx = segmentsList
        .map((seg, idx) =>
          seg.contains(this.lastUsedCoordinates, false) ? idx : undefined,
        )
        .filter((seg) => Number.isInteger(seg));
      if (potentialSegmentIdx.length != 1) {
        if (potentialSegmentIdx.length == 0)
          console.warn('shape cannot be closed (dead end)');
        else
          console.warn(
            'shape is dig (a segment has more than one segment for next)',
          );
        return null;
      }
      nextSegmentIndex = potentialSegmentIdx[0];
      let nextSegment = segmentsList[nextSegmentIndex];
      let mustReverse = false;
      if (
        !nextSegment.vertexes[0].coordinates.equal(this.lastUsedCoordinates)
      ) {
        mustReverse = true;
      }
      this.addPathElem(path, nextSegment, mustReverse);
      segmentsList.splice(nextSegmentIndex, 1);
      segmentUsed++;
    }

    if (segmentUsed != numberOfSegments) {
      // si tous les segments n'ont pas été utilisés, la figure créée est creuse
      console.warn('shape is dig (not all segments have been used)');
      return null;
    }

    path = path.join(' ');

    return path;
  }

  addPathElem(path, segment, mustReverse) {
    let firstCoord = segment.vertexes[0].coordinates;
    let secondCoord = segment.vertexes[1].coordinates;
    if (!segment.isArc()) {
      if (mustReverse) [firstCoord, secondCoord] = [secondCoord, firstCoord];
      path.push('L', secondCoord.x, secondCoord.y);
    } else {
      let centerCoordinates = segment.arcCenter.coordinates;
      let radius = centerCoordinates.dist(secondCoord),
        firstAngle = centerCoordinates.angleWith(firstCoord),
        secondAngle = centerCoordinates.angleWith(secondCoord);

      if (secondAngle < firstAngle) secondAngle += 2 * Math.PI;
      let largeArcFlag = secondAngle - firstAngle > Math.PI ? 1 : 0,
        sweepFlag = 1;
      if (segment.counterclockwise) {
        sweepFlag = Math.abs(sweepFlag - 1);
        largeArcFlag = Math.abs(largeArcFlag - 1);
      }

      if (mustReverse) {
        [firstCoord, secondCoord] = [secondCoord, firstCoord];
        sweepFlag = Math.abs(sweepFlag - 1);
      }

      path.push(
        'A',
        radius,
        radius,
        0,
        largeArcFlag,
        sweepFlag,
        secondCoord.x,
        secondCoord.y,
      );
    }
    this.lastUsedCoordinates = secondCoord;
  }
}
