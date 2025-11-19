import { html } from 'lit';
import { appActions } from '../../../store/appState';
import { app } from '../../Core/App';
import { SelectManager } from '../../Core/Managers/SelectManager';
import { Coordinates } from '../../Core/Objects/Coordinates';
import { Point } from '../../Core/Objects/Point';
import { Segment } from '../../Core/Objects/Segment';
import { BaseGeometryTool } from '../../Core/States/BaseGeometryTool';
import { findObjectsByName, removeObjectById } from '../../Core/Tools/general';

/**
 * Classe de base pour tous les outils de création de formes géométriques
 * Factorise le code commun entre CreateTriangle, CreateQuadrilateral, CreateCircle, etc.
 */
export class BaseShapeCreationTool extends BaseGeometryTool {
  constructor(name, title, familyName, templatesImport) {
    super(name, title, 'geometryCreator');

    this.familyName = familyName;
    this.templatesImport = templatesImport;
    this.selectedTemplate = null;
    this.shapeDefinition = null;
  }

  /**
   * Aide standardisée pour tous les outils de création
   */
  getHelpText() {
    return html`
      <h3>${this.title}</h3>
      <p>Vous avez sélectionné l'outil <b>"${this.title}"</b>.</p>
    `;
  }

  /**
   * Démarrage standardisé avec sélecteur de forme
   */
  async start() {
    if (!this.validateInput('start')) return;

    this.standardStart();

    try {
      // Charger dynamiquement le composant shape-selector
      await import('@components/shape-selector');

      // Utiliser le signal pour afficher le sélecteur de forme
      appActions.setToolUiState({
        name: 'shape-selector',
        family: this.familyName,
        templatesNames: this.templatesImport,
        selectedTemplate: app.tool.selectedTemplate,
        type: 'Geometry',
        nextStep: 'drawFirstPoint',
      });
    } catch (error) {
      console.error('Erreur lors du chargement du sélecteur de forme:', error);
      this.showErrorNotification('Erreur lors du chargement des templates');
    }
  }

  /**
   * Initialisation du premier point (commune à tous les outils)
   */
  async drawFirstPoint() {
    if (!this.validateInput('drawFirstPoint')) return;

    app.upperCanvasLayer.removeAllObjects();

    try {
      // Charger la définition de la forme sélectionnée
      await this.loadShapeDefinition();

      this.resetDrawingState();
      appActions.setToolState({ currentStep: 'drawPoint' });
      appActions.setCurrentStep('drawPoint');
    } catch (error) {
      console.error('Erreur lors du chargement de la définition:', error);
      this.showErrorNotification("Erreur lors de l'initialisation");
    }
  }

  /**
   * Méthode abstraite pour charger la définition de forme spécifique
   * À surcharger dans les classes filles
   */
  async loadShapeDefinition() {
    throw new Error(
      'loadShapeDefinition doit être implémentée dans la classe fille',
    );
  }

  /**
   * Réinitialisation de l'état de dessin
   */
  resetDrawingState() {
    this.points = [];
    this.segments = [];
    this.numberOfPointsDrawn = 0;
  }

  /**
   * Gestion standardisée du drawing point
   */
  drawPoint() {
    if (!this.validateInput('drawPoint')) return;

    this.removeListeners();
    this.stopAnimation();

    this.getConstraints(this.numberOfPointsDrawn);
    this.mouseDownId = app.addListener('canvasMouseDown', this.handler);
  }

  /**
   * Animation standardisée du point
   */
  animatePoint() {
    this.removeListeners();
    this.animate();

    // Masquer les contraintes pendant l'animation
    findObjectsByName('constraints', 'upper').forEach((s) => {
      if (s.geometryObject) {
        s.geometryObject.geometryIsVisible = false;
      }
    });

    this.mouseUpId = app.addListener('canvasMouseUp', this.handler);
  }

