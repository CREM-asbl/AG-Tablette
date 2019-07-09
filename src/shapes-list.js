import { LitElement, html } from 'lit-element'

class ShapesList extends LitElement {

    static get properties() {
        return {
            show: Boolean,
            family: String
        }
    }

    set state({ currentStep, selectedFamily }) {
        this.family = selectedFamily
        this.show = currentStep === 'show-family-shapes'
    }

    render() {
        if (!this.show) {
            return html``
        }

        const shapes = app.workspace.getFamily(this.family).getShapesNames()

        return html`
        <style>
            :host {
                display: block;
            }

            h2 {
                margin: 0;
                text-align: center;
                background: gray;
                color: white;
            }

            ul {
                display: flex;
                margin: 0;
                padding: 0;
                list-style: none;
                overflow-x: auto;
                overflow-y: hidden;
            }

            li {
                margin: 0;
                padding: 0;
                height: 54px;
            }
        </style>

        <h2>Famille du ${this.family}</h2>
        <ul>
            ${shapes.map(shape => html`
                <li>
                    <canvas-button title="${shape}"
                                   family="${this.family}"
                                   shape="${shape}"
                                   @click="${this._clickHandle}">
                    </canvas-button>
                </li>
            `)}
        </ul>
        `
    }

    /**
     * Met à jour l'état de l'application lorsque l'on clique sur le nom d'une forme
     */
    _clickHandle(event) {
        const familyRef = window.app.workspace.getFamily(this.family);
        const shapeRef = familyRef.getShape(event.target.shape);
        app.state.setShape(shapeRef)
        this.show = false
    }
}
customElements.define('shapes-list', ShapesList)
