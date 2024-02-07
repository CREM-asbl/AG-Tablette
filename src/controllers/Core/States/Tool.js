import { app } from '../App';

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

    window.addEventListener('get-help-text', () => {
      if (app.tool?.name == this.name) {
        const popup = document.querySelector('help-popup');
        popup.setText(this.getHelpText());
      }
    });

    window.addEventListener('refreshStateUpper', () => {
      if (this.name == app.tool?.name) this.refreshStateUpper();
    });

    this.handler = (event) => this.eventHandler(event);

    window.addEventListener('tool-updated', this.handler);
  }

  /**
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
    console.error('getHelpText() not implemented');
    return "Aucune aide n'est actuellement disponible pour l'élément sélectionné.";
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
      new CustomEvent('actions-executed', {
        detail: { name: this.title },
      }),
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
    // app.removeListener('canvasTouchStart', this.touchStartId);
    app.removeListener('canvasTouchMove', this.touchMoveId);
    app.removeListener('canvasTouchEnd', this.touchEndId);
    app.removeListener('canvasLongPress', this.longPressId);
    // app.removeListener('canvasMouseWheel', this.mouseWheelId);
  }

  eventHandler(event) {
    if (event.type == 'tool-updated') {
      if (!app.tool) {
        this.end();
      } else if (app.tool.name == this.name) {
        this[app.tool.currentStep]();
      } else if (app.tool.currentStep == 'start') {
        this.end();
      }
    } else {
      if (event.type == 'objectSelected') {
        this.objectSelected(event.detail.object);
      } else if (
        ['canvasTouchStart', 'canvasTouchMove', 'canvasTouchEnd'].includes(
          event.type,
        )
      ) {
        this[event.type](event.detail.touches);
      } else if (event.type == 'canvasMouseWheel') {
        this[event.type](event.detail.deltaY);
      } else {
        this[event.type]();
      }
    }
  }
}
