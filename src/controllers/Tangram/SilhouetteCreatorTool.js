import { html } from 'lit';
import { app, setState } from '../Core/App';
import { Silhouette } from '../Core/Objects/Silhouette';
import { Tool } from '../Core/States/Tool';
import { TangramManager } from './TangramManager';

/**
 * Créer une silhouette
 */
export class SilhouetteCreatorTool extends Tool {
  constructor() {
    super('createSilhouette', 'Créer une silhouette', '');
    this.isUserWarnedAboutOverlap = false;
  }

  async start() {

    this.removeListeners();

    let tool = app.tools.find(tool => tool.name == 'translate');
    tool.isDisable = false;
    tool = app.tools.find(tool => tool.name == 'color');
    tool.isDisable = true;

    setState({ tools: app.tools });

    let toWait = TangramManager.initShapes(true);
    TangramManager.removeSilhouette();

    this.isUserWarnedAboutOverlap = false;
    app.workspace.selectionConstraints =
      app.fastSelectionConstraints.mousedown_all_shape;
    window.addEventListener('new-window', this.handler);
    window.addEventListener('file-parsed', this.handler);
    window.addEventListener('tangram-changed', this.handler);

    await toWait;

    setState({
      history: {
        ...app.history,
        startSituation: {
          ...app.workspace.data,
        },
      },
    });

    window.addEventListener('actions-executed', this.handler);
    window.addEventListener('add-fullstep', this.handler);
    window.addEventListener('create-silhouette', this.handler);
  }

  end() {
    this.removeListeners();
  }

  eventHandler(event) {
    console.log('createSilhouette handler', event.type)
    if (event.type == 'tool-updated') {
      if (app.tool?.name == this.name) { this[app.tool.currentStep](); }
    } else if (event.type == 'actions-executed') {
      this.verifyOverlappingShapes();
    } else if (event.type == 'new-window' || event.type == 'file-parsed') {
      this.end();
    } else if (event.type == 'create-silhouette') {
      this.createSilhouette();
    } else if (event.type == 'add-fullstep' && (event.detail.name == 'Refaire' || event.detail.name == 'Annuler')) {
      this.verifyOverlappingShapes();
      window.dispatchEvent(new CustomEvent('refresh'));
    }
  }

  removeListeners() {
    window.removeEventListener('actions-executed', this.handler);
    window.removeEventListener('add-fullstep', this.handler);
    window.removeEventListener('tangram-changed', this.handler);
    window.removeEventListener('new-window', this.handler);
    window.removeEventListener('file-parsed', this.handler);
    window.removeEventListener('create-silhouette', this.handler);
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
        Pour créer une nouvelle silhouette, disposez les figures comme vous le
        désirez, <br />
        en veillant à ce qu'aucunes figures ne se supersopent. <br />
        Cliquez sur le bouton "Afficher la silhouette" une fois que vous avez terminé.
        <br />
      </p>
    `;
  }

  createSilhouette() {
    app.tangramCanvasLayer.removeAllObjects();
    const shapes = app.mainCanvasLayer.shapes;

    if (this.hasOverlapedShape(shapes)) return

    new Silhouette(shapes);
  }

  hasOverlapedShape(shapes) {
    return shapes.some((shape) =>
      shapes.some((s) => {
        if (s.id == shape.id) return false;
        else return s.overlapsWith(shape);
      }),
    );
  }

  verifyOverlappingShapes() {
    app.mainCanvasLayer.shapes.forEach((s) => {
      s.isOverlappingAnotherInTangram = false;
    });
    app.mainCanvasLayer.shapes.forEach((s, idx, shapes) => {
      let index = app.mainCanvasLayer.shapes.findIndex((s2) => {
        if (s.id == s2.id) return false;
        if (s.overlapsWith(s2)) return true;
        return false;
      });
      if (index != -1) {
        if (!this.isUserWarnedAboutOverlap) {
          window.dispatchEvent(
            new CustomEvent('show-notif', {
              detail: { message: 'Certaines figures se superposent.' },
            }),
          );
          this.isUserWarnedAboutOverlap = true;
        }
        s.isOverlappingAnotherInTangram = true;
        shapes[index].isOverlappingAnotherInTangram = true;
      }
    });
  }
}
