import { html } from 'lit';
import { app, setState } from '../Core/App';
import { SelectManager } from '../Core/Managers/SelectManager';
import { Coordinates } from '../Core/Objects/Coordinates';
import { GeometryConstraint } from '../Core/Objects/GeometryConstraint';
import { Point } from '../Core/Objects/Point';
import { Segment } from '../Core/Objects/Segment';
import { ArrowLineShape } from '../Core/Objects/Shapes/ArrowLineShape';
import { GeometryObject } from '../Core/Objects/Shapes/GeometryObject';
import { LineShape } from '../Core/Objects/Shapes/LineShape';
import { StripLineShape } from '../Core/Objects/Shapes/StripLineShape';
import { Tool } from '../Core/States/Tool';
import { createElem, findObjectById } from '../Core/Tools/general';
import { linkNewlyCreatedPoint } from '../GeometryTools/general';
import { computeConstructionSpec } from '../GeometryTools/recomputeShape';

/**
 * Ajout de figures sur l'espace de travail
 */
export class CreateLineTool extends Tool {
  constructor() {
    super('createLine', 'Dessiner une ligne', 'geometryCreator');

    // show-lines -> select-reference -> select-points
    this.currentStep = null;

    // points of the shape to create
    this.points = [];

    // points drawn by the user
    this.numberOfPointsDrawn = 0;

    // la référence pour la contruction de parallèles ou perpendiculaires
    this.geometryParentObjectId = null;
  }

