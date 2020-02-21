import { LitElement, html, css } from 'lit-element';
import { app } from './js/App';
import { Shape } from './js/Objects/Shape';
import { Point } from './js/Objects/Point';

class CanvasButton extends LitElement {
  static get properties() {
    return {
      familyName: String,
      shapeName: String,
      silhouetteIdx: String,
      name: String,
    };
  }

  static get styles() {
    return css`
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
    `;
  }

  render() {
    return html`
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
    let shape, family;

    if (this.silhouetteIdx == undefined) {
      const families = app.environment.families;
      family = families.find(fam => fam.name == this.familyName);
      shape = family.shapes.find(shape => shape.name === this.shapeName) || family.shapes[0];
    } else {
      shape = new Shape({ x: 0, y: 0 }, null, name, this.name);
      shape.initFromObject(app.CremTangrams[this.silhouetteIdx].tangramData.silhouette.shape);
    }

    const isCircle = shape.isCircle(),
      bounds = shape.bounds,
      minX = bounds[0],
      maxX = bounds[1],
      minY = bounds[2],
      maxY = bounds[3],
      largeur = maxX - minX,
      hauteur = maxY - minY,
      scale = isCircle ? 0.42 : 40 / Math.max(largeur, hauteur),
      center = isCircle
        ? shape.segments[0].arcCenter
        : new Point((minX + largeur / 2) * scale, (minY + hauteur / 2) * scale),
      centerOffset = new Point(26 - center.x, 26 - center.y);

    const canvas = this.shadowRoot.querySelector('canvas'),
      ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.strokeStyle = '#000';
    ctx.fillStyle = shape.color || family.defaultColor;
    ctx.translate(centerOffset.x, centerOffset.y);
    ctx.scale(scale, scale);

    if (this.silhouetteIdx == undefined) {
      const path = shape.getPath();
      ctx.fill(path);
      ctx.stroke(path);
    } else {
      window.dispatchEvent(new CustomEvent('draw-shape', { detail: { ctx: ctx, shape: shape } }));
    }
    ctx.restore();
  }

  /**
   * définir le bouton comme étant le bouton actif
   */
  _isActive(current) {
    if (current === this.familyName) {
      this.shadowRoot.querySelector('canvas').classList.add('active');
      return;
    }
    this.shadowRoot.querySelector('canvas').classList.remove('active');
  }
}
customElements.define('canvas-button', CanvasButton);
