import { app } from '../../App'
import { Action } from './Action'
import { Shape } from '../../Objects/Shape'

export class BorderColorAction extends Action {
    constructor(name) {
        super(name);

        //L'id de la forme dont on va colorier les bords
        this.shapeId = null;

        //La couleur
        this.selectedColor = null;

        /*
        Liste des formes solidaires à la la forme dont on colorie les bords, y compris
        la forme elle-même
         */
        this.involvedShapesIds = [];

        //Pour chaque forme de involvedShapesIds, la couleur initiale
        this.oldColors = [];
    }

    checkDoParameters() {
        if(!this.shapeId || !this.selectedColor)
            return false;
        return true;
    }

    checkUndoParameters() {
        if(!this.shapeId)
            return false;
        if(this.oldColors.length != this.involvedShapesIds.length)
            return false;
        return true;
    }

    do() {
        if(!this.checkDoParameters()) return;

        this.oldColors = [];
        this.involvedShapesIds.forEach(id => {
            let s = app.workspace.getShapeById(id);
            this.oldColors.push(s.borderColor);
            s.borderColor = this.selectedColor;
        });
    }

    undo() {
        if(!this.checkUndoParameters()) return;

        let shape = app.workspace.getShapeById(this.shapeId);

        this.involvedShapesIds.forEach((id, index) => {
            let s = app.workspace.getShapeById(id);
            s.borderColor = this.oldColors[index];
        });
    }


    //TODO: enregistrer les valeurs pertinentes des
    //      paramètres (ex: ajustement automatique activé?)
}
