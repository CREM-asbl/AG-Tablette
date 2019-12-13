import { LitElement, html } from 'lit-element';
import { standardKit } from './js/ShapesKits/standardKit';
import { Point } from './js/Objects/Point';

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
      if (icon.segments[i].arcCenter) is_circle = true; // change for shapes like D
    }

    let largeur = maxX - minX,
      hauteur = maxY - minY,
      scale;
    if (is_circle) {
      scale = 0.42; //valeur arbitraire
    } else {
      scale = 40 / Math.max(largeur, hauteur);
    }

    let center;
    if (is_circle) center = icon.segments[0].arcCenter;
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

    ctx.beginPath();
    ctx.moveTo(icon.segments[0].vertexes[0].x, icon.segments[0].vertexes[0].y);
    icon.segments.forEach(seg => {
      let arcCenter;
      if (seg.arcCenter) arcCenter = new Point(seg.arcCenter);
      if (!arcCenter) ctx.lineTo(seg.vertexes[1].x, seg.vertexes[1].y);
      else {
        const firstAngle = arcCenter.getAngle(seg.vertexes[0]),
          secondAngle = new Point(seg.vertexes[0]).equal(seg.vertexes[1])
            ? 2 * Math.PI
            : arcCenter.getAngle(seg.vertexes[1]);
        ctx.arc(
          arcCenter.x,
          arcCenter.y,
          arcCenter.dist(seg.vertexes[1]),
          firstAngle,
          secondAngle,
          seg.counterclockwise,
        );
      }
    });
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
