import { StatesManager } from '../StatesManager'

import  { BackgroundColorAction } from '../States/Actions/BackgroundColor.js'
import  { BorderColorAction } from '../States/Actions/BorderColor.js'
import  { BuildCenterAction } from '../States/Actions/BuildCenter.js'
import  { CreateAction } from '../States/Actions/Create.js'
import  { DeleteAction } from '../States/Actions/Delete.js'
import  { CopyAction } from '../States/Actions/Copy.js'
import  { GroupAction } from '../States/Actions/Group.js'
import  { MoveAction } from '../States/Actions/Move.js'
import  { ReverseAction } from '../States/Actions/Reverse.js'
import  { RotateAction } from '../States/Actions/Rotate.js'
import  { TranslatePlaneAction } from '../States/Actions/TranslatePlane.js'
import  { UngroupAction } from '../States/Actions/Ungroup.js'
import  { ZoomPlaneAction } from '../States/Actions/ZoomPlane.js'


/**
 * Représente l'historique d'un espace de travail.
 */
export class WorkspaceHistory {
    constructor() {
        //Historique des actions
        this.history = [];

        //Index de la dernière tâche réalisée
        this.historyIndex = -1;
    }

    /**
     * Met à jour les boutons "Annuler" et "Refaire" du menu (définir l'attribut
     * disabled de ces deux boutons)
     */
    updateMenuState() {
        app.appDiv.canUndo = this.canUndo();
        app.appDiv.canRedo = this.canRedo();
    }

    saveToObject() {
        let save = {
            'historyIndex': this.historyIndex,
            'history': this.history.map(action => {
                return {
                    'className': action.constructor.name,
                    'data': action.saveToObject()
                };
            })
        };
        return save;
    }

    initFromObject(object) {
        this.historyIndex = object.historyIndex;
        this.history = object.history.map(actionData => {
            if(StatesManager.registeredActions.includes(actionData.className)) {
                //Attention avec eval: bien contrôler ce qui est envoyé.
                //TODO: faire ça autrement?
                let action = eval("new " + actionData.className + "()");
                action.initFromObject(actionData.data);
                return action;
            } else {
                console.error("unknown action class: "+actionData.className);
                console.log(actionData);
                return null;
            }
        });

        this.updateMenuState();
    }

    /**
     * Renvoie true si undo() peut être appelé.
     * @return {Boolean}
     */
    canUndo() {
        return this.historyIndex != -1;
    }

    /**
     * Renvoie true si redo() peut être appelé.
     * @return {Boolean}
     */
    canRedo() {
        return this.historyIndex+1 < this.history.length;
    }

    /**
     * Annuler une action. Cela fait reculer le curseur de l'historique d'un
     * élément.
     */
    undo() {
        if(!this.canUndo()) {
            console.error("Nothing to undo");
            return;
        }
        this.history[this.historyIndex--].undo();
        app.drawAPI.askRefresh();
        this.updateMenuState();
    }

    /**
     * Refaire l'action qui vient d'être annulée. Cela fait avancer le curseur
     * de l'historique d'un élément.
     */
    redo() {
        if(!this.canRedo()) {
            console.error("Nothing to redo");
            return;
        }
        this.history[++this.historyIndex].do();
        app.drawAPI.askRefresh();
        this.updateMenuState();
    }

    /**
     * Ajouter une action à l'historique (l'action n'est pas exécutée, il est
     * supposé qu'elle a déjà été exécutée).
     * @param {Action} action L'action ajoutée
     */
    addAction(action) {
        this.history.splice(this.historyIndex+1);
        this.history.push(action);
        this.historyIndex++;

        this.updateMenuState();
    }
}
