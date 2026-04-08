import { computed } from '@lit-labs/signals';
import { activeTool, createWatcher, currentStep, toolState } from '../../../store/appState';
import { app } from '../App';

const REPLAY_ALLOWED_TOOL_TYPES = new Set(['move', 'transformation']);

/**
 * Cette classe abstraite représente un état possible de l'application
 */
export class Tool {
  constructor(name, title, type) {
    if (this.constructor === Tool) {
      throw new TypeError(
        'Abstract class "Tool" cannot be instantiated directly',
      );
    }
    this.name = name;
    this.title = title;
    this.type = type;
    this.isActive = false;
    this._executingStep = null;

    window.addEventListener('refreshStateUpper', () => {
      if (this.name === app.tool?.name) this.refreshStateUpper();
    });

    this.handler = (event) => this.eventHandler(event);

    window.addEventListener('tool-updated', this.handler);
  }

  dispose() {
    window.removeEventListener('tool-updated', this.handler);
  }

  /**
   * Appelée par la fonction de dessin, lorsqu'il faut dessiner l'action en cours
   */
  refreshStateUpper() {}

  /**
   * Exécuter les actions liée à l'état.
   */
  executeAction() {
    this._executeAction();
    window.dispatchEvent(new CustomEvent('refresh'));
    window.dispatchEvent(
      new CustomEvent('actions-executed', { detail: { name: this.title } }),
    );
  }

  /**
   * (appelé quand l'utilisateur sélectionne le state)
   */
  start() {
    console.error('start() not implemented');
  }

  /**
   * (appelé si changement de state)
   */
  end() {
    console.error('end() not implemented');
  }

  /**
   * Gere l'animation de déplacement
   * override pour changer d'animation
   */
  animate() {
    window.dispatchEvent(new CustomEvent('refreshUpper'));
    this.requestAnimFrameId = window.requestAnimationFrame(() =>
      this.animate(),
    );
  }

  stopAnimation() {
    window.cancelAnimationFrame(this.requestAnimFrameId);
  }

  removeListeners() {
    app.removeListener('canvasMouseMove', this.mouseMoveId);
    app.removeListener('canvasMouseDown', this.mouseDownId);
    app.removeListener('canvasMouseUp', this.mouseUpId);
    app.removeListener('canvasClick', this.mouseClickId);
    app.removeListener('objectSelected', this.objectSelectedId);
    app.removeListener('canvasTouchMove', this.touchMoveId);
    app.removeListener('canvasTouchEnd', this.touchEndId);
    app.removeListener('canvasLongPress', this.longPressId);
  }

  eventHandler(event) {
    if (event.type === 'tool-updated') {
      const tool = app.tool;
      if (!tool) {
        this.isActive = false;
        this.end();
        return;
      }

      if (tool.name === this.name) {
        this.isActive = true;
        const step = tool.currentStep;

        if (!step) return;

        // Garde-fou contre la récursion synchrone de la même étape
        if (this._executingStep === step) return;

        if (
          app.fullHistory?.isRunning &&
          !REPLAY_ALLOWED_TOOL_TYPES.has(this.type)
        ) {
          return;
        }

        if (typeof this[step] === 'function') {
          try {
            this._executingStep = step;
            this[step]();
          } finally {
            this._executingStep = null;
          }
        }
      } else if (this.isActive) {
        this.isActive = false;
        this.end();
      }
    } else {
      if (event.type === 'objectSelected') {
        this.objectSelected(event.detail.object);
      } else if (
        ['canvasTouchStart', 'canvasTouchMove', 'canvasTouchEnd'].includes(
          event.type,
        )
      ) {
        this[event.type](event.detail.touches);
      } else if (event.type === 'canvasMouseWheel') {
        this[event.type](event.detail.deltaY);
      } else {
        this[event.type]();
      }
    }
  }
}
