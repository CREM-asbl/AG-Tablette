import { app, setState } from '../Core/App';
import { State } from '../Core/States/State';
import { html } from 'lit-element';
import { createElem } from '../Core/Tools/general';
import { Shape } from '../Core/Objects/Shape';
import { Coordinates } from '../Core/Objects/Coordinates';
import { getShapeAdjustment } from '../Core/Tools/automatic_adjustment';

/**
 * Ajout de formes sur l'espace de travail
 */
export class CreateState extends State {
  constructor() {
    super('createShape', 'Ajouter une forme');

    // show-family-shape -> listen-canvas-click -> moving-shape
    this.currentStep = null;

    this.selectedFamily = null;

    this.selectedTemplate = null;

    this.shapeToCreate = null;

    window.addEventListener('tool-changed', this.handler);
  }

  /**
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
    let toolName = this.title;
    return html`
      <h2>${toolName}</h2>
      <p>
        Vous avez sélectionné l'outil <b>"${toolName}"</b>.<br />
        Après avoir sélectionné une famille de formes dans le menu, vous devez
        appuyer sur une des formes dans le menu qui apparaît en bas de l'écran.
        Appuyez ensuite sur l'écran pour ajouter une forme.<br /><br />
        <b>Note:</b> vous pouvez appuyer sur l'écran puis bouger votre doigt
        sans le relacher, pour positionner plus précisément la nouvelle forme.
      </p>
    `;
  }

  /**
   * Main event handler
   */
  _actionHandle(event) {
    if (event.type == 'tool-changed') {
      if (app.tool.name == this.name) {
        console.log(app.tool.currentStep);
        if (app.tool.currentStep == 'start') {
          this.start();
        } else if (app.tool.currentStep == 'listen-canvas-click') {
          this.startListening();
        } else if (app.tool.currentStep == 'moving-shape') {
          this.startMoving();
        }
      } else if (app.tool.currentStep == 'start') {
        this.end();
      }
    } else if (event.type == 'canvasmousedown') {
      this.onMouseDown();
    } else if (event.type == 'canvasmouseup') {
      this.onMouseUp();
    } else {
      console.error('unsupported event type : ', event.type);
    }
  }

  /**
   * (ré-)initialiser l'état
   * @param  {String} family Nom de la famille sélectionnée
   */
  start() {
    app.upperDrawingEnvironment.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();
    console.log(this.shapesList);
    if (!this.shapesList) {
      import('./shapes-list');
      this.shapesList = createElem('shapes-list');
    }
  }

  startListening() {
    app.upperDrawingEnvironment.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();
    this.mouseDownId = app.addListener('canvasmousedown', this.handler);
  }

  startMoving() {
    this.stopAnimation();
    this.removeListeners();
    this.mouseUpId = app.addListener('canvasmouseup', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    this.shapesList = null;

    app.upperDrawingEnvironment.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();
  }

  onMouseDown() {
    if (app.tool.currentStep != 'listen-canvas-click') return;

    const selectedTemplate = app.environment
      .getFamily(app.tool.selectedFamily)
      .getTemplate(app.tool.selectedTemplate);

    this.shapeToCreate = new Shape({
      ...selectedTemplate,
      drawingEnvironment: app.upperDrawingEnvironment,
    });
    let shapeSize = app.settings.get('shapesSize');

    this.shapeToCreate.size = shapeSize;
    this.shapeToCreate.scale(shapeSize);

    this.currentShapePos = Coordinates.nullCoordinates;

    if (this.shapeToCreate.isCircle()) this.shapeToCreate.isCenterShown = true;

    console.log(this.shapeToCreate);

    setState({tool: {...app.tool, currentStep: 'moving-shape'}});
    this.animate();
  }

  onMouseUp() {
    if (app.tool.currentStep != 'moving-shape') return;

    this.executeAction();
    setState({ tool: { ...app.tool, currentStep: 'listen-canvas-click' } });
    window.dispatchEvent(new CustomEvent('refreshUpper'));
    window.dispatchEvent(new CustomEvent('refresh'));
  }

  refreshStateUpper() {
    if (app.tool.currentStep == 'moving-shape') {
      console.log(this.shapeToCreate);

      this.shapeToCreate.translate(
        app.workspace.lastKnownMouseCoordinates.substract(this.currentShapePos)
      );
      this.currentShapePos = app.workspace.lastKnownMouseCoordinates;
    }
  }

  executeAction() {
    const shapeSize = app.settings.get('shapesSize'),
      shapeCoordinates = app.workspace.lastKnownMouseCoordinates;

    const selectedTemplate = app.environment
      .getFamily(app.tool.selectedFamily)
      .getTemplate(app.tool.selectedTemplate);

    let shape = new Shape({
      ...selectedTemplate,
      size: shapeSize,
      drawingEnvironment: app.mainDrawingEnvironment,
    });
    shape.scale(shapeSize);
    shape.translate(shapeCoordinates);

    let transformation = getShapeAdjustment([shape], shape);
    shape.rotate(transformation.rotationAngle, shape.centerCoordinates);
    shape.translate(transformation.translation);

    window.dispatchEvent(
      new CustomEvent('actions-executed', {
        detail: { name: this.title },
      })
    );
  }
}
