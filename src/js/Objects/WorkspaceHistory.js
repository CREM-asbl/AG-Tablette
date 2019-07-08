
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
    }
}
