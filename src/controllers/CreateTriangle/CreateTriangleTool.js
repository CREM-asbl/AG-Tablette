import { helpConfigRegistry } from '../../services/HelpConfigRegistry';
import { app, setState } from '../Core/App';
import { Coordinates } from '../Core/Objects/Coordinates';
import { GeometryObject } from '../Core/Objects/Shapes/GeometryObject';
import { RegularShape } from '../Core/Objects/Shapes/RegularShape';
import triangles from '../Core/ShapesKits/triangles.json';
import { BaseShapeCreationTool } from '../Core/States/BaseShapeCreationTool';
import { linkNewlyCreatedPoint } from '../GeometryTools/general';
import { computeConstructionSpec } from '../GeometryTools/recomputeShape';
import { createTriangleHelpConfig } from './createTriangle.helpConfig';

/**
 * Outil de création de triangles - Refactorisé avec BaseShapeCreationTool
 */
export class CreateTriangleTool extends BaseShapeCreationTool {
  constructor() {
    super('createTriangle', 'Construire un triangle', 'Triangles', triangles);
    this.triangleDef = null;
  }

  /**
   * Démarrage avec enregistrement de l'aide contextuelle
   */
  async start() {
    helpConfigRegistry.register(this.name, createTriangleHelpConfig);
    await super.start();
  }

  /**
   * Chargement de la définition du triangle sélectionné
   */
  async loadShapeDefinition() {
    const triangleDef = await import(`./trianglesDef.js`);
    this.triangleDef = triangleDef[app.tool.selectedTemplate.name];

    if (!this.triangleDef) {
      throw new Error(
        `Définition non trouvée pour ${app.tool.selectedTemplate.name}`,
      );
    }
  }

  /**
   * Nombre de points requis pour la forme
   */
  numberOfPointsRequired() {
    return this.triangleDef.numberOfPointsToRequired;
  }

  /**
   * Obtenir les contraintes pour un point donné
   */
  getConstraints(pointNb) {
    this.constraints = this.triangleDef.constraints[pointNb](
      this.points,
      this.segments,
    );
  }

  /**
   * Mise à jour de l'aperçu de la forme pendant l'animation
   */
  refreshShapePreview() {
    if (
      this.numberOfPointsDrawn === this.numberOfPointsRequired() &&
      this.numberOfPointsDrawn < 3
    ) {
      this.triangleDef.finishShape(this.points, this.segments);
    }
  }

  /**
   * Exécution de l'action finale de création
   */
  async executeAction() {
    this._executeAction();
    window.dispatchEvent(new CustomEvent('refresh'));
    window.dispatchEvent(
      new CustomEvent('actions-executed', { detail: { name: this.title } }),
    );
  }

  _executeAction() {
    let familyName = '3-corner-shape';
    if (app.tool.selectedTemplate.name === 'EquilateralTriangle') {
      familyName = 'Regular';
    } else if (app.tool.selectedTemplate.name === 'IrregularTriangle') {
      familyName = 'Irregular';
    }

    let path = [
      'M',
      this.points[0].coordinates.x,
      this.points[0].coordinates.y,
    ];
    path.push('L', this.points[1].coordinates.x, this.points[1].coordinates.y);
    path.push('L', this.points[2].coordinates.x, this.points[2].coordinates.y);
    path.push('L', this.points[0].coordinates.x, this.points[0].coordinates.y);
    path = path.join(' ');

    const shape = new RegularShape({
      layer: 'main',
      path: path,
      name: app.tool.selectedTemplate.name,
      familyName: familyName,
      fillOpacity: 0,
      geometryObject: new GeometryObject({}),
    });

    shape.vertexes[0].adjustedOn = this.points[0].adjustedOn;
    linkNewlyCreatedPoint(shape, shape.vertexes[0]);
    shape.vertexes[1].adjustedOn = this.points[1].adjustedOn;
    linkNewlyCreatedPoint(shape, shape.vertexes[1]);
    if (
      shape.name === 'RightAngleTriangle' ||
      shape.name === 'IsoscelesTriangle' ||
      shape.name === 'IrregularTriangle'
    ) {
      shape.vertexes[2].adjustedOn = this.points[2].adjustedOn;
      linkNewlyCreatedPoint(shape, shape.vertexes[2]);
    }
    computeConstructionSpec(shape);
  }
}