  /**
   * Gestion standardisée du mouseDown
   */
  canvasMouseDown() {
    const newCoordinates = this.getValidMouseCoordinates();
    if (!newCoordinates) return;

    // Vérifier les contraintes si applicables
    if (this.constraints && this.constraints.type === 'isConstrained') {
      if (!this.constraints.projectionOnConstraints(newCoordinates, true)) {
        appActions.addNotification({
          message: 'Veuillez placer le point sur la contrainte.',
          type: 'info',
        });
        return;
      }
    }

    this.addPointToShape(newCoordinates);
    this.updateShapePreview();
    appActions.setToolState({ currentStep: 'animatePoint' });
    appActions.setCurrentStep('animatePoint');
  }

  /**
   * Ajouter un point à la forme en cours de création
   */
  addPointToShape(coordinates) {
    const point = new Point({
      layer: 'upper',
      coordinates: coordinates,
      color: app.settings.temporaryDrawColor,
      size: 2,
    });

    this.points[this.numberOfPointsDrawn] = point;
    this.numberOfPointsDrawn++;

    // Ajouter un segment si ce n'est pas le premier point
    if (this.numberOfPointsDrawn > 1) {
      const segment = new Segment({
        layer: 'upper',
        vertexIds: [
          this.points[this.numberOfPointsDrawn - 2].id,
          this.points[this.numberOfPointsDrawn - 1].id,
        ],
      });
      this.segments.push(segment);
    }
  }

  /**
   * Mise à jour de l'aperçu de la forme
   * À surcharger dans les classes filles si nécessaire
   */
  updateShapePreview() {
    // Implémentation par défaut - peut être surchargée
  }

  /**
   * Gestion standardisée du mouseUp
   */
  canvasMouseUp() {
    // Vérifier les points trop proches (magnétisme)
    if (this.checkPointMagnetism()) return;

    if (this.numberOfPointsDrawn === this.numberOfPointsRequired()) {
      this.completeShape();
    } else {
      this.continueDrawing();
    }
  }

  /**
   * Vérifier si le dernier point est trop proche d'un point existant
   */
  checkPointMagnetism() {
    for (let i = 0; i < this.numberOfPointsDrawn - 1; i++) {
      if (
        SelectManager.areCoordinatesInMagnetismDistance(
          this.points[i].coordinates,
          this.points[this.numberOfPointsDrawn - 1].coordinates,
        )
      ) {
        this.handleMagnetismCollision(i);
        return true;
      }
    }
    return false;
  }

  /**
   * Gérer la collision par magnétisme
   */
  handleMagnetismCollision(collisionIndex) {
    appActions.addNotification({
      message: 'Veuillez placer le point autre part.',
      type: 'info',
    });
    this.rollbackLastPoint();
    appActions.setToolState({ currentStep: 'drawPoint' });
    appActions.setCurrentStep('drawPoint');
  }

  /**
   * Annuler le dernier point ajouté
   */
  rollbackLastPoint() {
    if (this.numberOfPointsDrawn > 0) {
      this.numberOfPointsDrawn--;
      this.points.pop();
      if (this.segments.length > 0) {
        this.segments.pop();
      }
      this.refreshShapePreview();
    }
  }

  /**
   * Continuer le dessin après un point
   */
  continueDrawing() {
    this.getConstraints(this.numberOfPointsDrawn);
    appActions.setToolState({ currentStep: 'drawPoint' });
    appActions.setCurrentStep('drawPoint');
  }

  /**
   * Terminer la forme
   */
  completeShape() {
    this.stopAnimation();

    this.safeExecuteAction(async () => {
      await this.executeAction();
      appActions.setToolState({ currentStep: 'drawFirstPoint' });
      appActions.setCurrentStep('drawFirstPoint');
    }, 'création de forme');
  }

  /**
   * Ajustement standardisé des points
   */
  adjustPoint(point) {
    if (!this.validateInput('adjustPoint', { point })) return;

    point.adjustedOn = undefined;

    if (this.constraints && this.constraints.isFree) {
      this.adjustPointFree(point);
    } else if (this.constraints) {
      this.adjustPointConstrained(point);
    }
  }

