import { LitElement, html } from 'lit-element';
import { standardKit } from './js/ShapesKits/standardKit';
import { Point } from './js/Objects/Point';
import { App } from './js/App';

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
    const families = app.workspace.environment.families;
    const family = families.filter(fam => fam.name == this.family)[0];
    let minX = 1000,
      minY = 1000,
      maxX = -1000,
      maxY = -1000;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.strokeStyle = '#000';

    let icon = family.shapes.filter(shape => shape.name === this.shape)[0] || family.shapes[0];
    ctx.fillStyle = icon.color || family.defaultColor;

    const isCircle = icon.isCircle();
    const bounds = icon.bounds;
    minX = bounds[0];
    maxX = bounds[1];
    minY = bounds[2];
    maxY = bounds[3];

    let largeur = maxX - minX,
      hauteur = maxY - minY,
      scale;
    if (isCircle) {
      scale = 0.42; //valeur arbitraire
    } else {
      scale = 40 / Math.max(largeur, hauteur);
    }

    let center;
    if (isCircle) center = icon.segments[0].arcCenter;
    else
      center = {
        x: (minX + largeur / 2) * scale,
        y: (minY + hauteur / 2) * scale,
      };
    let centerOffset = {
      x: 26 - center.x,
      y: 26 - center.y,
    };

    ctx.translate(centerOffset.x, centerOffset.y);
    ctx.scale(scale, scale);

    const path = icon.getPath();
    ctx.fill(path);
    ctx.stroke(path);
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
