
import { helpConfigRegistry } from '../../services/HelpConfigRegistry';
import { appActions } from '../../store/appState';
import { app } from '../Core/App';
import { SelectManager } from '../Core/Managers/SelectManager';
import { Coordinates } from '../Core/Objects/Coordinates';
import { GeometryConstraint } from '../Core/Objects/GeometryConstraint';
import { Point } from '../Core/Objects/Point';
import { Segment } from '../Core/Objects/Segment';
import { ArrowLineShape } from '../Core/Objects/Shapes/ArrowLineShape';
import { GeometryObject } from '../Core/Objects/Shapes/GeometryObject';
import { LineShape } from '../Core/Objects/Shapes/LineShape';
import { StripLineShape } from '../Core/Objects/Shapes/StripLineShape';
import lines from '../Core/ShapesKits/lines.json';
import { Tool } from '../Core/States/Tool';
import { findObjectById } from '../Core/Tools/general';
import { linkNewlyCreatedPoint } from '../GeometryTools/general';
import { computeConstructionSpec } from '../GeometryTools/recomputeShape';
import { createLineHelpConfig } from './createLine.helpConfig';

/**
 * Ajout de figures sur l'espace de travail
 */
export class CreateLineTool extends Tool {
  constructor() {
    super('createLine', 'Construire une ligne', 'geometryCreator');

    // show-lines -> select-reference -> select-points
    this.currentStep = null;

    // points of the shape to create
    this.points = [];

    // points drawn by the user
    this.numberOfPointsDrawn = 0;

    // la référence pour la contruction de parallèles ou perpendiculaires
    this.geometryParentObjectId = null;
  }

  get selectedTemplate() {
    return app.tool?.selectedTemplate || null;
  }

  updateToolStep(step, extraState = {}) {
    if (Object.keys(extraState).length > 0) {
      appActions.setToolState(extraState);
    }
    appActions.setCurrentStep(step);
  }



  async start() {
    this.removeListeners();
    this.stopAnimation();
    this.geometryParentObjectId = null;

    // Register help configuration
    helpConfigRegistry.register(this.name, createLineHelpConfig);

    appActions.setActiveTool(this.name);

    await import('@components/shape-selector');

    // Utiliser le signal pour afficher le sélecteur de forme
    const uiState = {
      name: 'shape-selector',
      family: 'Lignes',
      templatesNames: lines,
      selectedTemplate: this.selectedTemplate,
      type: 'Geometry',
      nextStep: 'drawFirstPoint',
    };
    appActions.setToolUiState(uiState);
  }

  drawFirstPoint() {
    this.removeListeners();
    this.stopAnimation();

    this.points = [];
    this.segments = [];
    this.numberOfPointsDrawn = 0;

    if (
      !this.selectedTemplate.name.startsWith('Parallele') &&
      !this.selectedTemplate.name.startsWith('Perpendicular')
    ) {
      app.upperCanvasLayer.removeAllObjects();
      setTimeout(() => {
        appActions.setToolState({
          numberOfPointsDrawn: this.numberOfPointsDrawn,
        });
        appActions.setCurrentStep('drawPoint');
      }, 50);
    } else {
      setTimeout(() => appActions.setCurrentStep('selectReference'), 50);
    }
  }

  selectReference() {
    app.upperCanvasLayer.removeAllObjects();

    app.workspace.selectionConstraints =
      app.fastSelectionConstraints.click_all_segments;
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
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

    this.mouseUpId = app.addListener('canvasMouseUp', this.handler);
  }

  end() {
    app.upperCanvasLayer.removeAllObjects();
    this.removeListeners();
    this.stopAnimation();
  }

  /**
   * Appelée par événement du SelectManager lorsqu'un segment a été sélectionné
   * @param  {Segment} segment            Le segment sélectionnée
   */
  objectSelected(segment) {
    if (app.tool.currentStep !== 'selectReference') return;

    if (segment.isArc()) return;

    this.geometryParentObjectId = segment.id;

    new LineShape({
      layer: 'upper',
      path: segment.getSVGPath('no-scale', true),
      strokeColor: app.settings.referenceDrawColor,
      strokeWidth: 2,
    });

    appActions.setToolState({
      numberOfPointsDrawn: this.numberOfPointsDrawn,
    });
    appActions.setCurrentStep('drawPoint');
  }

