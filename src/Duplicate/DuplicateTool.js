import { html } from 'lit';
import { app, setState } from '../Core/App';
import { GroupManager } from '../Core/Managers/GroupManager';
import { SelectManager } from '../Core/Managers/SelectManager';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Coordinates } from '../Core/Objects/Coordinates';
import { Point } from '../Core/Objects/Point';
import { Segment } from '../Core/Objects/Segment';
import { ShapeGroup } from '../Core/Objects/ShapeGroup';
import { GeometryObject } from '../Core/Objects/Shapes/GeometryObject';
import { SinglePointShape } from '../Core/Objects/Shapes/SinglePointShape';
import { Tool } from '../Core/States/Tool';
import { getShapeAdjustment } from '../Core/Tools/automatic_adjustment';
import { computeConstructionSpec } from '../GeometryTools/recomputeShape';

/**
 * Dupliquer une figure
 */
export class DuplicateTool extends Tool {
  constructor() {
    super('duplicate', 'Dupliquer', 'operation');

    this.currentStep = null; // listen-canvas-click -> moving-shape

    //coordonnées de la souris lorsque la duplication a commencé
    this.startClickCoordinates = null;

    /*
        L'ensemble des figures liées à la figure sélectionnée, y compris la figure
        elle-même
         */
    this.involvedShapes = [];

    this.translateOffset = new Coordinates({ x: -20, y: -20 });
  }

