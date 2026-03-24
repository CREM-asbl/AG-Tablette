import { css, html, LitElement } from 'lit';

/**
 * Popover contextuel qui affiche l'aide contextuelle
 * Écoute l'événement 'contextual-guide-focus' pour afficher/masquer
 */
class ContextualPopover extends LitElement {
  static properties = {
    isVisible: { state: true },
    text: { state: true },
    target: { state: true },
    position: { state: true },
    isComplete: { state: true },
  };

  static styles = css`
    :host {
      position: fixed;
      z-index: 9999;
      pointer-events: none;
      top: 0;
      left: 0;
    }

    .popover {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      max-width: 300px;
      font-size: 16px;
      line-height: 1.5;
      transition: background 0.3s ease;
      animation: slideIn 0.3s ease-out;
      position: fixed;
      z-index: 9999;
    }

    .popover.complete {
      background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .arrow {
      position: absolute;
      width: 0;
      height: 0;
      transition: border-color 0.3s ease;
    }

    /* Flèche pointant vers le bas (popover au-dessus de l'élément) */
    .arrow-bottom {
      bottom: -10px;
      left: 50%;
      transform: translateX(-50%);
      border-left: 10px solid transparent;
      border-right: 10px solid transparent;
      border-top: 10px solid #667eea;
    }
    .popover.complete .arrow-bottom {
      border-top-color: #48bb78;
    }

    /* Flèche pointant vers le haut (popover en-dessous de l'élément) */
    .arrow-top {
      top: -10px;
      left: 50%;
      transform: translateX(-50%);
      border-left: 10px solid transparent;
      border-right: 10px solid transparent;
      border-bottom: 10px solid #764ba2;
    }
    .popover.complete .arrow-top {
      border-bottom-color: #38a169;
    }

    /* Flèche pointant vers la droite (popover à gauche de l'élément) */
    .arrow-right {
      right: -10px;
      top: 50%;
      transform: translateY(-50%);
      border-top: 10px solid transparent;
      border-bottom: 10px solid transparent;
      border-left: 10px solid #667eea;
    }
    .popover.complete .arrow-right {
      border-left-color: #48bb78;
    }

    /* Flèche pointant vers la gauche (popover à droite de l'élément) */
    .arrow-left {
      left: -10px;
      top: 50%;
      transform: translateY(-50%);
      border-top: 10px solid transparent;
      border-bottom: 10px solid transparent;
      border-right: 10px solid #764ba2;
    }
    .popover.complete .arrow-left {
      border-right-color: #38a169;
    }

    /* Pas de flèche */
    .arrow-none {
      display: none;
    }

    :host([hidden]) {
      display: none;
    }
  `;

  constructor() {
    super();
    this.isVisible = false;
    this.text = '';
    this.target = null;
    this.isComplete = false;
    this.position = { top: 0, left: 0, arrowClass: 'arrow-bottom' };
    this._updatePositionBound = this._updatePosition.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('contextual-guide-focus', this._handleFocus.bind(this));
    window.addEventListener('resize', this._updatePositionBound);
    window.addEventListener('scroll', this._updatePositionBound, true);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('contextual-guide-focus', this._handleFocus);
    window.removeEventListener('resize', this._updatePositionBound);
    window.removeEventListener('scroll', this._updatePositionBound, true);
  }

  _handleFocus(event) {
    const { active, target, text, isComplete } = event.detail;

    // Ignorer si le target est déjà géré en interne par les composants majeurs
    const internalTargets = ['canvas-container', 'shape-selector'];
    if (!active || !target || !text || internalTargets.includes(target)) {
      this.isVisible = false;
      return;
    }

    this.text = text;
    this.target = target;
    this.isComplete = !!isComplete;
    
    // Calculer la position avant de l'afficher pour éviter le flash à (0,0)
    this._updatePosition();
    this.isVisible = true;

    // Recalculer après un court délai pour s'assurer que le DOM est stabilisé
    requestAnimationFrame(() => {
      setTimeout(() => this._updatePosition(), 50);
    });
  }

