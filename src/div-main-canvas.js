import { LitElement, html } from 'lit-element'
import { app } from './js/App'

class DivMainCanvas extends LitElement {

    render() {
        return html`
        <style>
            canvas#upperCanvas {
                background-color: rgba(0,0,0,0);
                position: absolute;
                top: 0px;
            }
            canvas#mainCanvas {
                background-color: rgba(0,0,0,0);
                position: absolute;
                top: 0px;
            }
            canvas#backgroundCanvas {
                position: absolute;
                top: 0px;
            }
        </style>
        <canvas id="backgroundCanvas"></canvas> <!--for the grid and background-image -->
        <canvas id="mainCanvas"></canvas> <!-- for the shapes -->
        <canvas id="upperCanvas"></canvas> <!-- for the current event (ex: moving shape -->
        `
    }

    /**
    * Défini les event-handlers du <canvas>
    */
    firstUpdated() {
        this.upperCanvas = this.shadowRoot.querySelector('#upperCanvas');
        this.mainCanvas = this.shadowRoot.querySelector('#mainCanvas')
        this.backgroundCanvas = this.shadowRoot.querySelector('#backgroundCanvas')

        window.app = app;
        app.setCanvas(this.upperCanvas, this.mainCanvas, this.backgroundCanvas);
        this.setCanvasSize();
        app.start();



        this.upperCanvas.addEventListener('click', event => {
            window.app.interactionAPI.onClick(this.getMousePos(event, window.app), event);
        });

        this.upperCanvas.addEventListener('mousedown', event => {
            window.app.interactionAPI.onMouseDown(this.getMousePos(event, window.app), event);
        });

        this.upperCanvas.addEventListener('mouseup', event => {
            window.app.interactionAPI.onMouseUp(this.getMousePos(event, window.app), event);
        });

        this.upperCanvas.addEventListener('mousemove', event => {
            window.app.interactionAPI.onMouseMove(this.getMousePos(event, window.app), event);
        });

        this.upperCanvas.addEventListener('touchstart', event => {
            if (event.touches.length > 1)
                return;
            event.preventDefault();
            window.app.interactionAPI.onTouchStart(this.getMousePos(event, window.app), event);
        });

        this.upperCanvas.addEventListener('touchmove', event => {
            event.preventDefault();
            window.app.interactionAPI.onTouchMove(this.getMousePos(event, window.app), event);
        });

        this.upperCanvas.addEventListener('touchend', event => {
            window.app.interactionAPI.onTouchEnd(this.getMousePos(event, window.app), event);
        });

        this.upperCanvas.addEventListener('touchleave', event => {
            window.app.interactionAPI.onTouchLeave(this.getMousePos(event, window.app), event);
        });

        this.upperCanvas.addEventListener('touchcancel', event => {
            window.app.interactionAPI.onTouchCancel(this.getMousePos(event, window.app), event);
        });
    }

    /**
     * Défini les attributs width and height des 3 <canvas>.
     * Doit être appelé au démarrage et lorsque la page est redimensionnée.
     */
    setCanvasSize() {
        this.upperCanvas.setAttribute("height", this.parentElement.clientHeight);
        this.mainCanvas.setAttribute("height", this.parentElement.clientHeight);
        this.backgroundCanvas.setAttribute("height", this.parentElement.clientHeight);

        this.upperCanvas.setAttribute("width", this.parentElement.clientWidth * 0.8);
        this.mainCanvas.setAttribute("width", this.parentElement.clientWidth * 0.8);
        this.backgroundCanvas.setAttribute("width", this.parentElement.clientWidth * 0.8);

        app.drawAPI.askRefresh("main");
        app.drawAPI.askRefresh("upper");
        app.drawAPI.askRefresh("background");
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

    /*
    getScreenShot() {
        let url = this.mainCanvas.toDataURL()
        // TODO: Remplacer par un vrai système d'enregistrement de fichier
        window.open(url, '_blank')
    }*/

}
customElements.define('div-main-canvas', DivMainCanvas)