  canvasMouseDown() {
    const newCoordinates = new Coordinates(
      app.workspace.lastKnownMouseCoordinates,
    );

    if (
      this.constraints.type === 'isConstrained' &&
      !this.constraints.projectionOnConstraints(newCoordinates, true)
    ) {
      appActions.addNotification({
        message: 'Veuillez placer le point sur la contrainte.',
        type: 'info',
      });
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
      if (this.selectedTemplate.name === 'Strip') {
        if (this.numberOfPointsDrawn === this.numberOfPointsRequired() - 1) {
          const seg = new Segment({
            layer: 'upper',
            vertexIds: [this.points[0].id, this.points[1].id],
            isInfinite: true,
          });
          this.segments.push(seg);
          const familyName = 'Line';
          const name = this.selectedTemplate.name;
          const shape = new LineShape({
            layer: 'upper',
            segmentIds: this.segments.map((seg) => seg.id),
            pointIds: this.points.map((pt) => pt.id),
            strokeColor: app.settings.temporaryDrawColor,
            name,
            familyName,
          });
          this.segments.forEach((seg, idx) => {
            seg.idx = idx;
            seg.shapeId = shape.id;
          });
        } else if (this.numberOfPointsDrawn === this.numberOfPointsRequired()) {
          this.finishShape();
          const seg = new Segment({
            layer: 'upper',
            vertexIds: [this.points[2].id, this.points[3].id],
            isInfinite: true,
          });
          this.segments.push(seg);
          const familyName = 'Line';
          const name = this.selectedTemplate.name;
          const shape = new LineShape({
            layer: 'upper',
            segmentIds: this.segments.map((seg) => seg.id),
            pointIds: this.points.map((pt) => pt.id),
            strokeColor: app.settings.temporaryDrawColor,
            name,
            familyName,
          });
          this.segments.forEach((seg, idx) => {
            seg.idx = idx;
            seg.shapeId = shape.id;
          });
        }
      } else if (this.numberOfPointsDrawn === this.numberOfPointsRequired()) {
        if (this.numberOfPointsDrawn < 2) this.finishShape();
        const seg = new Segment({
          layer: 'upper',
          vertexIds: [this.points[0].id, this.points[1].id],
          // isInfinite: this.selectedTemplate.endsWith('Parallele')
        });
        if (this.selectedTemplate.name.endsWith('SemiStraightLine')) {
          seg.isSemiInfinite = true;
        } else if (this.selectedTemplate.name.endsWith('StraightLine')) {
          seg.isInfinite = true;
        }
        this.segments.push(seg);
        const familyName = 'Line';
        const name = this.selectedTemplate.name;
        let shape = new LineShape({
          layer: 'upper',
          segmentIds: this.segments.map((seg) => seg.id),
          pointIds: this.points.map((pt) => pt.id),
          strokeColor: app.settings.temporaryDrawColor,
          name,
          familyName,
        });
        if (this.selectedTemplate.name === 'Vector') {
          shape = new ArrowLineShape({
            layer: 'upper',
            segmentIds: this.segments.map((seg) => seg.id),
            pointIds: this.points.map((pt) => pt.id),
            strokeColor: app.settings.temporaryDrawColor,
            name,
            familyName,
          });
        }
        this.segments.forEach((seg, idx) => {
          seg.idx = idx;
          seg.shapeId = shape.id;
        });
      }
      appActions.setToolState({
        numberOfPointsDrawn: this.numberOfPointsDrawn,
      });
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
      appActions.addNotification({
        message: 'Veuillez placer le point autre part.',
        type: 'info',
      });
      appActions.setToolState({
        numberOfPointsDrawn: this.numberOfPointsDrawn,
      });
      appActions.setCurrentStep('drawPoint');
      return;
    }

    if (this.numberOfPointsDrawn === this.numberOfPointsRequired()) {
      this.stopAnimation();
      this.executeAction();
      app.upperCanvasLayer.removeAllObjects();
      appActions.setToolState({
        numberOfPointsDrawn: 0,
      });
      appActions.setCurrentStep('drawFirstPoint');
    } else {
      this.stopAnimation();
      appActions.setToolState({
        numberOfPointsDrawn: this.numberOfPointsDrawn,
      });
      appActions.setCurrentStep('drawPoint');
    }
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
      if (adjustedSegments && this.constraints.segments && this.constraints.segments[0]) {
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
        this.numberOfPointsDrawn === this.numberOfPointsRequired() &&
        (this.selectedTemplate.name === 'ParalleleStraightLine' ||
          this.selectedTemplate.name === 'PerpendicularStraightLine' ||
          this.selectedTemplate.name === 'Strip')
      ) {
        this.finishShape();
      }
    }
  }

  numberOfPointsRequired() {
    const pointsRequired = {
      Segment: 2,
      ParalleleSegment: 2,
      PerpendicularSegment: 2,
      SemiStraightLine: 2,
      ParalleleSemiStraightLine: 2,
      PerpendicularSemiStraightLine: 2,
      StraightLine: 2,
      ParalleleStraightLine: 1,
      PerpendicularStraightLine: 1,
      Strip: 3,
      Vector: 2,
    };
    return pointsRequired[this.selectedTemplate.name];
  }

  finishShape() {
    let newCoordinates;
    if (this.selectedTemplate.name === 'ParalleleStraightLine') {
      const referenceSegment = findObjectById(this.geometryParentObjectId);
      newCoordinates = this.points[0].coordinates
        .substract(referenceSegment.vertexes[0].coordinates)
        .add(referenceSegment.vertexes[1].coordinates);
    } else if (this.selectedTemplate.name === 'PerpendicularStraightLine') {
      const referenceSegment = findObjectById(this.geometryParentObjectId);
      const angle = referenceSegment.getAngleWithHorizontal() + Math.PI / 2;
      newCoordinates = this.points[0].coordinates.add(
        new Coordinates({
          x: 100 * Math.cos(angle),
          y: 100 * Math.sin(angle),
        }),
      );
    } else if (this.selectedTemplate.name === 'Strip') {
      const referenceSegment = this.segments[0];
      newCoordinates = this.points[2].coordinates
        .substract(referenceSegment.vertexes[0].coordinates)
        .add(referenceSegment.vertexes[1].coordinates);
    }

    switch (this.points.length) {
      case 1:
      case 3:
        this.points[this.points.length] = new Point({
          layer: 'upper',
          coordinates: newCoordinates,
          color: app.settings.temporaryDrawColor,
          size: 2,
          visible: false,
        });
        break;
      case 2:
      case 4:
        this.points[this.points.length - 1].coordinates = newCoordinates;
    }
  }

  getConstraints(pointNb) {
    if (pointNb === 0) {
      this.constraints = new GeometryConstraint('isFree');
    } else if (pointNb === 1) {
      if (this.selectedTemplate.name.startsWith('Parallele')) {
        const referenceSegment = findObjectById(this.geometryParentObjectId);
        const secondCoordinates = this.points[0].coordinates
          .substract(referenceSegment.vertexes[0].coordinates)
          .add(referenceSegment.vertexes[1].coordinates);
        const lines = [[this.points[0].coordinates, secondCoordinates]];
        this.constraints = new GeometryConstraint('isConstrained', lines);
      } else if (this.selectedTemplate.name.startsWith('Perpendicular')) {
        const referenceSegment = findObjectById(this.geometryParentObjectId);
        const angle = referenceSegment.getAngleWithHorizontal() + Math.PI / 2;
        const secondCoordinates = this.points[0].coordinates.add(
          new Coordinates({
            x: 100 * Math.cos(angle),
            y: 100 * Math.sin(angle),
          }),
        );
        const lines = [[this.points[0].coordinates, secondCoordinates]];
        this.constraints = new GeometryConstraint('isConstrained', lines);
      } else {
        this.constraints = new GeometryConstraint('isFree');
      }
    } else if (pointNb === 2) {
      this.constraints = new GeometryConstraint('isFree');
    } else {
      this.constraints = new GeometryConstraint('isFree');
    }
  }

  _executeAction() {
    let path = [
      'M',
      this.points[0].coordinates.x,
      this.points[0].coordinates.y,
      'L',
      this.points[1].coordinates.x,
      this.points[1].coordinates.y,
    ];
    if (this.points.length > 2) {
      path.push(
        'M',
        this.points[2].coordinates.x,
        this.points[2].coordinates.y,
        'L',
        this.points[3].coordinates.x,
        this.points[3].coordinates.y,
      );
    }
    path = path.join(' ');

    let shape;
    if (this.selectedTemplate.name === 'Vector') {
      shape = new ArrowLineShape({
        layer: 'main',
        path: path,
        name: this.selectedTemplate.name,
        familyName: 'Line',
        geometryObject: new GeometryObject({}),
      });
    } else if (this.selectedTemplate.name === 'Strip') {
      shape = new StripLineShape({
        layer: 'main',
        path: path,
        name: this.selectedTemplate.name,
        fillOpacity: 0.7,
        familyName: 'Line',
        geometryObject: new GeometryObject({}),
      });
      shape.points[3].visible = false;
    } else {
      shape = new LineShape({
        layer: 'main',
        path: path,
        name: this.selectedTemplate.name,
        familyName: 'Line',
        geometryObject: new GeometryObject({}),
      });
      if (
        this.selectedTemplate.name === 'StraightLine' ||
        this.selectedTemplate.name === 'ParalleleStraightLine' ||
        this.selectedTemplate.name === 'PerpendicularStraightLine'
      ) {
        shape.segments[0].isInfinite = true;
        if (
          this.selectedTemplate.name === 'ParalleleStraightLine' ||
          this.selectedTemplate.name === 'PerpendicularStraightLine'
        ) {
          shape.points[1].visible = false;
        }
      } else if (
        this.selectedTemplate.name === 'SemiStraightLine' ||
        this.selectedTemplate.name === 'ParalleleSemiStraightLine' ||
        this.selectedTemplate.name === 'PerpendicularSemiStraightLine'
      ) {
        shape.segments[0].isSemiInfinite = true;
      } else if (
        this.selectedTemplate.name === 'Segment' ||
        this.selectedTemplate.name === 'ParalleleSegment' ||
        this.selectedTemplate.name === 'PerpendicularSegment'
      ) {
      }
    }

    if (this.geometryParentObjectId) {
      shape.geometryObject.geometryParentObjectId1 =
        this.geometryParentObjectId;
      const reference = findObjectById(this.geometryParentObjectId);
      reference.shape.geometryObject.geometryChildShapeIds.push(shape.id);
    }

    for (let i = 0; i < this.numberOfPointsRequired(); i++) {
      shape.vertexes[i].adjustedOn = this.points[i].adjustedOn;
      linkNewlyCreatedPoint(shape, shape.vertexes[i]);
    }

    computeConstructionSpec(shape);
  }
}
