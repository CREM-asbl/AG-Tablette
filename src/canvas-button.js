import { app } from './Core/App';
import { LitElement, html, css } from 'lit-element';
import { Shape } from './Core/Objects/Shape';
import { Point } from './Core/Objects/Point';

//A quoi sert silhouetteidx ?
//Les canvas-button sont utilisés dans tangram ?

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
        border: 1px solid black;
        background-color: #0ff;
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
    return html` <canvas id="canvas" width="52px" height="52px"></canvas> `;
  }

  updated() {
    this.refresh();
  }

  /**
   * dessine l'image sur le bouton
   */
  refresh() {
    let shapes, family, scale, center;

    if (this.silhouetteIdx == undefined) {
      family = app.environment.families.find(
        fam => fam.name == this.familyName
      );
      shapes = [
        family.shapes.find(shape => shape.name === this.shapeName) ||
          family.shapes[0],
      ];
    } else {
      shapes = app.CremTangrams[
        this.silhouetteIdx
      ].silhouetteData.shapes.map(s => Shape.fromObject(s));
    }

    if (shapes.length == 1 && shapes[0].isCircle()) {
      scale = 0.42; // arbitraire
      center = shapes[0].segments[0].arcCenter;
    } else {
      let minsX = [],
        maxsX = [],
        minsY = [],
        maxsY = [];
      shapes.forEach(s => {
        const bounds = s.bounds;
        minsX.push(bounds[0]);
        maxsX.push(bounds[1]);
        minsY.push(bounds[2]);
        maxsY.push(bounds[3]);
      });
      const minX = Math.min(...minsX),
        maxX = Math.max(...maxsX),
        minY = Math.min(...minsY),
        maxY = Math.max(...maxsY),
        largeur = maxX - minX,
        hauteur = maxY - minY;
      scale = 40 / Math.max(largeur, hauteur);
      center = new Point(
        (minX + largeur / 2) * scale,
        (minY + hauteur / 2) * scale
      );
    }

    const centerOffset = new Point(26 - center.x, 26 - center.y);

    const canvas = this.shadowRoot.querySelector('canvas'),
      ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(centerOffset.x, centerOffset.y);
    ctx.scale(scale, scale);

    if (this.silhouetteIdx == undefined) {
      ctx.strokeStyle = '#000';
      ctx.fillStyle = shapes[0].color || family.defaultColor;
      const path = new Path2D(shapes[0].getSVGPath('no scale'));
      ctx.fill(path);
      ctx.stroke(path);
    } else {
      console.log(shapes);
      shapes.forEach(s =>
        window.dispatchEvent(
          new CustomEvent('draw-shape', { detail: { ctx: ctx, shape: s } })
        )
      );
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
