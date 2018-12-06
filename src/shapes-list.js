import { LitElement, html } from '@polymer/lit-element'

class ShapesList extends LitElement {

    static get properties() {
        return {
            family: String
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
                position: absolute;
                top: 50px;
                left: 33%;
                box-shadow: 1px 1px 2px gray;
                width: 160px;
                padding: 1px;
            }

            h2 {
                margin: 0;
                text-align: center;
                background: gray;
                color: white;
            }

            button {
                width: 100%;
                padding: 8px;
            }

            button:hover,
            button:focus {
                font-weight: bold;
            }
        </style>

        <h2>Formes</h2>
        ${shapes.map(shape => html`
            <button @click="${this._clickHandle.bind(this)}" name="${shape}">${shape}</button>
        `)}
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
        this.dispatchEvent(new CustomEvent('selected-shape'));
    }
}
customElements.define('shapes-list', ShapesList)