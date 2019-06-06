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
                overflow: auto;
            }

            h2 {
                margin: 0;
                text-align: center;
                background: gray;
                color: white;
            }

            ul {
                margin: 0;
                padding: 0;
                list-style: none;
            }

            button {
                width: 100%;
                padding: 16px;
            }

            button:hover,
            button:focus {
                font-weight: bold;
            }
        </style>

        <h2>Formes</h2>
        <ul>
            ${shapes.map(shape => html`
                <li>
                    <button @click="${this._clickHandle}" 
                            name="${shape}">
                            ${shape}
                    </button>
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
        const shapeRef = familyRef.getShape(event.target.name);
        app.state.setShape(shapeRef)
        this.show = false
    }
}
customElements.define('shapes-list', ShapesList)