  _updatePosition() {
    if (!this.target) return;

    // Récupérer l'élément cible
    let targetElement;
    if (typeof this.target === 'string') {
      targetElement = document.querySelector(this.target);
    } else if (this.target instanceof HTMLElement) {
      targetElement = this.target;
    }

    if (!targetElement) {
      console.warn('[ContextualPopover] Élément cible non trouvé:', this.target);
      this.isVisible = false;
      return;
    }

    // Pour les Web Components avec un dialog dans le shadowDOM (ex: divide-popup -> template-popup -> dialog),
    // accéder au dialog visible plutôt qu'au composant lui-même
    let targetRect;
    if (targetElement.shadowRoot) {
      // Essayer de trouver un dialog direct dans le shadowRoot
      let dialogElement = targetElement.shadowRoot.querySelector('dialog');

      // Sinon, essayer de le chercher dans les Web Components enfants (ex: template-popup)
      if (!dialogElement) {
        const templatePopup = targetElement.shadowRoot.querySelector('template-popup');
        if (templatePopup && templatePopup.shadowRoot) {
          dialogElement = templatePopup.shadowRoot.querySelector('dialog');
        }
      }

      if (dialogElement) {
        targetRect = dialogElement.getBoundingClientRect();
      } else {
        targetRect = targetElement.getBoundingClientRect();
      }
    } else {
      targetRect = targetElement.getBoundingClientRect();
    }
    const popoverWidth = 300; // Max width du popover
    const popoverHeight = 100; // Estimation de la hauteur
    const gap = 16; // Espace entre le popover et l'élément

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top, left, arrowClass;

    // Calculer la meilleure position (préférence : au-dessus, puis en-dessous, puis à droite, puis à gauche)
    if (targetRect.top > popoverHeight + gap) {
      // Au-dessus de l'élément
      top = targetRect.top - popoverHeight - gap;
      left = Math.max(10, Math.min(targetRect.left + targetRect.width / 2 - popoverWidth / 2, viewportWidth - popoverWidth - 10));
      arrowClass = 'arrow-bottom';
    } else if (targetRect.bottom + popoverHeight + gap < viewportHeight) {
      // En-dessous de l'élément
      top = targetRect.bottom + gap;
      left = Math.max(10, Math.min(targetRect.left + targetRect.width / 2 - popoverWidth / 2, viewportWidth - popoverWidth - 10));
      arrowClass = 'arrow-top';
    } else if (targetRect.right + popoverWidth + gap < viewportWidth) {
      // À droite de l'élément
      top = Math.max(10, Math.min(targetRect.top + targetRect.height / 2 - popoverHeight / 2, viewportHeight - popoverHeight - 10));
      left = targetRect.right + gap;
      arrowClass = 'arrow-left';
    } else if (targetRect.left > popoverWidth + gap) {
      // À gauche de l'élément
      top = Math.max(10, Math.min(targetRect.top + targetRect.height / 2 - popoverHeight / 2, viewportHeight - popoverHeight - 10));
      left = targetRect.left - popoverWidth - gap;
      arrowClass = 'arrow-right';
    } else {
      // Pas d'espace suffisant autour (élément large type canvas) -> On place à l'intérieur en haut
      top = Math.max(10, targetRect.top + gap);
      left = Math.max(10, Math.min(targetRect.left + targetRect.width / 2 - popoverWidth / 2, viewportWidth - popoverWidth - 10));
      arrowClass = 'arrow-none';
    }

    this.position = { top, left, arrowClass };
    this.requestUpdate();
  }

  render() {
    if (!this.isVisible) {
      return html``;
    }

    return html`
      <div
        class="popover ${this.isComplete ? 'complete' : ''}"
        style="top: ${this.position.top}px; left: ${this.position.left}px;"
      >
        ${this.isComplete ? '✨ ' : ''}${this.text}
        <div class="arrow ${this.position.arrowClass}"></div>
      </div>
    `;
  }
}

customElements.define('contextual-popover', ContextualPopover);
export { ContextualPopover };

