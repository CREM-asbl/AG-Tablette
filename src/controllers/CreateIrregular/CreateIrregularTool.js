
import { helpConfigRegistry } from '../../services/HelpConfigRegistry';
import { appActions } from '../../store/appState';
import { app } from '../Core/App';
import { SelectManager } from '../Core/Managers/SelectManager';
import { Coordinates } from '../Core/Objects/Coordinates';
import { Point } from '../Core/Objects/Point';
import { Segment } from '../Core/Objects/Segment';
import { GeometryObject } from '../Core/Objects/Shapes/GeometryObject';
import { RegularShape } from '../Core/Objects/Shapes/RegularShape';
import { Tool } from '../Core/States/Tool';
import { linkNewlyCreatedPoint } from '../GeometryTools/general';
import { createIrregularHelpConfig } from './createIrregular.helpConfig';

/**
 * Ajout de figures sur l'espace de travail
 */
export class CreateIrregularTool extends Tool {
  constructor() {
    super(
      'createIrregularPolygon',
      'Construire un polygone irrégulier',
      'geometryCreator',
    );

    // listen-canvas-click
    this.points = [];
    this.numberOfPointsDrawn = 0;

    this.shapeId = null;
  }

  updateToolStep(step, extraState = {}) {
    appActions.setToolState(extraState);
    appActions.setCurrentStep(step);
  }



  start() {
    app.upperCanvasLayer.removeAllObjects();
    this.removeListeners();
    this.stopAnimation();

    helpConfigRegistry.register(this.name, createIrregularHelpConfig);

    appActions.setActiveTool(this.name);

    this.points = [];
    this.segments = [];
    this.numberOfPointsDrawn = 0;

    setTimeout(
      () =>
        this.updateToolStep('drawPoint', {
          numberOfPointsDrawn: this.numberOfPointsDrawn,
        }),
      50,
    );
  }

  drawPoint() {
    this.removeListeners();
    this.stopAnimation();

    this.mouseDownId = app.addListener('canvasMouseDown', this.handler);
  }

  animatePoint() {
    this.removeListeners();
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
    const newCoordinates = new Coordinates(
      app.workspace.lastKnownMouseCoordinates,
    );

    this.points.push(
      new Point({
        layer: 'upper',
        coordinates: newCoordinates,
        color: app.settings.temporaryDrawColor,
        size: 2,
      }),
    );
    this.numberOfPointsDrawn++;
    if (this.points.length > 1) {
      const seg = new Segment({
        layer: 'upper',
        vertexIds: [
          this.points[this.points.length - 2].id,
          this.points[this.points.length - 1].id,
        ],
      });
      this.segments.push(seg);
      new RegularShape({
        layer: 'upper',
        segmentIds: [seg.id],
        pointIds: seg.vertexIds,
        strokeColor: app.settings.temporaryDrawColor,
        fillOpacity: 0,
      });
    }
    this.updateToolStep('animatePoint', {
      numberOfPointsDrawn: this.numberOfPointsDrawn,
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
      app.upperCanvasLayer.removeAllObjects();
      this.updateToolStep('start', {
        numberOfPointsDrawn: 0,
      });
    } else {
      this.updateToolStep('drawPoint', {
        numberOfPointsDrawn: this.numberOfPointsDrawn,
      });
    }
  }

  adjustPoint(point) {
    point.adjustedOn = undefined;
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
      let adjustedPoint;
      if (
        (adjustedPoint = SelectManager.selectPoint(
          point.coordinates,
          constraints,
          false,
        ))
      ) {
        point.coordinates = new Coordinates(adjustedPoint.coordinates);
        point.adjustedOn = adjustedPoint;
      } else if (
        (adjustedPoint = app.gridCanvasLayer.getClosestGridPoint(
          point.coordinates.toCanvasCoordinates(),
        ))
      ) {
        const adjustedPointInWorldSpace = adjustedPoint.fromCanvasCoordinates();
        point.coordinates = new Coordinates(adjustedPointInWorldSpace);
        point.adjustedOn = adjustedPointInWorldSpace;
      } else {
        constraints = SelectManager.getEmptySelectionConstraints().segments;
        constraints.canSelect = true;
        const adjustedSegment = SelectManager.selectSegment(
          point.coordinates,
          constraints,
        );
        if (adjustedSegment) {
          point.coordinates = adjustedSegment.projectionOnSegment(
            point.coordinates,
          );
          point.adjustedOn = adjustedSegment;
        }
      }
    }
  }

  refreshStateUpper() {
    if (app.tool.currentStep === 'animatePoint') {
      this.points[this.points.length - 1].coordinates = new Coordinates(
        app.workspace.lastKnownMouseCoordinates,
      );
      this.adjustPoint(this.points[this.points.length - 1]);
    }
  }

  _executeAction() {
    const familyName = 'Irregular';

    let path = [
      'M',
      this.points[0].coordinates.x,
      this.points[0].coordinates.y,
    ];
    this.points.forEach((point, i) => {
      if (i !== 0) path.push('L', point.coordinates.x, point.coordinates.y);
    });
    // path.push('L', this.points[0].coordinates.x, this.points[0].coordinates.y);
    path = path.join(' ');

    const shape = new RegularShape({
      layer: 'main',
      path: path,
      name: 'IrregularPolygon',
      familyName: familyName,
      fillOpacity: 0,
      geometryObject: new GeometryObject({}),
    });

    shape.vertexes.forEach((vx, idx) => {
      vx.adjustedOn = this.points[idx].adjustedOn;
      linkNewlyCreatedPoint(shape, vx);
    });
  }
}
