import quadrilateres from '@controllers/Core/ShapesKits/quadrilateres.json';
import { helpConfigRegistry } from '../../services/HelpConfigRegistry';
import { app } from '../Core/App';
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

  get selectedTemplate() {
    return app.tool?.selectedTemplate || null;
  }

  async start() {
    helpConfigRegistry.register(this.name, createQuadrilateralHelpConfig);
    await super.start();
  }

  /**
   * Chargement de la définition du quadrilatère sélectionné
   */
  async loadShapeDefinition() {
    const quadrilateralsDef = await import(`./quadrilateralsDef.js`);
    const selectedTemplateName = this.selectedTemplate?.name;
    this.quadrilateralDef = quadrilateralsDef[selectedTemplateName];

    if (!this.quadrilateralDef) {
      throw new Error(
        `Définition non trouvée pour ${selectedTemplateName}`,
      );
    }
  }

  /**
   * Nombre de points requis selon le type de quadrilatère
   */
  numberOfPointsRequired() {
    return this.quadrilateralDef ? this.quadrilateralDef.numberOfPointsRequired : 4;
  }

  /**
   * Obtenir les contraintes pour le point donné
   */
  getConstraints(pointNumber) {
    if (
      this.quadrilateralDef &&
      this.quadrilateralDef.constraints &&
      typeof this.quadrilateralDef.constraints[pointNumber] === 'function'
    ) {
      this.constraints = this.quadrilateralDef.constraints[pointNumber](
        this.points,
        this.segments,
      );
    } else {
      this.constraints = { isFree: true };
    }
  }

  /**
   * Finaliser la forme avant création
   */
  refreshShapePreview() {
    if (
      this.quadrilateralDef &&
      this.numberOfPointsDrawn === this.numberOfPointsRequired() &&
      this.numberOfPointsDrawn < 4
    ) {
      this.quadrilateralDef.finishShape(this.points, this.segments);
    }
  }

  /**
   * Exécution de l'action finale - création du quadrilatère
   */
  async executeAction() {
    if (!this.quadrilateralDef) {
      throw new Error('Définition de quadrilatère manquante');
    }

    const selectedTemplateName = this.selectedTemplate?.name;
    if (!selectedTemplateName) {
      throw new Error('Template quadrilatère non sélectionné');
    }

    let familyName = '4-corner-shape';
    if (selectedTemplateName === 'Square') {
      familyName = 'Regular';
    } else if (selectedTemplateName === 'IrregularQuadrilateral') {
      familyName = 'Irregular';
    }

    // Si on a moins de 4 points dessinés, la définition doit avoir complété les points restants dans points/segments
    // On s'assure d'avoir 4 points pour construire le chemin
    if (this.points.length < 4) {
      throw new Error('Nombre de points insuffisant pour créer un quadrilatère');
    }

    // Construire le chemin SVG
    const path = [
      'M',
      this.points[0].coordinates.x,
      this.points[0].coordinates.y,
      'L',
      this.points[1].coordinates.x,
      this.points[1].coordinates.y,
      'L',
      this.points[2].coordinates.x,
      this.points[2].coordinates.y,
      'L',
      this.points[3].coordinates.x,
      this.points[3].coordinates.y,
      'L',
      this.points[0].coordinates.x,
      this.points[0].coordinates.y,
    ].join(' ');

    // Créer la forme
    const shape = new RegularShape({
      layer: 'main',
      path: path,
      name: selectedTemplateName,
      familyName: familyName,
      fillOpacity: 0,
      geometryObject: new GeometryObject({}),
    });

    // Lier les points ajustés
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
      if (this.points[2]) {
        shape.vertexes[2].adjustedOn = this.points[2].adjustedOn;
        linkNewlyCreatedPoint(shape, shape.vertexes[2]);
      }
    }
    if (
      shape.name === 'RightAngleTrapeze' ||
      shape.name === 'Trapeze' ||
      shape.name === 'IrregularQuadrilateral'
    ) {
      if (this.points[3]) {
        shape.vertexes[3].adjustedOn = this.points[3].adjustedOn;
        linkNewlyCreatedPoint(shape, shape.vertexes[3]);
      }
    }

    // Calculer les spécifications de construction
    computeConstructionSpec(shape);

    return shape;
  }
}
