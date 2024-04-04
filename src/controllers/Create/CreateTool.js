import { html } from 'lit';
import { app, setState } from '../Core/App';
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
    let toolName = this.title;
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
    app.upperCanvasLayer.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();

    this.openShapeList();
  }

  listen() {
    app.upperCanvasLayer.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();

    // this.openShapeList();
    this.mouseDownId = app.addListener('canvasMouseDown', this.handler);
  }

  move() {
    // this.stopAnimation();
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
    const shapeTemplates = app.environment.getFamily(app.tool.selectedFamily).shapeTemplates;
    if (shapeTemplates.length == 1) {
      let selectedTemplate = shapeTemplates[0];
      setTimeout(() => setState({ tool: { ...app.tool, currentStep: 'listen', selectedTemplate } }), 50);
    } else if (!this.shapesList) {
      import('../../components/shape-selector');
      const elem = document.createElement('shape-selector');
      elem.family = app.tool.selectedFamily;
      elem.templatesNames = app.environment.getFamily(app.tool.selectedFamily).shapeTemplates;
      elem.selectedTemplate = app.tool.selectedTemplate;
      elem.type = "Create"
      elem.nextStep = 'listen'
      document.querySelector('body').appendChild(elem);
    }
  }

  canvasMouseDown() {
    if (app.tool.currentStep != 'listen') return;

    const selectedTemplate = app.tool.selectedTemplate;

    if (selectedTemplate?.name.startsWith('Segment')) {
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
    let shapeSize = app.settings.shapesSize;

    this.shapeToCreate.size = shapeSize;
    this.shapeToCreate.scale(shapeSize);

    this.currentShapePos = Coordinates.nullCoordinates;

    if (this.shapeToCreate.isCircle()) this.shapeToCreate.isCenterShown = true;

    setState({ tool: { ...app.tool, currentStep: 'move' } });
    this.animate();
  }

  canvasMouseUp() {
    if (app.tool.currentStep != 'move') return;

    this.executeAction();
    setState({ tool: { ...app.tool, name: this.name, currentStep: 'listen' } });
  }

  refreshStateUpper() {
    if (app.tool.currentStep == 'move') {
      this.shapeToCreate.translate(
        app.workspace.lastKnownMouseCoordinates.substract(this.currentShapePos),
      );
      this.currentShapePos = app.workspace.lastKnownMouseCoordinates;
    }
  }

  _executeAction() {
    const shapeSize = app.settings.shapesSize,
      shapeCoordinates = app.workspace.lastKnownMouseCoordinates;

    const selectedTemplate = app.tool.selectedTemplate;

    let shape;
    if (selectedTemplate.name.startsWith('Segment')) {
      shape = new LineShape({
        ...selectedTemplate,
        size: shapeSize,
        layer: 'main',
      });
    } else if (app.environment.name != 'Cubes') {
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

    let transformation = getShapeAdjustment([shape], shape);
    shape.rotate(transformation.rotationAngle, shape.centerCoordinates);
    shape.translate(transformation.translation);
  }
}
