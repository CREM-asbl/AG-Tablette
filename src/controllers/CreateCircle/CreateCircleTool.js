import { html } from 'lit';
import { appActions } from '../../store/appState';
import { app, setState } from '../Core/App';
import { SelectManager } from '../Core/Managers/SelectManager';
import { Coordinates } from '../Core/Objects/Coordinates';
import { GeometryConstraint } from '../Core/Objects/GeometryConstraint';
import { Point } from '../Core/Objects/Point';
import { Segment } from '../Core/Objects/Segment';
import { ArrowLineShape } from '../Core/Objects/Shapes/ArrowLineShape';
import { GeometryObject } from '../Core/Objects/Shapes/GeometryObject';
import { LineShape } from '../Core/Objects/Shapes/LineShape';
import { RegularShape } from '../Core/Objects/Shapes/RegularShape';
import circles from '../Core/ShapesKits/circles.json';
import { Tool } from '../Core/States/Tool';
import { findObjectsByName } from '../Core/Tools/general';
import { isAngleBetweenTwoAngles } from '../Core/Tools/geometry';
import { linkNewlyCreatedPoint } from '../GeometryTools/general';
import { computeConstructionSpec } from '../GeometryTools/recomputeShape';

/**
 * Ajout de figures sur l'espace de travail
 */
export class CreateCircleTool extends Tool {
  constructor() {
    super('createCircle', 'Construire un arc', 'geometryCreator');

    // show-quadrilaterals -> select-points -> select-direction
    this.currentStep = null;

    // points of the shape to create
    this.points = [];

    // points drawn by the user
    this.numberOfPointsDrawn = 0;

    this.clockwise = undefined;
  }

