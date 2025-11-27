import { html } from 'lit';
import { getFamily } from '../../store/kit';
import { app, setState } from '../Core/App';
import { appActions } from '../../store/appState';
import { Coordinates } from '../Core/Objects/Coordinates';
import { CubeShape } from '../Core/Objects/Shapes/CubeShape';
import { LineShape } from '../Core/Objects/Shapes/LineShape';
import { RegularShape } from '../Core/Objects/Shapes/RegularShape';
import { Tool } from '../Core/States/Tool';
import { getShapeAdjustment } from '../Core/Tools/automatic_adjustment';

/**
 * Ajout de figures sur l'espace de travail
 */
export class CreateTool extends Tool {
  constructor() {
    super('create', 'Ajouter une figure');

    // start -> listen -> move
    this.currentStep = null;

    this.selectedFamily = null;

    this.selectedTemplate = null;

    this.shapeToCreate = null;
  }

  /**
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
    const toolName = this.title;
    return html`
      <h3>${toolName}</h3>
      <p>
        Vous avez sélectionné l'outil <b>"${toolName}"</b>.<br />
        Après avoir sélectionné une famille de figures dans le menu, vous devez
        appuyer sur une des figures dans le menu qui apparaît en bas de l'écran.
        Appuyez ensuite sur l'écran pour ajouter une figure.<br /><br />
        <b>Note:</b> vous pouvez appuyer sur l'écran puis bouger votre doigt
        sans le relacher, pour positionner plus précisément la nouvelle figure.
      </p>
    `;
  }

  /**
   * (ré-)initialiser l'état
   * @param  {String} family Nom de la famille sélectionnée
   */
  start() {
    // S'assurer que l'outil précédent soit complètement arrêté
    app.upperCanvasLayer.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();

    // Laisser le temps à l'ancien outil de se terminer proprement
    setTimeout(() => {
      this.openShapeList();
    }, 100);
  }

  listen() {
    // Vérifier que l'outil actif est bien 'create'
    if (app.tool.name !== 'create') {
      console.warn(
        "CreateTool.listen() appelé mais l'outil actif n'est pas create:",
        app.tool.name,
      );
      return;
    }

    // Nettoyer agressivement les contours de groupes
    app.upperCanvasLayer.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();
    this.mouseDownId = app.addListener('canvasMouseDown', this.handler);

    // S'assurer qu'on nettoie à nouveau après un petit délai au cas où quelque chose redessinerait
    setTimeout(() => {
      if (app.tool.name === 'create') {
        app.upperCanvasLayer.removeAllObjects();
      }
    }, 100);
  }

  move() {
    // S'assurer que les contours de groupes sont supprimés pendant le déplacement
    this.removeListeners();
    this.mouseUpId = app.addListener('canvasMouseUp', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    this.shapesList = null;
    app.upperCanvasLayer.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();
  }

  openShapeList() {
    // Nettoyer les contours de groupes résiduels
    app.upperCanvasLayer.removeAllObjects();

    // Force reset de l'état de l'outil pour s'assurer qu'aucun ancien outil n'est actif
    if (app.tool.name !== 'create') {
      setState({ tool: { name: 'create', currentStep: 'start' } });
      return;
    }

    const shapeTemplates = getFamily(app.tool.selectedFamily).shapeTemplates;
    if (shapeTemplates.length === 1) {
      const selectedTemplate = shapeTemplates[0];
      setState({
        tool: { ...app.tool, currentStep: 'listen', selectedTemplate },
      });
    } else if (!this.shapesList) {
      import('../../components/shape-selector');
      appActions.setToolUiState({
        name: 'shape-selector',
        family: app.tool.selectedFamily,
        templatesNames: getFamily(app.tool.selectedFamily).shapeTemplates,
        selectedTemplate: app.tool.selectedTemplate,
        type: 'Create',
        nextStep: 'listen',
      });
    }
  }

  canvasMouseDown() {
    if (app.tool.currentStep !== 'listen') return;

    // Nettoyer avant de commencer la création
    app.upperCanvasLayer.removeAllObjects();

    const selectedTemplate = app.tool.selectedTemplate;

    if (selectedTemplate?.name && selectedTemplate.name.startsWith('Segment')) {
      this.shapeToCreate = new LineShape({
        ...selectedTemplate,
        layer: 'upper',
      });
    } else {
      this.shapeToCreate = new RegularShape({
        ...selectedTemplate,
        layer: 'upper',
      });
    }
    const shapeSize = app.settings.shapesSize;

    this.shapeToCreate.size = shapeSize;
    this.shapeToCreate.scale(shapeSize);

    this.currentShapePos = Coordinates.nullCoordinates;

    if (this.shapeToCreate.isCircle()) this.shapeToCreate.isCenterShown = true;

    setState({ tool: { ...app.tool, currentStep: 'move' } });
    this.animate();
  }

  canvasMouseUp() {
    if (app.tool.currentStep !== 'move') return;

    this.executeAction();
    // Nettoyer l'upperCanvasLayer après la création pour éviter les contours de groupe résiduels
    app.upperCanvasLayer.removeAllObjects();
    setState({ tool: { ...app.tool, name: this.name, currentStep: 'listen' } });
  }

  refreshStateUpper() {
    // Nettoyer en permanence les contours de groupes résiduels quand on utilise l'outil Create
    if (app.tool.currentStep !== 'move') {
      app.upperCanvasLayer.removeAllObjects();
    }

    if (app.tool.currentStep === 'move') {
      this.shapeToCreate.translate(
        app.workspace.lastKnownMouseCoordinates.substract(this.currentShapePos),
      );
      this.currentShapePos = app.workspace.lastKnownMouseCoordinates;
    }
  }

  // Override objectSelected pour empêcher les actions de l'ancien outil Group
  objectSelected(shape) {
    // Ne rien faire - empêche les actions du GroupTool qui pourrait encore être actif
    return;
  }

  _executeAction() {
    const selectedTemplate = app.tool.selectedTemplate;
    if (!selectedTemplate?.name) {
      console.warn('No template selected');
      return;
    }

    const shapeSize = app.settings.shapesSize,
      shapeCoordinates = app.workspace.lastKnownMouseCoordinates;

    let shape;
    if (selectedTemplate.name.startsWith('Segment')) {
      shape = new LineShape({
        ...selectedTemplate,
        size: shapeSize,
        layer: 'main',
      });
    } else if (app.environment.name !== 'Cubes') {
      shape = new RegularShape({
        ...selectedTemplate,
        size: shapeSize,
        layer: 'main',
      });
    } else {
      shape = new CubeShape({
        ...selectedTemplate,
        size: shapeSize,
        layer: 'main',
      });
    }
    shape.scale(shapeSize);
    shape.translate(shapeCoordinates);

    const transformation = getShapeAdjustment([shape], shape);
    shape.rotate(transformation.rotationAngle, shape.centerCoordinates);
    shape.translate(transformation.translation);
  }
}