  /**
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
    let toolName = this.title;
    return html`
      <h3>${toolName}</h3>
      <p>
        Vous avez sélectionné l'outil <b>"${toolName}"</b>.<br />
        Pour copier une figure, appuyez sur la figure et faites glissez votre
        doigt dans une direction sans le relacher. Relachez ensuite votre doigt
        une fois que la nouvelle figure est à la bonne place.<br /><br />
        <b>Attention:</b> si vous appuyez sur une figure puis relachez
        directement, une copie de la figure aura bien été créée, mais à la même
        position que la figure d'origine. Il y a donc deux figures l'une sur
        l'autre.<br /><br />
        <b>Note:</b> la nouvelle figure créée n'est pas liée d'une manière ou
        d'une autre avec la figure d'origine: il s'agit bien d'une copie
        complètement indépendante.
      </p>
    `;
  }

  start() {
    setTimeout(() => setState({ tool: { ...app.tool, name: this.name, currentStep: 'listen' } }), 50);
  }

  listen() {
    app.upperCanvasLayer.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();

    app.workspace.selectionConstraints =
      app.fastSelectionConstraints.mousedown_all_shape;
    app.workspace.selectionConstraints.shapes.blacklist = app.mainCanvasLayer.shapes.filter(s => s instanceof SinglePointShape && s.name != 'PointOnLine');
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  selectSegment() {
    this.removeListeners();

    let constraints = SelectManager.getEmptySelectionConstraints();
    constraints.segments.canSelect = true;
    constraints.eventType = 'mousedown';
    app.workspace.selectionConstraints = constraints;
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  move() {
    this.removeListeners();

    this.mouseUpId = app.addListener('canvasMouseUp', this.handler);
  }

  end() {
    app.upperCanvasLayer.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();
  }

  objectSelected(object) {
    if (app.tool.currentStep != 'listen' && app.tool.currentStep != 'selectSegment') return;

    if (object instanceof Segment) {
      if (object.isInfinite || object.isSemiInfinite)
        return;
      this.mode = 'point';
      this.segment = object;
      this.executeAction();
      setState({ tool: { ...app.tool, name: this.name, currentStep: 'listen' } });
    } else if (object.name == 'PointOnLine') {
      this.involvedPoint = object;
      new Point({
        coordinates: object.points[0].coordinates,
        layer: 'upper',
        color: app.settings.referenceDrawColor,
        size: 2,
      });
      setState({ tool: {...app.tool, currentStep: 'selectSegment'} });
    } else {
      this.mode = 'shape';
      this.involvedShapes = ShapeManager.getAllBindedShapes(object);
      for (let i = 0; i < this.involvedShapes.length; i++) {
        let currentShape = this.involvedShapes[i];
        if (currentShape.name == 'Vector') {
          window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Les vecteurs ne peuvent pas être dupliqués, mais peuvent être multipliés.' } }));
          return;
        }
      }
      this.startClickCoordinates = app.workspace.lastKnownMouseCoordinates;
      this.lastKnownMouseCoordinates = this.startClickCoordinates;

      // sort shape by height
      this.involvedShapes.sort(
        (s1, s2) =>
          ShapeManager.getShapeIndex(s1) - ShapeManager.getShapeIndex(s2),
      );
      this.drawingShapes = this.involvedShapes.map((s) => {
        let newShape = new s.constructor({
          ...s,
          layer: 'upper',
          path: s.getSVGPath('no scale', false),
          id: undefined,
          // divisionPointInfos: s.divisionPoints.map((dp) => {
          //   return { coordinates: dp.coordinates, ratio: dp.ratio, segmentIdx: dp.segments[0].idx, color: dp.color };
          // }),
          segmentsColor: s.segments.map((seg) => {
            return seg.color;
          }),
          pointsColor: s.points.filter(pt => pt.type != 'divisionPoint').map((pt) => {
            return pt.color;
          }),
        });
        newShape.vertexes.forEach((vx, idx) => vx.visible = s.vertexes[idx].visible);
        newShape.translate(this.translateOffset);
        return newShape;
      });

      setState({ tool: { ...app.tool, currentStep: 'move' } });
      this.animate();
    }
  }

  canvasMouseUp() {
    if (app.tool.currentStep != 'move') return;

    this.translation = app.workspace.lastKnownMouseCoordinates
      .substract(this.startClickCoordinates)
      .add(this.translateOffset);

    this.executeAction();
    setState({ tool: { ...app.tool, name: this.name, currentStep: 'listen' } });
  }

  refreshStateUpper() {
    if (app.tool.currentStep == 'move') {
      let transformation = app.workspace.lastKnownMouseCoordinates.substract(
        this.lastKnownMouseCoordinates,
      );

      this.drawingShapes.forEach((s) => s.translate(transformation));

      this.lastKnownMouseCoordinates = app.workspace.lastKnownMouseCoordinates;
    }
  }

  _executeAction() {
    if (this.mode == 'point') {
      let segment = this.segment;
      let coord;
      let ratio = this.involvedPoint.points[0].ratio;
      if (segment.shape.name == 'Circle') {
        let refShape = segment.shape;
        let angle = refShape.segments[0].arcCenter.coordinates.angleWith(refShape.vertexes[0].coordinates) + ratio * Math.PI * 2;
        coord = refShape.segments[0].arcCenter.coordinates.add({
          x: refShape.segments[0].radius * Math.cos(angle),
          y: refShape.segments[0].radius * Math.sin(angle),
        });
      } else if (segment.isArc()) {
        let firstAngle = segment.arcCenter.coordinates.angleWith(segment.vertexes[0].coordinates);
        let secondAngle = segment.arcCenter.coordinates.angleWith(segment.vertexes[1].coordinates);
        if (secondAngle <= firstAngle) {
          secondAngle += Math.PI * 2;
        }
        let newAngle = firstAngle + ratio * (secondAngle - firstAngle);
        if (segment.counterclockwise) {
          newAngle = firstAngle - ratio * (2 * Math.PI - secondAngle + firstAngle);
        }
        coord = new Coordinates({
          x: segment.arcCenter.coordinates.x + segment.radius * Math.cos(newAngle),
          y: segment.arcCenter.coordinates.y + segment.radius * Math.sin(newAngle),
        });
      } else {
        let firstPoint = segment.vertexes[0];
        let secondPoint = segment.vertexes[1];
        const segLength = secondPoint.coordinates.substract(
          firstPoint.coordinates,
        );
        const part = segLength.multiply(ratio);

        coord = firstPoint.coordinates.add(part);
      }

      let shape = new SinglePointShape({
        layer: 'main',
        path: `M ${coord.x} ${coord.y}`,
        name: 'PointOnLine',
        familyName: 'Point',
        geometryObject: new GeometryObject({
          geometryDuplicateParentShapeId: this.involvedPoint.id,
          geometryParentObjectId1: segment.id,
        }),
      });

      computeConstructionSpec(shape);

      segment.shape.geometryObject.geometryChildShapeIds.push(shape.id);
      this.involvedPoint.geometryObject.geometryDuplicateChildShapeIds.push(shape.id);
    } else {
      let shapesList = [];

      this.involvedShapes.forEach((s) => {
        let newShape = new s.constructor({
          ...s,
          layer: 'main',
          familyName: 'duplicate',
          path: s.getSVGPath('no scale', false),
          id: undefined,
          // divisionPointInfos: s.divisionPoints.map((dp) => {
          //   return { coordinates: dp.coordinates, ratio: dp.ratio, segmentIdx: dp.segments[0].idx, color: dp.color };
          // }),
          segmentsColor: s.segments.map((seg) => {
            return seg.color;
          }),
          pointsColor: s.points.filter(pt => pt.type != 'divisionPoint').map((pt) => {
            return pt.color;
          }),
        });
        newShape.vertexes.forEach((vx, idx) => vx.visible = s.vertexes[idx].visible);
        if (newShape.name.startsWith('Parallele'))
          newShape.name = newShape.name.slice('Parallele'.length);
        if (newShape.name.startsWith('Perpendicular'))
          newShape.name = newShape.name.slice('Perpendicular'.length);
        if (newShape.geometryObject)
          newShape.geometryObject = new GeometryObject({
            geometryDuplicateParentShapeId: s.id
          });
        s.geometryObject.geometryDuplicateChildShapeIds.push(newShape.id);
        shapesList.push(newShape);
        newShape.translate(this.translation);
      });

      let transformation = getShapeAdjustment(shapesList, shapesList[0]);

      shapesList.forEach((newShape) => {
        newShape.rotate(
          transformation.rotationAngle,
          shapesList[0].centerCoordinates,
        );
        newShape.translate(transformation.translation);
      });

      //Si nécessaire, créer le userGroup
      if (shapesList.length > 1) {
        let userGroup = new ShapeGroup(0, 1);
        userGroup.shapesIds = shapesList.map((s) => s.id);
        GroupManager.addGroup(userGroup);
      }
    }
  }
}
