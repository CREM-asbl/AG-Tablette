import { html } from 'lit';
import { app, setState } from '../Core/App';
import { SelectManager } from '../Core/Managers/SelectManager';
import { Coordinates } from '../Core/Objects/Coordinates';
import { Point } from '../Core/Objects/Point';
import { Segment } from '../Core/Objects/Segment';
import { GeometryObject } from '../Core/Objects/Shapes/GeometryObject';
import { RegularShape } from '../Core/Objects/Shapes/RegularShape';
import { Tool } from '../Core/States/Tool';
import { GridManager } from '../Grid/GridManager';

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
      <h3>${toolName}</h3>
      <p>Vous avez sélectionné l'outil <b>"${toolName}"</b>.<br /></p>
    `;
  }

  start() {
    app.upperCanvasElem.removeAllObjects();
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
        drawingEnvironment: app.upperCanvasElem,
        coordinates: newCoordinates,
        color: app.settings.temporaryDrawColor,
        size: 2,
      }),
    );
    if (this.points.length > 1) {
      let seg = new Segment({
        drawingEnvironment: app.upperCanvasElem,
        vertexIds: [
          this.points[this.points.length - 2].id,
          this.points[this.points.length - 1].id,
        ],
      });
      this.segments.push(seg);
      new RegularShape({
        drawingEnvironment: app.upperCanvasElem,
        segmentIds: [seg.id],
        pointIds: seg.vertexIds,
        strokeColor: app.settings.temporaryDrawColor,
        fillOpacity: 0,
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
      app.upperCanvasElem.removeAllObjects();
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
      else {
        let gridPoint = GridManager.getClosestGridPoint(point.coordinates);
        if (gridPoint)
          point.coordinates = new Coordinates(gridPoint.coordinates);
      }
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
    let familyName = 'Irregular';

    let path = ['M', this.points[0].coordinates.x, this.points[0].coordinates.y];
    this.points.forEach((point, i) => {
      if (i != 0)
        path.push('L', point.coordinates.x, point.coordinates.y);
    })
    // path.push('L', this.points[0].coordinates.x, this.points[0].coordinates.y);
    path = path.join(' ');

    let shape = new RegularShape({
      drawingEnvironment: app.mainCanvasElem,
      path: path,
      name: app.tool.selectedTriangle,
      familyName: familyName,
      fillOpacity: 0,
      geometryObject: new GeometryObject({}),
    });

    let ref;
    shape.vertexes.forEach((vx, i) => {
      if (ref = app.mainCanvasElem.points.filter(pt => pt.id != shape.vertexes[i].id).find(pt => pt.coordinates.equal(shape.vertexes[i].coordinates))) {
        if (ref.shape.geometryObject.geometryChildShapeIds.indexOf(shape.id) === -1)
          ref.shape.geometryObject.geometryChildShapeIds.push(shape.id);
        shape.vertexes[i].reference = ref.id;
      }
    });
  }
}
