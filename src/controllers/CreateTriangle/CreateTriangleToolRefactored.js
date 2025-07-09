import triangles from '@controllers/Core/ShapesKits/triangles.json';
import { app } from '../Core/App';
import { GeometryObject } from '../Core/Objects/Shapes/GeometryObject';
import { RegularShape } from '../Core/Objects/Shapes/RegularShape';
import { BaseShapeCreationTool } from '../Core/States/BaseShapeCreationTool';
import { linkNewlyCreatedPoint } from '../GeometryTools/general';
import { computeConstructionSpec } from '../GeometryTools/recomputeShape';

/**
 * Outil de création de triangles - Refactorisé avec BaseShapeCreationTool
 */
export class CreateTriangleTool extends BaseShapeCreationTool {
  constructor() {
    super('createTriangle', 'Construire un triangle', 'Triangles', triangles);
    this.triangleDef = null;
  }

  /**
   * Chargement de la définition du triangle sélectionné
   */
  async loadShapeDefinition() {
    const triangleDef = await import(`./trianglesDef.js`);
    this.triangleDef = triangleDef[app.tool.selectedTemplate.name];
    
    if (!this.triangleDef) {
      throw new Error(`Définition non trouvée pour ${app.tool.selectedTemplate.name}`);
    }
  }

  /**
   * Nombre de points requis selon le type de triangle
   */
  numberOfPointsRequired() {
    return this.triangleDef ? this.triangleDef.numberOfPointsRequired : 3;
  }

  /**
   * Obtenir les contraintes pour le point donné
   */
  getConstraints(pointNumber) {
    if (this.triangleDef && this.triangleDef.constraints) {
      this.constraints = this.triangleDef.constraints[pointNumber](this.points, this.segments);
    } else {
      this.constraints = { isFree: true };
    }
  }

  /**
   * Finaliser la forme avant création
   */
  finishShape() {
    if (this.triangleDef && this.triangleDef.finishShape) {
      this.triangleDef.finishShape(this.points, this.segments);
    }
  }

  /**
   * Mise à jour de l'aperçu pendant le dessin
   */
  refreshShapePreview() {
    if (this.numberOfPointsDrawn === this.numberOfPointsRequired() && this.numberOfPointsDrawn < 3) {
      this.finishShape();
    }
  }

  /**
   * Exécution de l'action finale - création du triangle
   */
  async executeAction() {
    if (!this.triangleDef) {
      throw new Error('Définition de triangle manquante');
    }

    let familyName = '3-corner-shape';
    if (app.tool.selectedTemplate.name === 'EquilateralTriangle') {
      familyName = 'Regular';
    } else if (app.tool.selectedTemplate.name === 'IrregularTriangle') {
      familyName = 'Irregular';
    }

    // Construire le chemin SVG
    const path = [
      'M', this.points[0].coordinates.x, this.points[0].coordinates.y,
      'L', this.points[1].coordinates.x, this.points[1].coordinates.y,
      'L', this.points[2].coordinates.x, this.points[2].coordinates.y,
      'L', this.points[0].coordinates.x, this.points[0].coordinates.y
    ].join(' ');

    // Créer la forme
    const shape = new RegularShape({
      layer: 'main',
      path: path,
      name: app.tool.selectedTemplate.name,
      familyName: familyName,
      fillOpacity: 0,
      geometryObject: new GeometryObject({}),
    });

    // Lier les points ajustés
    shape.vertexes.forEach((vertex, idx) => {
      if (this.points[idx]) {
        vertex.adjustedOn = this.points[idx].adjustedOn;
        linkNewlyCreatedPoint(shape, vertex);
      }
    });

    // Calculer les spécifications de construction
    computeConstructionSpec(shape);

    return shape;
  }
}
