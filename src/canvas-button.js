import { app } from './Core/App';
import { LitElement, html, css } from 'lit-element';
import { Shape } from './Core/Objects/Shape';
import { Bounds } from './Core/Objects/Bounds';
import { Coordinates } from './Core/Objects/Coordinates';
import { DrawingEnvironment } from './Core/Objects/DrawingEnvironment';

class CanvasButton extends LitElement {
  static get properties() {
    return {
      familyName: String,
      templateName: String,
      silhouetteIdx: String,
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
        margin: 2px;
        width: 52px;
        height: 52px;
      }

      :host([active]) canvas {
        /* border: 1px solid black; */
        background-color: var(--theme-color);
      }

      canvas {
        background: #fff;
        box-shadow: 0px 0px 3px var(--menu-shadow-color);
        border-radius: 3px;
        /* width: 52px;
        height: 52px; */
        padding: 0px;
      }
    `;
  }

  render() {
    return html` <canvas id="canvas" width="52px" height="52px"></canvas> `;
  }

  firstUpdated() {
    const canvas = this.shadowRoot.querySelector('canvas');

    this.drawingEnvironment = new DrawingEnvironment(canvas);
    this.drawingEnvironment.mustDrawPoints = false;
    this.drawingEnvironment.mustScaleShapes = false;
  }

  updated() {
    this.refresh();
  }

  /**
   * call when the user change the selected family
   */
  refresh() {
    this.drawingEnvironment.removeAllObjects();

    let shapeTemplates, family, scale, center;

    if (this.silhouetteIdx === undefined) {
      family = app.environment.getFamily(this.familyName);
      shapeTemplates = [
        family.shapeTemplates.find(
          template => template.name === this.templateName
        ) || family.shapeTemplates[0],
      ];
    } else {
      shapeTemplates =
        app.CremTangrams[this.silhouetteIdx].silhouetteData.shapesData;
    }

    this.shapes = shapeTemplates.map(
      template =>
        new Shape({
          ...template,
          drawingEnvironment: this.drawingEnvironment,
          opacity: 1,
        })
    );

    if (this.shapes.length == 1 && this.shapes[0].isCircle()) {
      scale = 0.42; // arbitraire
      center = this.shapes[0].segments[0].arcCenter.coordinates;
    } else {
      let shapeBounds = this.shapes.map(s => s.bounds);
      let totalBounds = Bounds.getOuterBounds(...shapeBounds);
      const largeur = totalBounds.maxX - totalBounds.minX,
        hauteur = totalBounds.maxY - totalBounds.minY;
      scale = 40 / Math.max(largeur, hauteur);
      center = new Coordinates({
        x: (totalBounds.minX + largeur / 2) * scale,
        y: (totalBounds.minY + hauteur / 2) * scale,
      });
    }

    const centerOffset = new Coordinates({
      x: 26 - center.x,
      y: 26 - center.y,
    });

    this.shapes.forEach(s => {
      s.scale(scale);
      s.translate(centerOffset);
    });

    if (this.silhouetteIdx !== undefined) {
      this.ctx.strokeStyle = '#000';
      this.ctx.fillStyle = this.shapes[0].color || family.defaultColor;
      const path = new Path2D(this.shapes[0].getSVGPath('no scale'));
      this.ctx.fill(path);
      this.ctx.stroke(path);
    } else {
      this.drawingEnvironment.draw();
    }
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
