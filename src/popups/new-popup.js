import { LitElement, html } from "lit-element";
import { app } from '../js/App'
import { Workspace } from '../js/Objects/Workspace'

class NewPopup extends LitElement {
    render() {
        return html`
            <style>
                :host {
                    display: none;
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, .5);
                    align-content: center;
                    justify-content: center;
                }

                main {
                    display: block;
                    background: white;
                    padding: 16px;
                    box-shadow: 0 2px 2px rgba(0, 0, 0, .5);
                }

                footer {
                    display: flex;
                    justify-content: space-around;
                }
            </style>

            <main>
                <p>
                Voulez-vous vraiment une nouvelle fenêtre ? <br>
                Attention votre travail actuel sera perdu !
                </p>
                <footer>
                    <button @click="${this.close}">Annuler</button>
                    <button @click="${this.confirm}">OK</button>
                </footer>
            </main>
        `
    }

    confirm() {
        app.wsManager.setWorkspace(app.wsManager.getNewWorkspace('Grandeur'));
        this.close();
    }

    close() {
        this.style.display = 'none'
    }

    open() {
        this.style.display = 'grid'
    }
}
customElements.define('new-popup', NewPopup)
