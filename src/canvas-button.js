import { LitElement, html } from 'lit-element';
import { standardKit } from './js/ShapesKits/standardKit';

class CanvasButton extends LitElement {
  static get properties() {
    return {
      family: String,
      shape: String,
      name: String,
    };
  }

  render() {
    return html`
      <style>
        :host {
          display: block;
          margin: 2px;
        }

        :host([active]) canvas {
          border: 1px solid var(--button-border-color);
          background-color: var(--button-background-color);
        }

        canvas {
          background: #fff;
          border: 1px solid black;
          box-sizing: border-box;
          width: 52px;
          height: 52px;
        }
      </style>

      <canvas id="canvas" width="52px" height="52px"></canvas>
    `;
  }

  updated() {
    this.refresh();
  }

  /**
   * dessine l'image sur le bouton
   */
  refresh() {
    const canvas = this.shadowRoot.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    let minX = 1000,
      minY = 1000,
      maxX = -1000,
      maxY = -1000;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.strokeStyle = '#000';

    let icon =
      standardKit[this.family].shapes.filter(shape => shape.name === this.shape)[0] ||
      standardKit[this.family].shapes[0];
    ctx.fillStyle = icon.color || standardKit[this.family].color;

    let is_circle = false;
    for (let i = 0; i < icon.segments.length; i++) {
      minX = Math.min(minX, icon.segments[i].vertexes[1].x);
      maxX = Math.max(maxX, icon.segments[i].vertexes[1].x);
      minY = Math.min(minY, icon.segments[i].vertexes[1].y);
      maxY = Math.max(maxY, icon.segments[i].vertexes[1].y);
      if (icon.segments[i].isArc) is_circle = true;
    }

    let largeur = maxX - minX,
      hauteur = maxY - minY,
      scale;
    if (is_circle) {
      scale = 0.42; //valeur arbitraire
    } else {
      scale = 40 / Math.max(largeur, hauteur);
    }

    let center = {
        x: (minX + largeur / 2) * scale,
        y: (minY + hauteur / 2) * scale,
      },
      centerOffset = {
        x: 26 - center.x,
        y: 26 - center.y,
      };

    ctx.translate(centerOffset.x, centerOffset.y);
    ctx.scale(scale, scale);

    ctx.beginPath();
    ctx.moveTo(icon.segments[0].vertexes[0].x, icon.segments[0].vertexes[0].y);
    icon.segments.forEach(seg => ctx.lineTo(seg.vertexes[1].x, seg.vertexes[1].y));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  /**
   * définir le bouton comme étant le bouton actif
   */
  _isActive(current) {
    if (current === this.family) {
      this.shadowRoot.querySelector('canvas').classList.add('active');
      return;
    }
    this.shadowRoot.querySelector('canvas').classList.remove('active');
  }
}
customElements.define('canvas-button', CanvasButton);
