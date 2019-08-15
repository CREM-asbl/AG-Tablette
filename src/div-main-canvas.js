import { LitElement, html } from 'lit-element'
import { app } from './js/App'
import { DrawAPI } from './js/DrawAPI'

class DivMainCanvas extends LitElement {

    static get properties() {
        return {
            background: String
        }
    }

    render() {
        return html`
        <style>
            canvas#upperCanvas,
            canvas#mainCanvas,
            canvas#debugCanvas,
            canvas#invisibleCanvas {
                background-color: rgba(0,0,0,0);
                position: absolute;
                top: 0px;
            }
            canvas#backgroundCanvas {
                background-color: #FFF;
                position: absolute;
                top: 0px;
            }
        </style>

        <!-- for background tasks (invisible canvas) -->
        <canvas id="invisibleCanvas"></canvas>

        <!--for the grid and background-image -->
        <canvas id="backgroundCanvas"></canvas>

        <!-- for the shapes -->
        <canvas id="mainCanvas"></canvas>

        <!-- temporaire, pour afficher des messages d'erreur -->
        <canvas id="debugCanvas"></canvas>

        <!-- for the current event (ex: moving shape -->
        <canvas id="upperCanvas"></canvas>
        `
    }

    /**
    * Défini les event-handlers du <canvas>
    */
    firstUpdated() {
        this.upperCanvas = this.shadowRoot.querySelector('#upperCanvas');
        this.mainCanvas = this.shadowRoot.querySelector('#mainCanvas');
        this.backgroundCanvas = this.shadowRoot.querySelector('#backgroundCanvas');
        this.invisibleCanvas = this.shadowRoot.querySelector('#invisibleCanvas');

        window.app = app;
        let drawAPI = new DrawAPI(
                this.upperCanvas,
                this.mainCanvas,
                this.backgroundCanvas,
                this.invisibleCanvas
            );
        app.drawAPI = drawAPI;

        //temporaire:
        this.debugCanvas = this.shadowRoot.querySelector('#debugCanvas');
        app.__debugCtx = this.debugCanvas.getContext("2d");


        this.setCanvasSize();
        app.start(this);

        //Events:
        this.upperCanvas.addEventListener('click', event => {
            let mousePos = this.getMousePos(event);
            window.app.interactionAPI.onClick(mousePos, event);
        });

        this.upperCanvas.addEventListener('mousedown', event => {
            let mousePos = this.getMousePos(event);
            window.app.interactionAPI.onMouseDown(mousePos, event);
        });

        this.upperCanvas.addEventListener('mouseup', event => {
            let mousePos = this.getMousePos(event);
            window.app.interactionAPI.onMouseUp(mousePos, event);
        });

        this.upperCanvas.addEventListener('mousemove', event => {
            let mousePos = this.getMousePos(event);
            window.app.interactionAPI.onMouseMove(mousePos, event);
        });

        this.upperCanvas.addEventListener('touchstart', event => {
            let mousePos = this.getMousePos(event);
            window.app.interactionAPI.onTouchStart(mousePos, event);
        });

        this.upperCanvas.addEventListener('touchmove', event => {
            let mousePos = this.getMousePos(event);
            window.app.interactionAPI.onTouchMove(mousePos, event);
        });

        this.upperCanvas.addEventListener('touchend', event => {
            let mousePos = this.getMousePos(event);
            window.app.interactionAPI.onTouchEnd(mousePos, event);
        });

        this.upperCanvas.addEventListener('touchleave', event => {
            let mousePos = this.getMousePos(event);
            window.app.interactionAPI.onTouchLeave(mousePos, event);
        });

        this.upperCanvas.addEventListener('touchcancel', event => {
            let mousePos = this.getMousePos(event);
            window.app.interactionAPI.onTouchCancel(mousePos, event);
        });
    }

    /**
     * Défini les attributs width and height des 3 <canvas>.
     * Doit être appelé au démarrage et lorsque la page est redimensionnée.
     */
    setCanvasSize() {
        this.upperCanvas.setAttribute("height", this.clientHeight);
        this.mainCanvas.setAttribute("height", this.clientHeight);
        this.backgroundCanvas.setAttribute("height", this.clientHeight);
        this.debugCanvas.setAttribute("height", this.clientHeight);
        this.invisibleCanvas.setAttribute("height", this.clientHeight);

        this.upperCanvas.setAttribute("width", this.clientWidth);
        this.mainCanvas.setAttribute("width", this.clientWidth);
        this.backgroundCanvas.setAttribute("width", this.clientWidth);
        this.debugCanvas.setAttribute("width", this.clientWidth);
        this.invisibleCanvas.setAttribute("width", this.clientWidth);

        /*
        Lorsque le canvas est redimensionné, la translation et le zoom (scaling)
        sont réinitialisés, il faut donc les réappliquer.
         */
        app.drawAPI.resetTransformations();
        app.drawAPI.translateView(app.workspace.translateOffset);
        app.drawAPI.scaleView(app.workspace.zoomLevel);

        app.drawAPI.askRefresh("main");
        app.drawAPI.askRefresh("upper");
        app.drawAPI.askRefresh("background");

        let leftShift = document.getElementsByTagName("ag-tablette-app")[0]
                        .shadowRoot.getElementById("app-canvas-view-toolbar")
                        .clientWidth;
        window.canvasLeftShift = leftShift;
    }

    /**
     * Récupère les coordonnées de la souris à partir d'un événement javascript
     * @param event: référence vers l'événement (Event)
     * @return coordonnées de la souris ({x: int, y: int})
     * @Error: si les coordonnées n'ont pas été trouvées, une alerte (alert())
     *  est déclanchée et la fonction retourne null
     */
    getMousePos(event, appRef) {

        var response = null;

        if (event.changedTouches && event.changedTouches[0] && event.changedTouches[0].clientX !== undefined) {
            response = [event.changedTouches[0].clientX - window.canvasLeftShift, event.changedTouches[0].clientY];
        }
        else if (event.offsetX !== undefined) {
            response = [event.offsetX, event.offsetY];
        } else if (event.layerX !== undefined) {
            response = [event.layerX, event.layerY];
        } else if (event.clientX !== undefined) {
            response = [event.clientX, event.clientY];
        } else if (event.pageX !== undefined) {
            response = [event.pageX, event.pageY];
        } else if (event.x !== undefined) {
            response = [event.x, event.y];
        } else {
            alert("navigator not compatible");
            //TODO: envoyer un rapport d'erreur...
            var str = event.type;
            for (var property1 in event) {
                str += " | " + property1 + " : " + event[property1];
            }
            console.error(str);

            if (event.touches) {
                str = "touches: " + event.touches.length + "";
                for (var property1 in event["touches"][0]) {
                    str += " | " + property1 + " : " + ["touches"][0][property1];
                }
                console.error(str);
            }
            return null;
        }

        response = [response[0] - app.workspace.translateOffset.x, response[1] - app.workspace.translateOffset.y];
        response = [response[0] / app.workspace.zoomLevel, response[1] / app.workspace.zoomLevel];
        return { "x": response[0], "y": response[1] };
    }

    // Ajout d'un fond d'écran fixé à droite
    set background(value) {
        this.style.display = 'block'
        this.style.background = `url('${value}') no-repeat right`
    }

}
customElements.define('div-main-canvas', DivMainCanvas)
