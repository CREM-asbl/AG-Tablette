import { LitElement } from 'lit';
import { app, setState } from '../Core/App';
import { Silhouette } from './Silhouette';
import { TangramManager } from './TangramManager';

const hasOverlapedShape = (shapes) => {
  return shapes.some((shape) =>
    shapes.some((s) => {
      if (s.id == shape.id) return false;
      else return s.overlapsWith(shape);
    }));
}

/**
 * Créer une silhouette
 */
export class SilhouetteCreatorTool extends LitElement {
  constructor() {
    super()
    this.isUserWarnedAboutOverlap = false;
  }

  async connectedCallback() {
    super.connectedCallback();
    let tool = app.tools.find(tool => tool.name == 'translate');
    tool.isDisable = false;
    tool = app.tools.find(tool => tool.name == 'color');
    tool.isDisable = true;

    setState({ tools: app.tools });

    app.tangramCanvasLayer.removeAllObjects();
    window.dispatchEvent(new CustomEvent('refresh-background'));

    this.isUserWarnedAboutOverlap = false;
    app.workspace.selectionConstraints = app.fastSelectionConstraints.mousedown_all_shape;

    await TangramManager.initShapes(true);

    setState({
      history: {
        ...app.history,
        startSituation: {
          ...app.workspace.data,
        },
      },
    });
    window.addEventListener('actions-executed', this.verifyOverlappingShapes);
    window.addEventListener('create-silhouette', this.createSilhouette);
    window.addEventListener('file-parsed', this.remove.bind(this))
    window.addEventListener('new-window', this.remove.bind(this))
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('actions-executed', this.verifyOverlappingShapes);
    window.removeEventListener('create-silhouette', this.createSilhouette);
    window.removeEventListener('file-parsed', this.remove.bind(this))
    window.removeEventListener('new-window', this.remove.bind(this))
  }

  createSilhouette() {
    app.tangramCanvasLayer.removeAllObjects();
    const shapes = app.mainCanvasLayer.shapes;
    if (!hasOverlapedShape(shapes)) return new Silhouette(shapes);
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
customElements.define('silhouette-creator-tool', SilhouetteCreatorTool);