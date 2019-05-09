import { LitElement, html } from 'lit-element'

class ShapesList extends LitElement {

    static get properties() {
        return {
            family: String,
            name: String
        }
    }

    render() {

        if(!this.family || this.family === 'undefined') { 
            return html``
        }

        const shapes = window.app.workspace.getFamily(this.family).getShapesNames()

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
                height: 32px;
                padding: 8px;
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
                    <button @click="${this._clickHandle.bind(this)}" name="${shape}">${shape}</button>
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
        event.target.focus();

        window.app.setState("create_shape", {
          "family": familyRef,
          "shape": shapeRef
        });

        this.family = null
    }
}
customElements.define('shapes-list', ShapesList)
