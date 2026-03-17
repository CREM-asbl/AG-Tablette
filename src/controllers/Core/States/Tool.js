import { computed } from '@lit-labs/signals';
import { activeTool, createWatcher, currentStep, selectedTemplate, toolState } from '../../../store/appState';
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
    this.disposeWatcher = null;

    window.addEventListener('refreshStateUpper', () => {
      if (this.name === app.tool?.name) this.refreshStateUpper();
    });

    this.handler = (event) => this.eventHandler(event);

    window.addEventListener('tool-updated', this.handler);

    // Le watcher sera initialisé avec un délai pour éviter les problèmes de circularité
    // Schedule initialization pour après le tirage des modules
    Promise.resolve().then(() =>
      // Attendre que tous les imports soient terminés
      new Promise((resolve) => {
        setTimeout(() => {
          this._initializeWatcher();
          resolve();
        }, 50);
      })
    );
  }

  /**
   * Initialiser le watcher de façon sûre
   */
  _initializeWatcher() {
    if (this.disposeWatcher) return;

    try {
      const combinedSignal = computed(() => ({
        toolName: activeTool.get(),
        step: currentStep.get(),
        template: selectedTemplate.get(),
      }));

      this.disposeWatcher = createWatcher(combinedSignal, (newValue) => {
        const { toolName, step, template } = newValue;

        if (toolName === this.name && step) {
          // Sync legacy state to ensure App.js delegates events correctly
          // and eventHandler uses the correct step.
          if (!app.tool || app.tool.name !== toolName || app.tool.currentStep !== step || app.tool.selectedTemplate !== template) {
            const extraState = toolState.get() || {};
            app.tool = { ...(app.tool || {}), ...extraState, name: toolName, currentStep: step, selectedTemplate: template };
          }

          if (
            app.fullHistory?.isRunning &&
            !REPLAY_ALLOWED_TOOL_TYPES.has(this.type)
          ) {
            return;
          }

          if (typeof this[step] === 'function') {
            this[step]();
          }
        } else if (toolName !== this.name && this.name === app.tool?.name) {
          this.end();
        }
      });
    } catch (error) {
      // Silently ignore initialization failures - watcher is not critical
      if (import.meta.env.DEV) {
        console.warn(`[Tool] Failed to initialize watcher for ${this.name}:`, error);
      }
    }
  }

  dispose() {
    if (this.disposeWatcher) {
      this.disposeWatcher();
      this.disposeWatcher = null;
    }
  }

  /**
   * Appelée par la fonction de dessin, lorsqu'il faut dessiner l'action en cours
   */
  refreshStateUpper() { }

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
      if (!app.tool) {
        this.end();
      } else if (app.tool.name === this.name) {
        if (
          app.fullHistory?.isRunning &&
          !REPLAY_ALLOWED_TOOL_TYPES.has(this.type)
        ) {
          return;
        }
        if (import.meta.env.DEV) {
          console.log(`[Tool.eventHandler] ${this.name} - tool-updated, currentStep: ${app.tool.currentStep}`);
        }
        this[app.tool.currentStep]();
      } else if (app.tool.currentStep === 'start') {
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
