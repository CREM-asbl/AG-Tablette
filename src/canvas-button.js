import { LitElement, html } from 'lit-element'

class CanvasButton extends LitElement {

    static get properties() {
        return {
            family: String,
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
                width: 100%;
                height: 100%;
                background: #fff;
                border: 1px solid black;
            }
        </style>

        <canvas id="canvas" width="60px" height="60px"></canvas>
        `
    }

    updated() {
        this._draw(this.family)
    }

    /**
     * dessine l'image sur le bouton
     */
    _draw(family) {
        const ctx = this.shadowRoot.querySelector('canvas').getContext("2d");
        ctx.strokeStyle = "#000";
        if(family=="Triangle équilatéral") {
            ctx.fillStyle = "#FF0";
            ctx.beginPath();
            ctx.moveTo(7,52);
            ctx.lineTo(30, 11);
            ctx.lineTo(53,52);
            ctx.lineTo(7,52);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else if(family=="Carré") {
            ctx.fillStyle = "red";
            ctx.fillRect(7,7,46,46);
            ctx.strokeRect(7,7,46,46);
        } else if(family=="Pentagone régulier") {
            ctx.fillStyle = "#0F0";
            ctx.beginPath();
            ctx.moveTo(15,50);
            ctx.lineTo(7, 26);
            ctx.lineTo(30,9);
            ctx.lineTo(53,26);
            ctx.lineTo(45,50);
            ctx.lineTo(15,50);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else {
            console.error("_draw(family): famille inconnue");
        }
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
