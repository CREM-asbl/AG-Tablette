import { html } from 'lit';
import { app, setState } from '../Core/App';
import { SelectManager } from '../Core/Managers/SelectManager';
import { Coordinates } from '../Core/Objects/Coordinates';
import { Point } from '../Core/Objects/Point';
import { LineShape } from '../Core/Objects/Shapes/LineShape';
import { Tool } from '../Core/States/Tool';
import { addInfoToId, findObjectById } from '../Core/Tools/general';
import { duplicateShape } from '../Core/Tools/shapesTools';
import {
    computeConstructionSpec,
    computeShapeTransform,
    projectionOnConstraints,
    recomputeAllVisibilities,
    computeDivisionPoint,
    getRatioWithPosition
} from '../GeometryTools/recomputeShape';

/**
 * Ajout de figures sur l'espace de travail
 */
export class TransformTool extends Tool {
  constructor() {
    super('transform', 'Modifier une figure', 'operation');

    // show-points -> move-point
    this.currentStep = null;

    // id of the shape that contains the point
    this.shapeId = null;

    // point to modify
    this.pointSelected = null;

    // destination point
    this.pointDest = null;

    // the constraints applied to pointSelected
    this.constraints = null;

    // line de contrainte (segment, droite, demi-droite ou arc de cercle, cercle)
    this.line = null;
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
    app.mainCanvasLayer.editingShapeIds = [];
    app.upperCanvasLayer.removeAllObjects();

    this.shapeId = null;
    this.pointSelected = null;
    this.pointDest = null;
    this.constraints = null;
    this.line = null;

    app.mainCanvasLayer.shapes.forEach((s) => {
      s.vertexes.forEach((pt) => {
        pt.computeTransformConstraint();
      });
      s.points.filter(pt =>
        pt.type == 'arcCenter'
      ).forEach(pt => {
        pt.computeTransformConstraint();
      });
    });

    setTimeout(() => setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectPoint' } }), 50);
  }

  selectPoint() {
    this.removeListeners();
    this.constraintsDrawn = false;
    app.mainCanvasLayer.editingShapeIds = [];
    app.upperCanvasLayer.removeAllObjects();

    window.dispatchEvent(new CustomEvent('reset-selection-constraints'));
    app.workspace.selectionConstraints.eventType = 'mousedown';
    app.workspace.selectionConstraints.points.canSelect = true;

    app.workspace.selectionConstraints.points.types = ['vertex', 'arcCenter'];
    app.workspace.selectionConstraints.points.whitelist = null;
    app.workspace.selectionConstraints.points.blacklist = null;
    app.workspace.selectionConstraints.points.numberOfObjects = 'allInDistance';

    window.dispatchEvent(new CustomEvent('refreshUpper'));
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  transform() {
    this.removeListeners();

    this.mouseUpId = app.addListener('canvasMouseUp', this.handler);
    this.animate();
  }

  end() {
    this.constraintsDrawn = false;
    app.mainCanvasLayer.editingShapeIds = [];
    app.upperCanvasLayer.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();
  }

  objectSelected(points) {
    for (let i = 0; i < points.length; i++) {
      if (points[i].reference) {
        let reference = findObjectById(points[i].reference);
        if (reference instanceof Point) {
          points[i] = findObjectById(points[i].reference);
          i--;
          continue;
        }
      }
      points[i].computeTransformConstraint();
      let constraints = points[i].transformConstraints;
      if (constraints.isBlocked || constraints.isConstructed) {
        points.splice(i, 1);
        i--;
      }
    }

    if (points.length == 0)
      return

    let point = points.find(point => point.transformConstraints.isConstrained);
    if (!point)
      point = points[0]

    this.constraints = point.transformConstraints;

    app.upperCanvasLayer.removeAllObjects();

    if (!this.constraintsDrawn) {
      this.drawConstraints(point);
    }

    this.pointSelectedId = point.id;

    // let involvedShapes = [point.shape];
    // getAllLinkedShapesInGeometry(point.shape, involvedShapes);
    let involvedShapes = app.mainCanvasLayer.shapes;

    this.drawingShapes = involvedShapes.map(
      (s) => duplicateShape(s)
    );

    app.mainCanvasLayer.editingShapeIds = involvedShapes.map(
      (s) => s.id,
    );

    let startShapeId = addInfoToId(point.shape.id, 'upper');
    this.tree =  {
      [startShapeId]: {
        parents: [],
        isDone: false,
      },
    }
    this.createTree(0, this.tree);

    setState({ tool: { ...app.tool, name: this.name, currentStep: 'transform' } })
    // window.dispatchEvent(new CustomEvent('refresh'));
  }

  createTree(index, tree) {
    let currentEntries = Object.entries(tree);
    if (currentEntries.length == index)
      return;
    let currentShapeId = currentEntries[index][0]
    let currentShape = findObjectById(currentShapeId);
    let dependenciesIds = [...currentShape.geometryObject.geometryChildShapeIds, ...currentShape.geometryObject.geometryTransformationChildShapeIds, ...currentShape.geometryObject.geometryDuplicateChildShapeIds];
    console.log(dependenciesIds);
    dependenciesIds.forEach(dependenciesId => {
      if (tree[dependenciesId])
        tree[dependenciesId].parents.push(currentShapeId)
      else
        tree[dependenciesId] = {
          isDone: false,
          parents: [currentShapeId],
        }
    });
    tree[currentShapeId].children = dependenciesIds;
    this.createTree(index + 1, tree);
  }

  resetTree() {
    for (const elem in this.tree) {
      this.tree[elem].isDone = false;
    }
  }

  browseTree(currentShapeId, tree) {
    if (!tree[currentShapeId].isDone) {// && tree[currentShapeId].parents.every(parent => tree[parent].isDone)) {
      let currentShape = findObjectById(currentShapeId);
      console.log(currentShape.name);
      computeShapeTransform(currentShape);
      tree[currentShapeId].isDone = true;
      tree[currentShapeId].children.forEach(child => this.browseTree(child, tree));
    }
  }

  canvasMouseUp() {
    this.stopAnimation();
    this.executeAction();
    setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectPoint' } })
    // this.restart();
  }

  _executeAction() {
    app.mainCanvasLayer.editingShapeIds.forEach((sId, idxS) => {
      let s = findObjectById(sId);
      s.points.forEach((pt, idxPt) => {
        pt.coordinates = new Coordinates(this.drawingShapes[idxS].points[idxPt].coordinates);
        pt.ratio = this.drawingShapes[idxS].points[idxPt].ratio;
      });
      s.geometryObject.geometryIsVisibleByChoice =  this.drawingShapes[idxS].geometryObject.geometryIsVisibleByChoice;
      computeConstructionSpec(s);
    });
    recomputeAllVisibilities('main')
  }

  refreshStateUpper() {
    if (app.tool.currentStep == 'transform') {
      let point = findObjectById(addInfoToId(this.pointSelectedId, 'upper'));
      let shape = point.shape;
      app.upperCanvasLayer.shapes.forEach(s => {
        s.geometryObject?.geometryDuplicateChildShapeIds.forEach(duplicateChildId => {
          let duplicateChild = findObjectById(duplicateChildId);
          computeConstructionSpec(duplicateChild);
        });
      });
      if (shape.name == 'Trapeze' && point.idx < 3) {
        computeConstructionSpec(shape);
      } else if (point.idx < 2 || point.type == 'arcCenter') {
        switch (shape.name) {
          case 'Rectangle':
          case 'Losange':
          case 'Parallelogram':
          case 'RightAngleTrapeze':
          case 'IsoscelesTrapeze':
          case 'RightAngleIsoscelesTriangle':
          case 'RightAngleTriangle':
          case 'IsoscelesTriangle':
          case 'CirclePart':
            computeConstructionSpec(shape);
            break;
          default:
            break;
        }
      }
      if (point.idx == 0 || point.type == 'arcCenter') {
        switch (shape.name) {
          case 'CircleArc':
          case 'ParalleleSemiStraightLine':
          case 'PerpendicularSemiStraightLine':
          case 'ParalleleSegment':
          case 'PerpendicularSegment':
            computeConstructionSpec(shape);
          default:
            break;
        }
      }
      point.coordinates = app.workspace.lastKnownMouseCoordinates;
      // this.adjustPoint(point);
      if (shape.name == 'PointOnLine') {
        let reference = findObjectById(shape.geometryObject.geometryParentObjectId1);
        point.coordinates = reference.projectionOnSegment(point.coordinates);
        computeConstructionSpec(shape);
      } else if (point.transformConstraints.isConstrained) {
        point.coordinates = projectionOnConstraints(point.coordinates, point.transformConstraints);
        if (point.reference) {
          point.ratio = getRatioWithPosition(point, findObjectById(point.reference));
        } else {
          computeConstructionSpec(shape, point.idx);
        }
      } else if (point.idx >= 2) {
        switch (shape.name) {
          case 'Parallelogram':
          case 'IsoscelesTrapeze':
          case 'CirclePart':
            computeConstructionSpec(shape, point.idx);
        }
      }
      // if (shape.name == 'Trapeze' && point.idx >= 3) {
      //   point.coordinates = projectionOnConstraints(point.coordinates, point.transformConstraints);
      //   computeConstructionSpec(shape);
      // } else if (point.idx >= 2) {
      //   switch (shape.name) {
      //     case 'Rectangle':
      //     case 'Losange':
      //     case 'RightAngleIsoscelesTriangle':
      //     case 'RightAngleTriangle':
      //     case 'IsoscelesTriangle':
      //     case 'RightAngleTrapeze':
      //       point.coordinates = projectionOnConstraints(point.coordinates, point.transformConstraints);
      //     case 'Parallelogram':
      //     case 'IsoscelesTrapeze':
      //     case 'CirclePart':
      //       computeConstructionSpec(shape, point.idx);
      //       break;
      //     default:
      //       break;
      //   }
      // }
      // if (point.idx == 1) {
      //   switch (shape.name) {
      //     case 'CircleArc':
      //     case 'ParalleleSemiStraightLine':
      //     case 'PerpendicularSemiStraightLine':
      //     case 'ParalleleSegment':
      //     case 'PerpendicularSegment':
      //       point.coordinates = projectionOnConstraints(point.coordinates, point.transformConstraints);
      //       computeConstructionSpec(shape);
      //     default:
      //       break;
      //   }
      // }
      this.resetTree();
      console.log(Object.values(this.tree).map(elem => elem.isDone));
      console.log('--- start ---');
      this.browseTree(shape.id, this.tree);
      console.log('---- end ----');
      console.log(Object.values(this.tree).map(elem => elem.isDone));


      // if (shape.name == 'RightAngleTrapeze')
      //   computeConstructionSpec(shape);
    } else if (app.tool.currentStep == 'selectPoint') {
      app.mainCanvasLayer.shapes.filter(s => s.geometryObject.geometryIsVisible !== false && s.geometryObject.geometryIsHidden !== true).forEach((s) => {
        let points = [...s.vertexes, ...s.points.filter(pt => pt.type == 'arcCenter')];
        points.forEach((pt) => {
          const transformConstraints = pt.transformConstraints;
          const colorPicker = {
            [transformConstraints.isFree]: '#0f0',
            [transformConstraints.isBlocked]: '#f00',
            [transformConstraints.isConstructed]: '#f00',
            [transformConstraints.isConstrained]: '#FF8C00',
          };
          const color = colorPicker[true];

          if (color != '#f00' && color != undefined)
            new Point({
              layer: 'upper',
              coordinates: pt.coordinates,
              size: 2,
              color: color,
            });
        });
      });
    }
  }

  adjustPoint(point) {
    let constraints = SelectManager.getEmptySelectionConstraints().points;
    constraints.canSelect = true;
    if (point.shape.name == 'PointOnLine') {
      let segment = findObjectById(point.shape.geometryObject.geometryParentObjectId1);
      constraints.whitelist = [
        { shapeId: segment.shape.id, type: 'divisionPoint', index: segment.idx },
        { shapeId: segment.shape.id, type: 'vertex', index: segment.idx },
        { shapeId: segment.shape.id, type: 'vertex', index: (segment.idx + 1) % segment.shape.segmentIds.length }
      ];
    } else if (point.transformConstraints.isConstrained) {
      return;
    } else {
      constraints.blacklist = this.drawingShapes.map((s) => {
        return { shapeId: addInfoToId(s.id, 'main') };
      });
    }
    let adjustedCoordinates = SelectManager.selectPoint(
      point.coordinates,
      constraints,
      false,
    );
    if (adjustedCoordinates) {
      point.coordinates = new Coordinates(adjustedCoordinates.coordinates);
    } else if (point.shape.name != 'PointOnLine') {
      let gridPoint = app.gridCanvasLayer.getClosestGridPoint(point.coordinates);
      if (gridPoint)
        point.coordinates = new Coordinates(gridPoint.coordinates);
    }
  }

  drawConstraints(point) {
    if (point.transformConstraints.isConstrained) {
      point.transformConstraints.lines.forEach(ln => {
        let segment = ln.segment;
        let shape = new LineShape({
          layer: 'upper',
          path: segment.getSVGPath('no scale', true),
          strokeColor: app.settings.constraintsDrawColor,
          fillOpacity: 0,
          strokeWidth: 2,
        });
        if (ln.isInfinite)
          shape.segments[0].isInfinite = true;
        shape.vertexes.forEach(pt => pt.visible = false);
      });
      point.transformConstraints.points.forEach(pt => {
        new Point({
          layer: 'upper',
          coordinates: pt,
          color: app.settings.constraintsDrawColor,
          size: 2,
        });
      });
      this.constraintsDrawn = true;
    }
  }
}
