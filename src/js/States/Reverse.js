import { app } from '../App'
import { ReverseAction } from './Actions/Reverse'
import { State } from './State'
import { distanceBetweenPoints, getAngleOfPoint } from '../Tools/general'

/**
 * Retourner une forme (ou un ensemble de formes liées) sur l'espace de travail
 */
export class ReverseState extends State {

    constructor() {
        super("reverse_shape");

        this.action = null;

        // listen-canvas-click -> selecting-symmetrical-arch -> reversing-shape
        this.currentStep = null;

        //La forme que l'on retourne
        this.selectedShape = null;

        //Timestamp au démarrage de l'animation
        this.startTime = null;

        //Objet représentant l'axe de symétrie utilisée pour le retournement
        this.arch = null;

        //Durée en secondes de l'animation
        this.duration = 2;

        //Longueur en pixels des 4 arcs de symétrie
        this.symmetricalArchLength = 200;

        //Couleur des axes de symétrie
        this.symmetricalArchColor = '#080';

        /*
        L'ensemble des formes liées à la forme sélectionnée (systemGroup  et
        userGroup), y compris la forme elle-même
         */
        this.involvedShapes = [];
    }

    /**
     * (ré-)initialiser l'état
     */
    start() {
        this.action = new ReverseAction(this.name);
        this.currentStep = "listen-canvas-click";

        this.selectedShape = null;
        this.startTime = null;
        this.arch = null;
        this.involvedShapes = [];

        app.interactionAPI.setSelectionConstraints("click",
            {"canShape": "all", "listShape": []},
            {"canSegment": "none", "listSegment": []},
            {"canPoint": "none", "pointTypes": [], "listPoint": []}
        );
        app.interactionAPI.selectObjectBeforeNativeEvent = false;
    }

    /**
     * Appelée par interactionAPI quand une forme est sélectionnée (onClick)
     * @param  {Shape} shape            La forme sélectionnée
     * @param  {{x: float, y: float}} clickCoordinates Les coordonnées du click
     * @param  {Event} event            l'événement javascript
     */
    objectSelected(shape, clickCoordinates, event) {
        if(this.currentStep == "reversing-shape") return;

        this.selectedShape = shape;
        this.involvedShapes = app.workspace.getAllBindedShapes(shape, true);

        this.action.shapeId = shape.id;
        this.action.involvedShapesIds = this.involvedShapes.map(s => s.id);

        app.interactionAPI.setSelectionConstraints("click",
            {"canShape": "notSome", "listShape": [shape]},
            {"canSegment": "none", "listSegment": []},
            {"canPoint": "none", "pointTypes": [], "listPoint": []}
        );

        this.currentStep = "selecting-symmetrical-arch";
        app.drawAPI.askRefresh("upper");
        app.drawAPI.askRefresh();
    }

    /**
     * Appelée lorsque l'événement click est déclanché sur le canvas
     * @param  {{x: float, y: float}} mouseCoordinates les coordonnées de la souris
     * @param  {Event} event     l'événement javascript
     * @return {Boolean}         false: désactive l'appel à objectSelected pour cet événement.
     */
    onClick(mouseCoordinates, event) {
        if(this.currentStep != "selecting-symmetrical-arch") return true;

        let clickDistance = distanceBetweenPoints(this.selectedShape, mouseCoordinates);
        if(clickDistance > this.symmetricalArchLength/2)
            return true; //Le click n'est pas sur les axes de symétrie

        let shapeCenter = this.selectedShape.getAbsoluteCenter(),
            angle = getAngleOfPoint(shapeCenter, mouseCoordinates) % Math.PI;

        if (angle <= Math.PI / 8 || angle > 7 * Math.PI / 8)
            this.action.symmetricalArchOrientation = 'H';
        else if (angle > Math.PI / 8 && angle <= 3 * Math.PI / 8)
            this.action.symmetricalArchOrientation = 'NW';
        else if (angle > 3 * Math.PI / 8 && angle <= 5 * Math.PI / 8)
            this.action.symmetricalArchOrientation = 'V';
        else
            this.action.symmetricalArchOrientation = 'SW';

        this.currentStep = "reversing-shape";
        this.startTime = Date.now();
        this.arch = this.action.getSymmetricalArch();
        this.animate();

        return false;
    }

