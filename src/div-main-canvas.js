import { LitElement, html } from 'lit-element'
import { App } from './js/App'

class DivMainCanvas extends LitElement {

    render() {
        return html`
        <style>
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
        <canvas id="backgroundCanvas"></canvas>
        <canvas id="mainCanvas"></canvas>
        `
    }

    /**
    * Défini les event-handlers du <canvas>
    */
    firstUpdated() {

        this.cvs = this.shadowRoot.querySelector('#mainCanvas')

        this.backgroundCvs = this.shadowRoot.querySelector('#backgroundCanvas')

        window.app = new App(this, this.cvs, this.backgroundCvs);
        window.app.start();

        this.setCanvasSize()

        this.cvs.addEventListener('click', function (event) {
            window.app.handleEvent("click", this.getMousePos(event, window.app));
        }.bind(this), false);

        this.cvs.addEventListener('mousedown', function (event) {
            window.app.handleEvent("mousedown", this.getMousePos(event, window.app));
        }.bind(this), false);

        this.cvs.addEventListener('mouseup', function (event) {
            window.app.handleEvent("mouseup", this.getMousePos(event, window.app));
        }.bind(this), false);

        this.cvs.addEventListener('mousemove', this._handleMove.bind(this), false);

        //Tablette:
        this.cvs.addEventListener('touchstart', function (event) {

            if (event.touches.length > 1)
                return;

            event.preventDefault();
            window.app.handleEvent("mousedown", this.getMousePos(event, window.app));
        }.bind(this), false);

        this.cvs.addEventListener('touchmove', function (event) {
            event.preventDefault();
            this._handleMove(event);
        }.bind(this), false);

        this.cvs.addEventListener('touchend', function (event) {
            var pos = this.getMousePos(event, window.app);
            window.app.handleEvent("mouseup", pos);
            window.app.handleEvent("click", pos);
        }.bind(this), false);

        this.cvs.addEventListener('touchleave', function (event) {
            var pos = this.getMousePos(event, window.app);
            window.app.handleEvent("mouseup", pos);
            window.app.handleEvent("click", pos);
        }.bind(this), false);

        this.cvs.addEventListener("touchcancel", function (event) {
            event.preventDefault();
            window.app.handleEvent("mouseup", this.getMousePos(event, window.app));
        }.bind(this), false);

        //TODO?
        //cvs.addEventListener("touchcancel", handleCancel, false);
    }

    // updated() {
    //     this.setCanvasSize()
    // }

    /**
     * Défini les attributs width and height du <canvas>. Doit être appelé au démarrage et lorsque la page est redimensionnée.
     */
    setCanvasSize() {
        this.cvs.setAttribute("height", this.parentElement.clientHeight);
        this.cvs.setAttribute("width", this.parentElement.clientWidth * 0.8);
        this.backgroundCvs.setAttribute("height", this.parentElement.clientHeight);
        this.backgroundCvs.setAttribute("width", this.parentElement.clientWidth * 0.8);
    }

    /**
     * Récupère les coordonnées de la souris à partir d'un événement javascript
     * @param event: référence vers l'événement (Event)
     * @return coordonnées de la souris ({x: int, y: int})
     * @Error: si les coordonnées n'ont pas été trouvées, une alerte (alert()) est déclanchée et la fonction retourne null
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
            alert(str);

            if (event.touches) {
                str = "touches: " + event.touches.length + "";
                for (var property1 in event["touches"][0]) {
                    str += " | " + property1 + " : " + ["touches"][0][property1];
                }
                alert(str);
            }
            return null;
        }

        response = [response[0] / appRef.workspace.zoomLevel, response[1] / appRef.workspace.zoomLevel];
        response = [response[0] - window.app.workspace.translateOffset.x, response[1] - window.app.workspace.translateOffset.y];
        return { "x": response[0], "y": response[1] };
    }

    /**
     * Appelée lorsque l'événement mousemove est déclanché sur le canvas
     */
    _handleMove(event) {
        window.app.canvas.refresh(this.getMousePos(event, window.app), { 'event_type': 'mousemove' });
    }

    getScreenShot() {
        let url = this.cvs.toDataURL()
        // TODO: Remplacer par un vrai système d'enregistrement de fichier 
        window.open(url, '_blank')
    }

}
customElements.define('div-main-canvas', DivMainCanvas)
