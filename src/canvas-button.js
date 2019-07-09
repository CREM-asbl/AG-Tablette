import { LitElement, html } from 'lit-element'
import { standardShapes } from './js/StandardShapes';

class CanvasButton extends LitElement {

    static get properties() {
        return {
            family: String,
            shape: String,
            name: String
        }
    }

    render() {
        return html`
         <style>
            :host {
                display: block;
            }

            :host([active]) canvas{
                border: 1px solid #F66;
            }

            canvas {
                background: #fff;
                border: 1px solid black;
                box-sizing: border-box;
            }
        </style>

        <canvas id="canvas" width="52px" height="52px"></canvas>
        `
    }

    updated() {
        this.refresh()
    }

    /**
     * dessine l'image sur le bouton
     */
    refresh() {
        const canvas = this.shadowRoot.querySelector('canvas')
        const ctx = canvas.getContext("2d");
        let minX = 0, minY = 0, maxX = 0, maxY = 0, scale = 1

        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.strokeStyle = "#000";
        let icon = standardShapes[this.family].shapes.filter(shape => shape.name === this.shape)[0]
            || standardShapes[this.family].shapes[0]
        ctx.translate(26, 26)
        ctx.beginPath();
        ctx.fillStyle = standardShapes[this.family].color

        for (let i = 0; i < icon.steps.length; i++) {
            if (icon.steps[i].type === 'arc') {
                scale = .5
                continue
            }
            minX = Math.min(minX, icon.steps[i].x)
            maxX = Math.max(maxX, icon.steps[i].x)
            minY = Math.min(minY, icon.steps[i].y)
            maxY = Math.max(maxX, icon.steps[i].y)
        }

        if (scale === 1) {
            const largeur = maxX - minX
            const hauteur = maxY - minY
            scale = 40 / Math.max(largeur, hauteur)
        }
        ctx.closePath();
        ctx.scale(scale, scale)
        ctx.moveTo(icon.steps[0].x, icon.steps[0].y);
        for (let i = 1; i < icon.steps.length; i++) {
            if (icon.steps[i].type === "line") {
                ctx.lineTo(icon.steps[i].x, icon.steps[i].y)
            } else {
                ctx.arc(0, 0, Math.abs(icon.steps[0].x), 0, icon.steps[i].angle);
            }
            minX = Math.min(minX, icon.steps[i].x)
            maxX = Math.max(maxX, icon.steps[i].x)
            minY = Math.min(minY, icon.steps[i].y)
            maxY = Math.max(maxX, icon.steps[i].y)
        }
        ctx.fill();
        ctx.stroke();
        ctx.resetTransform()
    }

    /**
     * définir le bouton comme étant le bouton actif
     */
    _isActive(current) {
        if (current === this.family) {
            this.shadowRoot.querySelector('canvas').classList.add('active')
            return
        }
        this.shadowRoot.querySelector('canvas').classList.remove('active')
    }
}
customElements.define('canvas-button', CanvasButton)
