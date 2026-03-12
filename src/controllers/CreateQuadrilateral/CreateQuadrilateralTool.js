import quadrilateres from '@controllers/Core/ShapesKits/quadrilateres.json';
import { helpConfigRegistry } from '../../services/HelpConfigRegistry';
import { app, setState } from '../Core/App';
import { Coordinates } from '../Core/Objects/Coordinates';
import { GeometryObject } from '../Core/Objects/Shapes/GeometryObject';
import { RegularShape } from '../Core/Objects/Shapes/RegularShape';
import { BaseShapeCreationTool } from '../Core/States/BaseShapeCreationTool';
import { linkNewlyCreatedPoint } from '../GeometryTools/general';
import { computeConstructionSpec } from '../GeometryTools/recomputeShape';
import { createQuadrilateralHelpConfig } from './createQuadrilateral.helpConfig';

/**
 * Outil de création de quadrilatères - Refactorisé avec BaseShapeCreationTool
 */
export class CreateQuadrilateralTool extends BaseShapeCreationTool {
  constructor() {
    super(
      'createQuadrilateral',
      'Construire un quadrilatère',
      'Quadrilatères',
      quadrilateres,
    );
    this.quadrilateralDef = null;
  }

  /**
   * Démarrage avec enregistrement de l'aide contextuelle
   */
  async start() {
    helpConfigRegistry.register(this.name, createQuadrilateralHelpConfig);
    await super.start();
  }

  /**
   * Chargement de la définition du quadrilatère sélectionné
   */
  async loadShapeDefinition() {
    const quadrilateralsDef = await import(`./quadrilateralsDef.js`);
    this.quadrilateralDef = quadrilateralsDef[app.tool.selectedTemplate.name];

    if (!this.quadrilateralDef) {
      throw new Error(
        `Définition non trouvée pour ${app.tool.selectedTemplate.name}`,
      );
    }
  }

  /**
   * Nombre de points requis pour la forme
   */
  numberOfPointsRequired() {
    return this.quadrilateralDef.numberOfPointsRequired;
  }

  /**
   * Obtenir les contraintes pour un point donné
   */
  getConstraints(pointNb) {
    this.constraints = this.quadrilateralDef.constraints[pointNb](
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
      this.numberOfPointsDrawn < 4
    ) {
      this.quadrilateralDef.finishShape(this.points, this.segments);
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
    let familyName = '4-corner-shape';
    if (app.tool.selectedTemplate.name === 'Square') {
      familyName = 'Regular';
    } else if (app.tool.selectedTemplate.name === 'IrregularQuadrilateral') {
      familyName = 'Irregular';
    }

    let path = [
      'M',
      this.points[0].coordinates.x,
      this.points[0].coordinates.y,
    ];
    path.push('L', this.points[1].coordinates.x, this.points[1].coordinates.y);
    path.push('L', this.points[2].coordinates.x, this.points[2].coordinates.y);
    path.push('L', this.points[3].coordinates.x, this.points[3].coordinates.y);
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
      shape.name === 'Rectangle' ||
      shape.name === 'Losange' ||
      shape.name === 'Parallelogram' ||
      shape.name === 'RightAngleTrapeze' ||
      shape.name === 'IsoscelesTrapeze' ||
      shape.name === 'Trapeze' ||
      shape.name === 'IrregularQuadrilateral'
    ) {
      shape.vertexes[2].adjustedOn = this.points[2].adjustedOn;
      linkNewlyCreatedPoint(shape, shape.vertexes[2]);
    }
    if (
      shape.name === 'RightAngleTrapeze' ||
      shape.name === 'Trapeze' ||
      shape.name === 'IrregularQuadrilateral'
    ) {
      shape.vertexes[3].adjustedOn = this.points[3].adjustedOn;
      linkNewlyCreatedPoint(shape, shape.vertexes[3]);
    }
    computeConstructionSpec(shape);
  }
}