  /**
   * Ajustement libre (magnétisme avec grille/points/segments)
   */
  adjustPointFree(point) {
    // Tentative d'ajustement sur un point existant
    let constraints = SelectManager.getEmptySelectionConstraints().points;
    constraints.canSelect = true;

    const adjustedPoint = SelectManager.selectPoint(
      point.coordinates,
      constraints,
      false,
    );
    if (adjustedPoint) {
      point.coordinates = new Coordinates(adjustedPoint.coordinates);
      point.adjustedOn = adjustedPoint;
      return;
    }

    // Tentative d'ajustement sur la grille
    if (app.gridCanvasLayer) {
      const gridPoint = app.gridCanvasLayer.getClosestGridPoint(
        point.coordinates.toCanvasCoordinates(),
      );
      if (gridPoint) {
        const gridPointInWorldSpace = gridPoint.fromCanvasCoordinates();
        point.coordinates = new Coordinates(gridPointInWorldSpace);
        point.adjustedOn = gridPointInWorldSpace;
        return;
      }
    }

    // Tentative d'ajustement sur un segment
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

  /**
   * Ajustement contraint
   */
  adjustPointConstrained(point) {
    let adjustedCoordinates = this.constraints.projectionOnConstraints(
      point.coordinates,
    );

    // Chercher des intersections avec d'autres segments
    const constraints = SelectManager.getEmptySelectionConstraints().segments;
    constraints.canSelect = true;
    constraints.numberOfObjects = 'allInDistance';

    const adjustedSegments = SelectManager.selectSegment(
      adjustedCoordinates,
      constraints,
    );

    if (adjustedSegments && this.constraints.segments) {
      const adjustedSegment = adjustedSegments
        .filter((seg) => !seg.isParalleleWith(this.constraints.segments[0]))
        .sort((seg1, seg2) => {
          const dist1 = seg1
            .projectionOnSegment(adjustedCoordinates)
            .dist(adjustedCoordinates);
          const dist2 = seg2
            .projectionOnSegment(adjustedCoordinates)
            .dist(adjustedCoordinates);
          return dist1 - dist2;
        })[0];

      if (adjustedSegment) {
        const intersections = adjustedSegment.intersectionWith(
          this.constraints.segments[0],
        );
        if (intersections && intersections.length > 0) {
          adjustedCoordinates = intersections.sort(
            (i1, i2) =>
              i1.dist(adjustedCoordinates) - i2.dist(adjustedCoordinates),
          )[0];
          point.adjustedOn = adjustedSegment;
        }
      }
    }

    point.coordinates = new Coordinates(adjustedCoordinates);
  }

  /**
   * Rafraîchissement de l'état supérieur
   */
  refreshStateUpper() {
    if (
      app.tool.currentStep === 'animatePoint' &&
      this.numberOfPointsDrawn > 0
    ) {
      const lastPoint = this.points[this.numberOfPointsDrawn - 1];
      const newCoordinates = this.getValidMouseCoordinates();

      if (newCoordinates && lastPoint) {
        lastPoint.coordinates = newCoordinates;
        this.adjustPoint(lastPoint);
        this.refreshShapePreview();
      }
    }
  }

  /**
   * Rafraîchir l'aperçu de la forme - à surcharger si nécessaire
   */
  refreshShapePreview() {
    // Implémentation par défaut vide
  }

  /**
   * Obtenir les contraintes pour un point donné
   * À implémenter dans les classes filles
   */
  getConstraints(pointNumber) {
    // Implémentation par défaut - pas de contraintes
    this.constraints = { isFree: true };
  }

  /**
   * Nombre de points requis pour la forme
   * À implémenter dans les classes filles
   */
  numberOfPointsRequired() {
    throw new Error(
      'numberOfPointsRequired doit être implémentée dans la classe fille',
    );
  }

  /**
   * Exécution de l'action finale
   * À implémenter dans les classes filles
   */
  async executeAction() {
    throw new Error('executeAction doit être implémentée dans la classe fille');
  }
}