  /**
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
    let toolName = this.title;
    return html`
      <h3>${toolName}</h3>
      <p>Vous avez sélectionné l'outil <b>"${toolName}"</b>.</p>
    `;
  }

  start() {
    this.removeListeners();
    this.stopAnimation();
    this.geometryParentObjectId = null;

    import('./lines-list');
    createElem('lines-list');
  }

  drawFirstPoint() {
    this.removeListeners();
    this.stopAnimation();

    this.points = [];
    this.segments = [];
    this.numberOfPointsDrawn = 0;

    if (
      !app.tool.selectedLine.startsWith('Parallele') &&
      !app.tool.selectedLine.startsWith('Perpendicular')
    ) {
      app.upperCanvasLayer.removeAllObjects();
      // this.getConstraints(this.numberOfPointsDrawn);
      setTimeout(() => setState({ tool: { ...app.tool, name: this.name, currentStep: 'drawPoint' } }), 50);
    } else {
      setTimeout(() => setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectReference' } }), 50);
    }
  }

  selectReference() {
    app.upperCanvasLayer.removeAllObjects();

    app.workspace.selectionConstraints = app.fastSelectionConstraints.click_all_segments;
    this.objectSelectedId = app.addListener(
      'objectSelected',
      this.handler,
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
    if (app.tool.currentStep != 'selectReference') return;

    if (segment.isArc())
      return;

    this.geometryParentObjectId = segment.id;

    new LineShape({
      layer: 'upper',
      path: segment.getSVGPath('no-scale', true),
      strokeColor: app.settings.referenceDrawColor,
      strokeWidth: 2,
    });

    setState({ tool: { ...app.tool, name: this.name, currentStep: 'drawPoint' } })
  }

  canvasMouseDown() {
    let newCoordinates = new Coordinates(
      app.workspace.lastKnownMouseCoordinates,
    );

    if (this.constraints.type == 'isConstrained' && !this.constraints.projectionOnConstraints(newCoordinates, true)) {
      window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Veuillez placer le point sur la contrainte.' } }))
      return;
    }

    if (app.tool.currentStep == 'drawPoint') {
      this.points[this.numberOfPointsDrawn] = new Point({
        layer: 'upper',
        coordinates: newCoordinates,
        color: app.settings.temporaryDrawColor,
        size: 2,
      });
      this.numberOfPointsDrawn++;
      if (app.tool.selectedLine == 'Strip') {
        if (this.numberOfPointsDrawn == this.numberOfPointsRequired() - 1) {
          let seg = new Segment({
            layer: 'upper',
            vertexIds: [this.points[0].id, this.points[1].id],
            isInfinite: true,
          });
          this.segments.push(seg);
          let familyName = 'Line';
          let name = app.tool.selectedLine;
          let shape = new LineShape({
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
        } else if (this.numberOfPointsDrawn == this.numberOfPointsRequired()) {
          this.finishShape();
          let seg = new Segment({
            layer: 'upper',
            vertexIds: [this.points[2].id, this.points[3].id],
            isInfinite: true,
          });
          this.segments.push(seg);
          let familyName = 'Line';
          let name = app.tool.selectedLine;
          let shape = new LineShape({
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
      } else if (this.numberOfPointsDrawn == this.numberOfPointsRequired()) {
        if (this.numberOfPointsDrawn < 2) this.finishShape();
        let seg = new Segment({
          layer: 'upper',
          vertexIds: [this.points[0].id, this.points[1].id],
          // isInfinite: app.tool.selectedLine.endsWith('Parallele')
        });
        if (app.tool.selectedLine.endsWith('SemiStraightLine')) {
          seg.isSemiInfinite = true;
        } else if (app.tool.selectedLine.endsWith('StraightLine')) {
          seg.isInfinite = true;
        }
        this.segments.push(seg);
        let familyName = 'Line';
        let name = app.tool.selectedLine;
        let shape = new LineShape({
          layer: 'upper',
          segmentIds: this.segments.map((seg) => seg.id),
          pointIds: this.points.map((pt) => pt.id),
          strokeColor: app.settings.temporaryDrawColor,
          name,
          familyName,
        });
        if (app.tool.selectedLine == 'Vector') {
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
      setState({ tool: { ...app.tool, name: this.name, currentStep: 'animatePoint' } });
    }
  }

  canvasMouseUp() {
    if (this.numberOfPointsDrawn == 2 && SelectManager.areCoordinatesInMagnetismDistance(this.points[0].coordinates, this.points[1].coordinates)) {
      let firstPointCoordinates = this.points[0].coordinates;
      this.numberOfPointsDrawn = 1;
      app.upperCanvasLayer.removeAllObjects();
      this.points[0] = new Point({
        layer: 'upper',
        coordinates: firstPointCoordinates,
        color: app.settings.temporaryDrawColor,
        size: 2,
      });
      this.segments = [];
      window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Veuillez placer le point autre part.' } }));
      setState({ tool: { ...app.tool, name: this.name, currentStep: 'drawPoint' } });
      return;
    }

    if (this.numberOfPointsDrawn == this.numberOfPointsRequired()) {
      this.stopAnimation();
      this.executeAction();
      app.upperCanvasLayer.removeAllObjects();
      setState({ tool: { ...app.tool, name: this.name, currentStep: 'drawFirstPoint' } });
    } else {
      this.stopAnimation();
      setState({ tool: { ...app.tool, name: this.name, currentStep: 'drawPoint' } });
    }
  }

  adjustPoint(point) {
    point.adjustedOn = undefined;
    if (this.constraints.isFree) {
      let constraints = SelectManager.getEmptySelectionConstraints().points;
      constraints.canSelect = true;
      let adjustedPoint;
      if (adjustedPoint = SelectManager.selectPoint(
        point.coordinates,
        constraints,
        false,
      )) {
        point.coordinates = new Coordinates(adjustedPoint.coordinates);
        point.adjustedOn = adjustedPoint;
      } else if (adjustedPoint = app.gridCanvasLayer.getClosestGridPoint(point.coordinates)) {
        point.coordinates = new Coordinates(adjustedPoint.coordinates);
        point.adjustedOn = adjustedPoint;
      } else {
        constraints = SelectManager.getEmptySelectionConstraints().segments;
        constraints.canSelect = true;
        let adjustedSegment = SelectManager.selectSegment(
          point.coordinates,
          constraints,
        );
        if (adjustedSegment) {
          point.coordinates = adjustedSegment.projectionOnSegment(point.coordinates);
          point.adjustedOn = adjustedSegment;
        }
      }
    } else {
      let adjustedCoordinates = this.constraints.projectionOnConstraints(
        point.coordinates,
      );

      let constraints = SelectManager.getEmptySelectionConstraints().segments;
      constraints.canSelect = true;
      let adjustedSegment = SelectManager.selectSegment(
        adjustedCoordinates,
        constraints,
      );
      if (adjustedSegment) {
        adjustedCoordinates = adjustedSegment.intersectionWith(this.constraints.segments[0]).sort((intersection1, intersection2) =>
          intersection1.dist(adjustedCoordinates) > intersection2.dist(adjustedCoordinates) ? 1 : -1
        )[0];
        point.adjustedOn = adjustedSegment;
      }
      point.coordinates = new Coordinates(adjustedCoordinates);
    }
  }

  refreshStateUpper() {
    if (app.tool.currentStep == 'animatePoint') {
      this.points[this.numberOfPointsDrawn - 1].coordinates = new Coordinates(
        app.workspace.lastKnownMouseCoordinates,
      );
      this.adjustPoint(this.points[this.numberOfPointsDrawn - 1]);
      if (
        this.numberOfPointsDrawn == this.numberOfPointsRequired() &&
        (app.tool.selectedLine == 'ParalleleStraightLine' ||
        app.tool.selectedLine == 'PerpendicularStraightLine' ||
        app.tool.selectedLine == 'Strip')
      ) {
        this.finishShape();
      }
    }
  }

  numberOfPointsRequired() {
    let numberOfPointsRequired = 0;
    if (app.tool.selectedLine == 'Segment') numberOfPointsRequired = 2;
    else if (app.tool.selectedLine == 'ParalleleSegment')
      numberOfPointsRequired = 2;
    else if (app.tool.selectedLine == 'PerpendicularSegment')
      numberOfPointsRequired = 2;
    else if (app.tool.selectedLine == 'SemiStraightLine')
      numberOfPointsRequired = 2;
    else if (app.tool.selectedLine == 'ParalleleSemiStraightLine')
      numberOfPointsRequired = 2;
    else if (app.tool.selectedLine == 'PerpendicularSemiStraightLine')
      numberOfPointsRequired = 2;
    else if (app.tool.selectedLine == 'StraightLine') numberOfPointsRequired = 2;
    else if (app.tool.selectedLine == 'ParalleleStraightLine')
      numberOfPointsRequired = 1;
    else if (app.tool.selectedLine == 'PerpendicularStraightLine')
      numberOfPointsRequired = 1;
    else if (app.tool.selectedLine == 'Strip')
      numberOfPointsRequired = 3;
    else if (app.tool.selectedLine == 'Vector')
      numberOfPointsRequired = 2;
    return numberOfPointsRequired;
  }

  finishShape() {
    let newCoordinates;
    if (app.tool.selectedLine == 'ParalleleStraightLine') {
      let referenceSegment = findObjectById(
        this.geometryParentObjectId
      );
      newCoordinates = this.points[0].coordinates
        .substract(referenceSegment.vertexes[0].coordinates)
        .add(referenceSegment.vertexes[1].coordinates);
    } else if (app.tool.selectedLine == 'PerpendicularStraightLine') {
      let referenceSegment = findObjectById(
        this.geometryParentObjectId
      );
      let angle = referenceSegment.getAngleWithHorizontal() + Math.PI / 2;
      newCoordinates = this.points[0].coordinates.add(new Coordinates({
        x: 100 * Math.cos(angle),
        y: 100 * Math.sin(angle),
      }));
    } else if (app.tool.selectedLine == 'Strip') {
      let referenceSegment = this.segments[0];
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
    if (pointNb == 0) {
      this.constraints = new GeometryConstraint('isFree');
    } else if (pointNb == 1) {
      if (app.tool.selectedLine.startsWith('Parallele')) {
        let referenceSegment = findObjectById(
          this.geometryParentObjectId
        );
        let secondCoordinates = this.points[0].coordinates
          .substract(referenceSegment.vertexes[0].coordinates)
          .add(referenceSegment.vertexes[1].coordinates);
        let lines = [[this.points[0].coordinates, secondCoordinates]];
        this.constraints = new GeometryConstraint('isConstrained', lines);
      } else if (app.tool.selectedLine.startsWith('Perpendicular')) {
        let referenceSegment = findObjectById(
          this.geometryParentObjectId
        );
        let angle = referenceSegment.getAngleWithHorizontal() + Math.PI / 2;
        let secondCoordinates = this.points[0].coordinates.add(new Coordinates({
          x: 100 * Math.cos(angle),
          y: 100 * Math.sin(angle),
        }));
        let lines = [[this.points[0].coordinates, secondCoordinates]];
        this.constraints = new GeometryConstraint('isConstrained', lines);
      } else {
        this.constraints = new GeometryConstraint('isFree');
      }
    } else if (pointNb == 2) {
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
    if (app.tool.selectedLine == 'Vector') {
      shape = new ArrowLineShape({
        layer: 'main',
        path: path,
        name: app.tool.selectedLine,
        familyName: 'Line',
        geometryObject: new GeometryObject({}),
      });
    } else if (app.tool.selectedLine == 'Strip') {
      shape = new StripLineShape({
        layer: 'main',
        path: path,
        name: app.tool.selectedLine,
        fillOpacity: 0.7,
        familyName: 'Line',
        geometryObject: new GeometryObject({}),
      });
      shape.points[3].visible = false;
    } else {
      shape = new LineShape({
        layer: 'main',
        path: path,
        name: app.tool.selectedLine,
        familyName: 'Line',
        geometryObject: new GeometryObject({}),
      });
      if (
        app.tool.selectedLine == 'StraightLine' ||
        app.tool.selectedLine == 'ParalleleStraightLine' ||
        app.tool.selectedLine == 'PerpendicularStraightLine'
      ) {
        shape.segments[0].isInfinite = true;
        if (app.tool.selectedLine == 'ParalleleStraightLine' ||
          app.tool.selectedLine == 'PerpendicularStraightLine') {
          shape.points[1].visible = false;
        }
      } else if (
        app.tool.selectedLine == 'SemiStraightLine' ||
        app.tool.selectedLine == 'ParalleleSemiStraightLine' ||
        app.tool.selectedLine == 'PerpendicularSemiStraightLine'
      ) {
        shape.segments[0].isSemiInfinite = true;
      } else if (
        app.tool.selectedLine == 'Segment' ||
        app.tool.selectedLine == 'ParalleleSegment' ||
        app.tool.selectedLine == 'PerpendicularSegment'
      ) {
      }
    }

    if (this.geometryParentObjectId) {
      shape.geometryObject.geometryParentObjectId1 = this.geometryParentObjectId;
      let reference = findObjectById(this.geometryParentObjectId);
      reference.shape.geometryObject.geometryChildShapeIds.push(shape.id);
    }

    for (let i = 0; i < this.numberOfPointsRequired(); i++) {
      shape.vertexes[i].adjustedOn = this.points[i].adjustedOn;
      linkNewlyCreatedPoint(shape, shape.vertexes[i]);
    }

    // shape.vertexes[0].adjustedOn = this.points[0].adjustedOn;
    // linkNewlyCreatedPoint(shape, shape.vertexes[0]);
    // if (shape.name.endsWith('Segment') || shape.name.endsWith('SemiStraightLine') || shape.name == 'StraightLine' || shape.name == 'Vector' || shape.name == 'Strip') {
    //   shape.vertexes[1].adjustedOn = this.points[1].adjustedOn;
    //   linkNewlyCreatedPoint(shape, shape.vertexes[1]);
    // }
    // if (shape.name == 'Strip') {
    //   shape.vertexes[2].adjustedOn = this.points[2].adjustedOn;
    //   linkNewlyCreatedPoint(shape, shape.vertexes[2]);
    // }
    computeConstructionSpec(shape);
  }
}