    /**
     * Gère l'animation du retournement.
     */
    animate() {
        let progress = this.getAnimationProgress();
        if(progress==1) {
            this.executeAction();
            this.start();
            app.drawAPI.askRefresh("upper");
            app.drawAPI.askRefresh();
        } else {
            app.drawAPI.askRefresh("upper");
            setTimeout(() => { //TODO requestAnimFrame
                this.animate();
            }, 100);
            /*
            this.requestAnimFrameId = window.requestAnimFrame(function () {
                that.animate()
            })
             */
        }
    }

    /**
     * Renvoie l'avancement de l'animation de retournement
     * @return {float} avancement, dans l'intervalle [0, 1]
     */
    getAnimationProgress() {
        if(this.currentStep != "reversing-shape") return null;
        let progress = (Date.now() - this.startTime) / (this.duration * 1000);
        return Math.min(progress, 1);
    }



    /**
     * Appelée par la fonction de dessin, lorsqu'il faut dessiner l'action en cours
     * @param  {Context2D} ctx              Le canvas
     * @param  {{x: float, y: float}} mouseCoordinates Les coordonnées de la souris
     */
    draw(ctx, mouseCoordinates) {
        if(this.currentStep == "listen-canvas-click") return;
        if(this.currentStep == "selecting-symmetrical-arch") {
            let shape = this.selectedShape,
                n1 = this.symmetricalArchLength/2,
                n2 = 0.683*this.symmetricalArchLength/2;

            this.involvedShapes.forEach(s => {
                app.drawAPI.drawShape(ctx, s);
            });

            app.drawAPI.drawLine(ctx,
                { 'x': shape.x, 'y': shape.y - n1 },
                { 'x': shape.x, 'y': shape.y + n1 },
                this.symmetricalArchColor, false);
            app.drawAPI.drawLine(ctx,
                { 'x': shape.x - n2, 'y': shape.y - n2 },
                { 'x': shape.x + n2, 'y': shape.y + n2 },
                this.symmetricalArchColor, false);
            app.drawAPI.drawLine(ctx,
                { 'x': shape.x - n1, 'y': shape.y },
                { 'x': shape.x + n1, 'y': shape.y },
                this.symmetricalArchColor, false);
            app.drawAPI.drawLine(ctx,
                { 'x': shape.x - n2, 'y': shape.y + n2 },
                { 'x': shape.x + n2, 'y': shape.y - n2 },
                this.symmetricalArchColor, false);
            return;
        }
        if(this.currentStep == "reversing-shape") {
            //TODO: faire retourner tout le groupe de formes.

            let progress = this.getAnimationProgress(),
                //TODO: opti: ne pas devoir faire une copie à chaque refresh!
                shape = this.selectedShape.copy();

            this.involvedShapes.forEach(s => {
                let s2 = s.copy();
                this.action.reverseShape(s2, this.arch, progress);
                app.drawAPI.drawShape(ctx, s2);
            });

            //Dessiner l'axe:
            let n1 = this.symmetricalArchLength/2,
                n2 = 0.683*this.symmetricalArchLength/2;
            if(this.arch.type=="V") {
                app.drawAPI.drawLine(ctx,
                    { 'x': shape.x, 'y': shape.y - n1 },
                    { 'x': shape.x, 'y': shape.y + n1 },
                    this.symmetricalArchColor, false);
            } else if(this.arch.type=="NW") {
                app.drawAPI.drawLine(ctx,
                    { 'x': shape.x - n2, 'y': shape.y - n2 },
                    { 'x': shape.x + n2, 'y': shape.y + n2 },
                    this.symmetricalArchColor, false);
            } else if(this.arch.type=="H") {
                app.drawAPI.drawLine(ctx,
                    { 'x': shape.x - n1, 'y': shape.y },
                    { 'x': shape.x + n1, 'y': shape.y },
                    this.symmetricalArchColor, false);
            } else { // SW
                app.drawAPI.drawLine(ctx,
                    { 'x': shape.x - n2, 'y': shape.y + n2 },
                    { 'x': shape.x + n2, 'y': shape.y - n2 },
                    this.symmetricalArchColor, false);
            }
            return;
        }

    }

    /**
     * Appelée par la fonction de dessin, renvoie les formes qu'il ne faut pas
     * dessiner sur le canvas principal.
     * @return {[Shape]} les formes à ne pas dessiner
     */
    getEditingShapes() {
        if(this.currentStep == "listen-canvas-click") return [];
        return this.involvedShapes;
    }
}
