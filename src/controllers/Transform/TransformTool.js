import { html } from 'lit';
import { app, setState } from '../Core/App';
import { SelectManager } from '../Core/Managers/SelectManager';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Coordinates } from '../Core/Objects/Coordinates';
import { Point } from '../Core/Objects/Point';
import { GeometryObject } from '../Core/Objects/Shapes/GeometryObject';
import { LineShape } from '../Core/Objects/Shapes/LineShape';
import { Tool } from '../Core/States/Tool';
import { addInfoToId, findObjectById } from '../Core/Tools/general';
import { duplicateShape } from '../Core/Tools/shapesTools';
import {
  computeConstructionSpec,
  computeShapeTransform,
  getRatioWithPosition,
  projectionOnConstraints,
  recomputeAllVisibilities,
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
    const toolName = this.title;
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

    setTimeout(
      () =>
        setState({
          tool: { ...app.tool, name: this.name, currentStep: 'selectPoint' },
        }),
      50,
    );
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
        const reference = findObjectById(points[i].reference);
        if (reference instanceof Point) {
          points[i] = findObjectById(points[i].reference);
          i--;
          continue;
        }
      }
      points[i].computeTransformConstraint();
    }
    points = points.filter(
      (point) =>
        (point.transformConstraints.isFree ||
          point.transformConstraints.isConstrained) &&
        !point.transformConstraints.isBlocked &&
        !point.transformConstraints.isConstructed,
    );

    if (points.length === 0) return;

    let point = points.find(
      (point) => point.transformConstraints.isConstrained,
    );
    if (!point) point = points[0];

    this.constraints = point.transformConstraints;

    app.upperCanvasLayer.removeAllObjects();

    if (!this.constraintsDrawn) this.drawConstraints(point);

    this.pointSelectedId = point.id;

    const startShapeId = point.shape.id;
    this.tree = {
      [startShapeId]: {
        parents: [],
        children: [],
        isDone: 0,
      },
    };
    this.createTree(0, this.tree);
    const involvedShapeIds = Object.keys(this.tree);
    const involvedShapes = involvedShapeIds.map((shapeId) =>
      findObjectById(shapeId),
    );

    involvedShapeIds.forEach((oldKey) => {
      const newKey = addInfoToId(oldKey, 'upper');
      delete Object.assign(this.tree, { [newKey]: this.tree[oldKey] })[oldKey];
      for (let i = 0; i < this.tree[newKey].parents.length; i++) {
        this.tree[newKey].parents[i] = addInfoToId(
          this.tree[newKey].parents[i],
          'upper',
        );
      }
      for (let i = 0; i < this.tree[newKey].children.length; i++) {
        this.tree[newKey].children[i] = addInfoToId(
          this.tree[newKey].children[i],
          'upper',
        );
      }
    });

    involvedShapes.sort((s1, s2) => {
      return ShapeManager.getShapeIndex(s1) - ShapeManager.getShapeIndex(s2);
    });
    this.drawingShapes = involvedShapes.map((s) => duplicateShape(s));
    this.drawingShapes.forEach((s) => {
      if (!findObjectById(s.geometryObject.geometryParentObjectId1)) {
        s.geometryObject.geometryParentObjectId1 = addInfoToId(
          s.geometryObject.geometryParentObjectId1,
          'main',
        );
      }
      if (!findObjectById(s.geometryObject.geometryParentObjectId2)) {
        s.geometryObject.geometryParentObjectId2 = addInfoToId(
          s.geometryObject.geometryParentObjectId2,
          'main',
        );
      }
      if (
        !findObjectById(s.geometryObject.geometryTransformationParentShapeId)
      ) {
        s.geometryObject.geometryTransformationParentShapeId = addInfoToId(
          s.geometryObject.geometryTransformationParentShapeId,
          'main',
        );
      }
      const characteristicElements =
        s.geometryObject.geometryTransformationCharacteristicElements;
      if (characteristicElements && characteristicElements.elementIds) {
        characteristicElements.elementIds =
          characteristicElements.elementIds.map((elId) => {
            if (!findObjectById(elId)) {
              return addInfoToId(elId, 'main');
            }
            return elId;
          });
      }
      if (!findObjectById(s.geometryObject.geometryDuplicateParentShapeId)) {
        s.geometryObject.geometryDuplicateParentShapeId = addInfoToId(
          s.geometryObject.geometryDuplicateParentShapeId,
          'main',
        );
      }
      if (!findObjectById(s.geometryObject.geometryMultipliedParentShapeId)) {
        s.geometryObject.geometryMultipliedParentShapeId = addInfoToId(
          s.geometryObject.geometryMultipliedParentShapeId,
          'main',
        );
      }
    });

    app.mainCanvasLayer.editingShapeIds = involvedShapes.map((s) => s.id);

    if (point.shape.name === 'PointOnLine') {
      let constraintSegment = findObjectById(
        addInfoToId(
          point.shape.geometryObject.geometryParentObjectId1,
          'upper',
        ),
      );
      if (!constraintSegment) {
        constraintSegment = findObjectById(
          point.shape.geometryObject.geometryParentObjectId1,
        );
      }

      new LineShape({
        layer: 'upper',
        path: constraintSegment.getSVGPath('no scale', true),
        id: undefined,
        isPointed: false,
        strokeWidth: 2,
        strokeColor: app.settings.constraintsDrawColor,
        geometryObject: new GeometryObject({}),
      });
    }

    app.upperCanvasLayer.shapes.forEach((s) => {
      s.geometryObject?.geometryDuplicateChildShapeIds.forEach(
        (duplicateChildId) => {
          const duplicateChild = findObjectById(duplicateChildId);
          computeConstructionSpec(duplicateChild);
        },
      );
      s.geometryObject?.geometryMultipliedChildShapeIds.forEach(
        (multipliedChildId) => {
          const multipliedChild = findObjectById(multipliedChildId);
          computeConstructionSpec(multipliedChild);
        },
      );
    });

    setState({
      tool: { ...app.tool, name: this.name, currentStep: 'transform' },
    });
  }

  createTree(index, tree) {
    const currentEntries = Object.entries(tree);
    if (currentEntries.length === index) return;
    const currentShapeId = currentEntries[index][0];
    const currentShape = findObjectById(currentShapeId);
    const dependenciesIds = [
      ...currentShape.geometryObject.geometryChildShapeIds,
      ...currentShape.geometryObject.geometryTransformationChildShapeIds,
      ...currentShape.geometryObject.geometryDuplicateChildShapeIds,
      ...currentShape.geometryObject.geometryMultipliedChildShapeIds,
    ];
    dependenciesIds.sort((dp1, dp2) => {
      if (findObjectById(dp1).geometryObject.geometryIsConstaintDraw) {
        return -1;
      } else if (findObjectById(dp2).geometryObject.geometryIsConstaintDraw) {
        return 1;
      }
    });
    dependenciesIds.forEach((dependenciesId) => {
      if (tree[dependenciesId])
        tree[dependenciesId].parents.push(currentShapeId);
      else
        tree[dependenciesId] = {
          isDone: 0,
          parents: [currentShapeId],
          children: [],
        };
    });
    tree[currentShapeId].children = dependenciesIds;
    this.createTree(index + 1, tree);
  }

  resetTree() {
    for (const elem in this.tree) {
      this.tree[elem].isDone = 0;
    }
  }

  browseTree(tree, callNumber) {
    if (callNumber === 100) {
      console.error('too much call on browsetree');
      return;
    }
    let elementDone = 0,
      treeLength = 0;
    for (const currentShapeId in tree) {
      if (tree[currentShapeId].isDone === 0) {
        if (
          tree[currentShapeId].parents.every((parentId) => {
            if (tree[parentId].isDone > 0) {
              return true;
            }
            const parent = findObjectById(parentId);
            if (
              parent.name === 'PointOnLine' ||
              parent.name === 'PointOnIntersection2'
            ) {
              const constraint = findObjectById(
                parent.geometryObject.geometryParentObjectId1,
              );
              if (constraint.shape.geometryObject.geometryIsConstaintDraw)
                return true;
              else return false;
            } else {
              return false;
            }
          })
        ) {
          const currentShape = findObjectById(currentShapeId);
          computeShapeTransform(currentShape);
          currentShape.geometryObject.geometryChildShapeIds
            .map((childId) => findObjectById(childId))
            .filter((child) => child.geometryObject.geometryIsConstaintDraw)
            .forEach((constraint) => {
              computeShapeTransform(constraint);
              tree[constraint.id].isDone++;
              constraint.geometryObject.geometryChildShapeIds
                .map((childId) => findObjectById(childId))
                .filter(
                  (child) =>
                    child.name === 'PointOnLine' ||
                    child.name === 'PointOnIntersection2',
                )
                .forEach((pointOnLine) => {
                  computeShapeTransform(pointOnLine);
                  tree[pointOnLine.id].isDone++;
                });
            });
          computeShapeTransform(currentShape);
          tree[currentShapeId].isDone++;
        }
      } else {
        elementDone++;
      }
      treeLength++;
    }
    if (elementDone === treeLength) {
      return;
    }
    this.browseTree(tree, callNumber + 1);
  }

  canvasMouseUp() {
    this.stopAnimation();
    this.executeAction();
    setState({
      tool: { ...app.tool, name: this.name, currentStep: 'selectPoint' },
    });
  }

  _executeAction() {
    app.mainCanvasLayer.editingShapeIds.forEach((sId, idxS) => {
      const s = findObjectById(sId);
      s.points.forEach((pt, idxPt) => {
        pt.coordinates = new Coordinates(
          this.drawingShapes[idxS].points[idxPt].coordinates,
        );
        pt.ratio = this.drawingShapes[idxS].points[idxPt].ratio;
      });
      s.geometryObject.geometryIsVisibleByChoice =
        this.drawingShapes[idxS].geometryObject.geometryIsVisibleByChoice;
      computeConstructionSpec(s);
    });
    recomputeAllVisibilities('main');
  }

  refreshStateUpper() {
    if (app.tool.currentStep === 'transform') {
      const point = findObjectById(addInfoToId(this.pointSelectedId, 'upper'));
      const shape = point.shape;
      if (shape.name === 'Trapeze' && point.idx < 3) {
        computeConstructionSpec(shape);
      } else if (point.idx < 2 || point.type === 'arcCenter') {
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
      if (point.idx === 0 || point.type === 'arcCenter') {
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
      this.adjustPoint(point);
      if (shape.name === 'PointOnLine') {
        const reference = findObjectById(
          shape.geometryObject.geometryParentObjectId1,
        );
        point.coordinates = reference.projectionOnSegment(point.coordinates);
        computeConstructionSpec(shape);
      } else if (point.transformConstraints.isConstrained) {
        point.coordinates = projectionOnConstraints(
          point.coordinates,
          point.transformConstraints,
        );
        if (point.reference) {
          point.ratio = getRatioWithPosition(
            point,
            findObjectById(point.reference),
          );
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

      this.resetTree();
      this.browseTree(this.tree, 0);

      this.resetTree();
      this.browseTree(this.tree, 0);
    } else if (app.tool.currentStep === 'selectPoint') {
      app.mainCanvasLayer.shapes.forEach((s) => {
        s.vertexes.forEach((pt) => {
          pt.computeTransformConstraint();
        });
        s.points
          .filter((pt) => pt.type === 'arcCenter')
          .forEach((pt) => {
            pt.computeTransformConstraint();
          });
      });

      app.mainCanvasLayer.shapes
        .filter(
          (s) =>
            s.geometryObject.geometryIsVisible !== false &&
            s.geometryObject.geometryIsHidden !== true,
        )
        .forEach((s) => {
          const points = [
            ...s.vertexes,
            ...s.points.filter((pt) => pt.type === 'arcCenter'),
          ];
          points.forEach((pt) => {
            const transformConstraints = pt.transformConstraints;
            const colorPicker = {
              [transformConstraints.isFree]: '#0f0',
              [transformConstraints.isBlocked]: '#f00',
              [transformConstraints.isConstructed]: '#f00',
              [transformConstraints.isConstrained]: '#FF8C00',
            };
            const color = colorPicker[true];

            if (color !== '#f00' && color !== undefined) {
              new Point({
                layer: 'upper',
                coordinates: pt.coordinates,
                size: 2,
                color: color,
              });
            }
          });
        });
    }
  }

  adjustPoint(point) {
    const constraints = SelectManager.getEmptySelectionConstraints().points;
    constraints.canSelect = true;
    if (point.shape.name === 'PointOnLine') {
      const segment = findObjectById(
        point.shape.geometryObject.geometryParentObjectId1,
      );
      constraints.whitelist = [
        {
          shapeId: segment.shape.id,
          type: 'divisionPoint',
          index: segment.idx,
        },
        { shapeId: segment.shape.id, type: 'vertex', index: segment.idx },
        {
          shapeId: segment.shape.id,
          type: 'vertex',
          index: (segment.idx + 1) % segment.shape.segmentIds.length,
        },
      ];
    } else if (point.transformConstraints.isConstrained) {
      return;
    } else {
      constraints.blacklist = this.drawingShapes.map((s) => {
        return { shapeId: addInfoToId(s.id, 'main') };
      });
    }
    const adjustedCoordinates = SelectManager.selectPoint(
      point.coordinates,
      constraints,
      false,
    );
    if (adjustedCoordinates) {
      point.coordinates = new Coordinates(adjustedCoordinates.coordinates);
    } else if (point.shape.name !== 'PointOnLine') {
      const gridPointInCanvasSpace = app.gridCanvasLayer.getClosestGridPoint(
        point.coordinates.toCanvasCoordinates(),
      );
      if (gridPointInCanvasSpace) {
        const gridPointInWorldSpace =
          gridPointInCanvasSpace.fromCanvasCoordinates();
        point.coordinates = new Coordinates(gridPointInWorldSpace);
      }
    }
  }

  drawConstraints(point) {
    if (point.transformConstraints.isConstrained) {
      point.transformConstraints.lines.forEach((ln) => {
        const segment = ln.segment;
        const shape = new LineShape({
          layer: 'upper',
          path: segment.getSVGPath('no scale', true),
          strokeColor: app.settings.constraintsDrawColor,
          fillOpacity: 0,
          strokeWidth: 2,
        });
        if (ln.isInfinite) shape.segments[0].isInfinite = true;
        shape.vertexes.forEach((pt) => (pt.visible = false));
      });
      point.transformConstraints.points.forEach((pt) => {
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