  /**
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
    const toolName = this.title;
    return html`
      <h3>${toolName}</h3>
      <p>Vous avez sélectionné l'outil <b>"${toolName}"</b>.</p>
    `;
  }

  start() {
    this.removeListeners();
    this.stopAnimation();

    import('@components/shape-selector');
    const elem = document.createElement('shape-selector');
    elem.family = 'Arcs';
    elem.templatesNames = circles;
    elem.selectedTemplate = app.tool.selectedTemplate;
    elem.type = 'Geometry';
    elem.nextStep = 'drawFirstPoint';
    document.querySelector('body').appendChild(elem);
  }

  async drawFirstPoint() {
    app.upperCanvasLayer.removeAllObjects();
    this.removeListeners();
    this.stopAnimation();

    this.points = [];
    this.segments = [];
    this.numberOfPointsDrawn = 0;

    setTimeout(
      () => {
        appActions.setToolState({ currentStep: 'drawPoint' });
        appActions.setCurrentStep('drawPoint');
      },
      50,
    );
  }

  drawPoint() {
    this.removeListeners();
    this.stopAnimation();

    this.getConstraints(this.numberOfPointsDrawn);

    this.mouseDownId = app.addListener('canvasMouseDown', this.handler);
  }

  animatePoint() {
    this.removeListeners();
    this.animate();

    findObjectsByName('constraints', 'upper').forEach(
      (s) => (s.geometryObject.geometryIsVisible = false),
    );

    this.mouseUpId = app.addListener('canvasMouseUp', this.handler);
  }

  showArrow() {
    this.removeListeners();
    this.stopAnimation();

    window.setTimeout(
      () => (this.mouseClickId = app.addListener('canvasClick', this.handler)),
    );
  }

  end() {
    this.removeListeners();
    this.stopAnimation();
  }

  canvasMouseDown() {
    const newCoordinates = new Coordinates(
      app.workspace.lastKnownMouseCoordinates,
    );

    if (
      this.constraints.type === 'isConstrained' &&
      !this.constraints.projectionOnConstraints(newCoordinates, true)
    ) {
      window.dispatchEvent(
        new CustomEvent('show-notif', {
          detail: { message: 'Veuillez placer le point sur la contrainte.' },
        }),
      );
      return;
    }

    if (app.tool.currentStep === 'drawPoint') {
      this.points[this.numberOfPointsDrawn] = new Point({
        layer: 'upper',
        coordinates: newCoordinates,
        color: app.settings.temporaryDrawColor,
        size: 2,
      });
      this.numberOfPointsDrawn++;
      if (this.numberOfPointsDrawn === 2) {
        if (app.tool.selectedTemplate.name === 'Circle') {
          const seg = new Segment({
            layer: 'upper',
            vertexIds: [this.points[1].id, this.points[1].id],
            arcCenterId: this.points[0].id,
          });
          this.segments.push(seg);
          new RegularShape({
            layer: 'upper',
            segmentIds: this.segments.map((seg) => seg.id),
            pointIds: this.points.map((pt) => pt.id),
            strokeColor: app.settings.temporaryDrawColor,
            fillOpacity: 0,
          });
        } else if (app.tool.selectedTemplate.name === 'CirclePart') {
          const seg = new Segment({
            layer: 'upper',
            vertexIds: [this.points[0].id, this.points[1].id],
          });
          this.segments.push(seg);
          new RegularShape({
            layer: 'upper',
            segmentIds: this.segments.map((seg) => seg.id),
            pointIds: this.points.map((pt) => pt.id),
            strokeColor: app.settings.temporaryDrawColor,
            fillOpacity: 0,
          });
        } else if (app.tool.selectedTemplate.name === '30degreesArc') {
          const angle =
            this.points[0].coordinates.angleWith(this.points[1].coordinates) +
            Math.PI / 6;
          const radius = this.points[0].coordinates.dist(
            this.points[1].coordinates,
          );
          const thirdPointCoordinates = new Coordinates({
            x: this.points[0].coordinates.x + Math.cos(angle) * radius,
            y: this.points[0].coordinates.y + Math.sin(angle) * radius,
          });
          this.points[this.numberOfPointsDrawn] = new Point({
            layer: 'upper',
            coordinates: thirdPointCoordinates,
            color: app.settings.temporaryDrawColor,
            size: 2,
          });
          const seg = new Segment({
            layer: 'upper',
            vertexIds: [this.points[1].id, this.points[2].id],
            arcCenterId: this.points[0].id,
          });
          this.segments.push(seg);
          new ArrowLineShape({
            layer: 'upper',
            segmentIds: this.segments.map((seg) => seg.id),
            pointIds: this.points.map((pt) => pt.id),
            strokeColor: app.settings.temporaryDrawColor,
            fillOpacity: 0,
          });
        } else if (app.tool.selectedTemplate.name === '45degreesArc') {
          const angle =
            this.points[0].coordinates.angleWith(this.points[1].coordinates) +
            Math.PI / 4;
          const radius = this.points[0].coordinates.dist(
            this.points[1].coordinates,
          );
          const thirdPointCoordinates = new Coordinates({
            x: this.points[0].coordinates.x + Math.cos(angle) * radius,
            y: this.points[0].coordinates.y + Math.sin(angle) * radius,
          });
          this.points[this.numberOfPointsDrawn] = new Point({
            layer: 'upper',
            coordinates: thirdPointCoordinates,
            color: app.settings.temporaryDrawColor,
            size: 2,
          });
          const seg = new Segment({
            layer: 'upper',
            vertexIds: [this.points[1].id, this.points[2].id],
            arcCenterId: this.points[0].id,
          });
          this.segments.push(seg);
          new ArrowLineShape({
            layer: 'upper',
            segmentIds: this.segments.map((seg) => seg.id),
            pointIds: this.points.map((pt) => pt.id),
            strokeColor: app.settings.temporaryDrawColor,
            fillOpacity: 0,
          });
        }
      } else if (this.numberOfPointsDrawn === 3) {
        if (
          app.tool.selectedTemplate.name === 'CirclePart' ||
          app.tool.selectedTemplate.name === 'CircleArc'
        ) {
          let seg = new Segment({
            layer: 'upper',
            vertexIds: [this.points[1].id, this.points[2].id],
            arcCenterId: this.points[0].id,
            color: app.settings.referenceDrawColor,
            width: 2,
          });
          this.segments.push(seg);
          seg = new Segment({
            layer: 'upper',
            vertexIds: [this.points[2].id, this.points[1].id],
            arcCenterId: this.points[0].id,
            color: app.settings.referenceDrawColor2,
            width: 2,
          });
          this.segments.push(seg);
        }
        if (app.tool.selectedTemplate.name === 'CirclePart') {
          const seg = new Segment({
            layer: 'upper',
            vertexIds: [this.points[2].id, this.points[0].id],
          });
          this.segments.push(seg);
        }
        new RegularShape({
          layer: 'upper',
          segmentIds: this.segments.map((seg) => seg.id),
          pointIds: this.points.map((pt) => pt.id),
          strokeColor: app.settings.temporaryDrawColor,
          fillOpacity: 0,
        });
      }
      appActions.setToolState({ currentStep: 'animatePoint' });
      appActions.setCurrentStep('animatePoint');
    }
  }

  canvasMouseUp() {
    if (
      this.numberOfPointsDrawn === 2 &&
      SelectManager.areCoordinatesInMagnetismDistance(
        this.points[0].coordinates,
        this.points[1].coordinates,
      )
    ) {
      const firstPointCoordinates = this.points[0].coordinates;
      this.numberOfPointsDrawn = 1;
      app.upperCanvasLayer.removeAllObjects();
      this.points[0] = new Point({
        layer: 'upper',
        coordinates: firstPointCoordinates,
        color: app.settings.temporaryDrawColor,
        size: 2,
      });
      this.segments = [];
      window.dispatchEvent(
        new CustomEvent('show-notif', {
          detail: { message: 'Veuillez placer le point autre part.' },
        }),
      );
      setState({
        tool: { ...app.tool, name: this.name, currentStep: 'drawPoint' },
      });
      return;
    }

    if (this.numberOfPointsDrawn === this.numberOfPointsRequired()) {
      if (
        app.tool.selectedTemplate.name === 'CirclePart' ||
        app.tool.selectedTemplate.name === 'CircleArc'
      ) {
        this.stopAnimation();
        appActions.setToolState({ currentStep: 'showArrow' });
        appActions.setCurrentStep('showArrow');
      } else {
        this.stopAnimation();
        this.executeAction();
        app.upperCanvasLayer.removeAllObjects();
        appActions.setToolState({ currentStep: 'drawFirstPoint' });
        appActions.setCurrentStep('drawFirstPoint');
      }
    } else {
      this.getConstraints(this.numberOfPointsDrawn);
      appActions.setToolState({ currentStep: 'drawPoint' });
      appActions.setCurrentStep('drawPoint');
    }
  }

  canvasClick() {
    const angle = this.points[0].coordinates.angleWith(
      app.workspace.lastKnownMouseCoordinates,
    );
    const startAngle = this.points[0].coordinates.angleWith(
      this.points[1].coordinates,
    );
    const endAngle = this.points[0].coordinates.angleWith(
      this.points[2].coordinates,
    );
    const isAngleInside = isAngleBetweenTwoAngles(
      startAngle,
      endAngle,
      false,
      angle,
    );
    this.clockwise = isAngleInside;
    this.executeAction();
    app.upperCanvasLayer.removeAllObjects();
    appActions.setToolState({ currentStep: 'drawFirstPoint' });
    appActions.setCurrentStep('drawFirstPoint');
  }

  adjustPoint(point) {
    point.adjustedOn = undefined;
    if (this.constraints.isFree) {
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
    } else {
      let adjustedCoordinates = this.constraints.projectionOnConstraints(
        point.coordinates,
      );

      const constraints = SelectManager.getEmptySelectionConstraints().segments;
      constraints.canSelect = true;
      constraints.numberOfObjects = 'allInDistance';
      const adjustedSegments = SelectManager.selectSegment(
        adjustedCoordinates,
        constraints,
      );
      if (adjustedSegments) {
        const adjustedSegment = adjustedSegments
          .filter((seg) => !seg.isParalleleWith(this.constraints.segments[0]))
          .sort((seg1, seg2) =>
            seg1
              .projectionOnSegment(adjustedCoordinates)
              .dist(adjustedCoordinates) >
              seg2
                .projectionOnSegment(adjustedCoordinates)
                .dist(adjustedCoordinates)
              ? 1
              : -1,
          )[0];
        if (adjustedSegment) {
          adjustedCoordinates = adjustedSegment
            .intersectionWith(this.constraints.segments[0])
            .sort((intersection1, intersection2) =>
              intersection1.dist(adjustedCoordinates) >
                intersection2.dist(adjustedCoordinates)
                ? 1
                : -1,
            )[0];
          point.adjustedOn = adjustedSegment;
        }
      }
      // let constraints = SelectManager.getEmptySelectionConstraints().segments;
      // constraints.canSelect = true;
      // let adjustedSegment = SelectManager.selectSegment(
      //   adjustedCoordinates,
      //   constraints,
      // );
      // if (adjustedSegment) {
      //   adjustedCoordinates = adjustedSegment.intersectionWith(this.constraints.segments[0]).sort((intersection1, intersection2) =>
      //     intersection1.dist(point.coordinates) > intersection2.dist(point.coordinates) ? 1 : -1
      //   )[0];
      //   point.adjustedOn = adjustedSegment;
      // }
      point.coordinates = new Coordinates(adjustedCoordinates);
    }
  }

  refreshStateUpper() {
    if (app.tool.currentStep === 'animatePoint') {
      this.points[this.numberOfPointsDrawn - 1].coordinates = new Coordinates(
        app.workspace.lastKnownMouseCoordinates,
      );
      this.adjustPoint(this.points[this.numberOfPointsDrawn - 1]);
      if (
        app.tool.selectedTemplate.name === '30degreesArc' &&
        this.numberOfPointsDrawn === 2
      ) {
        const angle =
          this.points[0].coordinates.angleWith(this.points[1].coordinates) +
          Math.PI / 6;
        const radius = this.points[0].coordinates.dist(
          this.points[1].coordinates,
        );
        const thirdPointCoordinates = new Coordinates({
          x: this.points[0].coordinates.x + Math.cos(angle) * radius,
          y: this.points[0].coordinates.y + Math.sin(angle) * radius,
        });
        this.points[this.numberOfPointsDrawn].coordinates =
          thirdPointCoordinates;
      } else if (
        app.tool.selectedTemplate.name === '45degreesArc' &&
        this.numberOfPointsDrawn === 2
      ) {
        const angle =
          this.points[0].coordinates.angleWith(this.points[1].coordinates) +
          Math.PI / 4;
        const radius = this.points[0].coordinates.dist(
          this.points[1].coordinates,
        );
        const thirdPointCoordinates = new Coordinates({
          x: this.points[0].coordinates.x + Math.cos(angle) * radius,
          y: this.points[0].coordinates.y + Math.sin(angle) * radius,
        });
        this.points[this.numberOfPointsDrawn].coordinates =
          thirdPointCoordinates;
      }
    }
  }

  numberOfPointsRequired() {
    let numberOfPointsRequired = 0;
    if (app.tool.selectedTemplate.name === 'Circle') numberOfPointsRequired = 2;
    else if (app.tool.selectedTemplate.name === 'CirclePart')
      numberOfPointsRequired = 3;
    else if (app.tool.selectedTemplate.name === 'CircleArc')
      numberOfPointsRequired = 3;
    else if (app.tool.selectedTemplate.name === '30degreesArc')
      numberOfPointsRequired = 2;
    else if (app.tool.selectedTemplate.name === '45degreesArc')
      numberOfPointsRequired = 2;
    return numberOfPointsRequired;
  }

  getConstraints(pointNb) {
    if (pointNb === 0) {
      this.constraints = new GeometryConstraint('isFree');
    } else if (pointNb === 1) {
      this.constraints = new GeometryConstraint('isFree');
    } else if (pointNb === 2) {
      if (app.tool.selectedTemplate.name === 'CirclePart') {
        const lines = [
          [
            this.points[1].coordinates,
            this.points[1].coordinates,
            this.points[0].coordinates,
          ],
        ];
        this.constraints = new GeometryConstraint('isConstrained', lines);
      } else if (app.tool.selectedTemplate.name === 'CircleArc') {
        const lines = [
          [
            this.points[1].coordinates,
            this.points[1].coordinates,
            this.points[0].coordinates,
          ],
        ];
        this.constraints = new GeometryConstraint('isConstrained', lines);
      }
    }
  }

  _executeAction() {
    if (app.tool.selectedTemplate.name === 'CirclePart') {
      this.points.push(
        new Point({
          layer: 'upper',
          coordinates: this.points[0].coordinates,
          type: 'arcCenter',
        }),
      );
      this.points[3].adjustedOn = this.points[0];
    }
    const points = this.points.map(
      (pt) =>
        new Point({
          layer: 'main',
          coordinates: new Coordinates(pt.coordinates),
          type: 'vertex',
        }),
    );
    points.forEach((pt, idx) => (pt.adjustedOn = this.points[idx].adjustedOn));
    const segments = [];

    let idx = 0;
    if (app.tool.selectedTemplate.name === 'Circle') {
      points[0].type = 'arcCenter';
      points[1].idx = 0;
      [points[0], points[1]] = [points[1], points[0]];
      const seg = new Segment({
        layer: 'main',
        idx: idx++,
        vertexIds: [points[0].id, points[0].id],
        arcCenterId: points[1].id,
      });
      segments.push(seg);
    } else if (app.tool.selectedTemplate.name === 'CirclePart') {
      points[0].type = 'vertex';
      points[0].idx = 0;
      points[1].type = 'vertex';
      points[1].idx = 1;
      points[2].type = 'vertex';
      points[2].idx = 2;
      points[3].type = 'arcCenter';
      points[3].adjustedOn = points[0];
      let seg = new Segment({
        layer: 'main',
        idx: idx++,
        vertexIds: [points[0].id, points[1].id],
      });
      segments.push(seg);
      seg = new Segment({
        layer: 'main',
        idx: idx++,
        vertexIds: [points[1].id, points[2].id],
        arcCenterId: points[3].id,
        counterclockwise: !this.clockwise,
      });
      segments.push(seg);
      seg = new Segment({
        layer: 'main',
        idx: idx++,
        vertexIds: [points[2].id, points[0].id],
      });
      segments.push(seg);
    } else if (app.tool.selectedTemplate.name === 'CircleArc') {
      [points[0], points[1], points[2]] = [points[1], points[2], points[0]];
      points[0].type = 'vertex';
      points[0].idx = 0;
      points[1].type = 'vertex';
      points[1].idx = 1;
      points[2].type = 'arcCenter';
      const seg = new Segment({
        layer: 'main',
        idx: idx++,
        vertexIds: [points[0].id, points[1].id],
        arcCenterId: points[2].id,
        counterclockwise: !this.clockwise,
      });
      segments.push(seg);
    } else {
      [points[0], points[1], points[2]] = [points[1], points[2], points[0]];
      points[0].type = 'vertex';
      points[0].idx = 0;
      points[1].type = 'vertex';
      points[1].idx = 1;
      points[2].type = 'arcCenter';
      const seg = new Segment({
        layer: 'main',
        idx: idx++,
        vertexIds: [points[0].id, points[1].id],
        arcCenterId: points[2].id,
        counterclockwise: false,
      });
      segments.push(seg);
    }

    let constructor = RegularShape;
    if (app.tool.selectedTemplate.name === 'CircleArc') constructor = LineShape;
    else if (app.tool.selectedTemplate.name.endsWith('degreesArc'))
      constructor = ArrowLineShape;

    const shape = new constructor({
      layer: 'main',
      segmentIds: segments.map((seg) => seg.id),
      pointIds: points.map((pt) => pt.id),
      name: app.tool.selectedTemplate.name,
      familyName: 'circle-shape',
      fillOpacity: 0,
      geometryObject: new GeometryObject({}),
    });

    segments.forEach((seg, idx) => {
      seg.idx = idx;
      seg.shapeId = shape.id;
    });

    points.forEach((pt, idx) => {
      pt.shapeId = shape.id;
    });

    linkNewlyCreatedPoint(shape, shape.vertexes[0]);
    if (shape.name === 'CirclePart') {
      linkNewlyCreatedPoint(shape, shape.segments[1].arcCenter);
      linkNewlyCreatedPoint(shape, shape.vertexes[1]);
      linkNewlyCreatedPoint(shape, shape.vertexes[2]);
    } else if (shape.name === 'CircleArc') {
      linkNewlyCreatedPoint(shape, shape.segments[0].arcCenter);
      linkNewlyCreatedPoint(shape, shape.vertexes[1]);
    } else if (shape.name === 'Circle') {
      linkNewlyCreatedPoint(shape, shape.segments[0].arcCenter);
    } else {
      linkNewlyCreatedPoint(shape, shape.segments[0].arcCenter);
    }

    computeConstructionSpec(shape);
  }
}
