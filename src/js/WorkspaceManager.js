import { app } from './App'
import { Workspace } from './Objects/Workspace'


export class WorkspaceManager {
    constructor() {
        //Local storage reference
        this.ls = window.localStorage;

        //Init localStorage if necessary
        if(this.ls.getItem("AG_WorkspacesAmount") == null) {
            this.ls.setItem("AG_WorkspacesAmount", 0);
        }
    }

    /**
     * Définir l'espace de travail actuel
     * @param {Workspace} workspace
     */
    setWorkspace(workspace) {
        app.workspace = workspace;
        //TODO: update drawAPI (zoom, scale)
        //TODO: refresh.
    }


    /* #################################################################### */
    /* ########################### LOCALSTORAGE ########################### */
    /* #################################################################### */


    /**
     * Sauvegarder un espace de travail dans le localStorage
     * @param  {Workspace} workspace
     * @param  {String} [name="Unnamed"] Nom de l'espace de travail
     */
    saveWorkspaceToLocalStorage(workspace, name = "Unnamed") {
        let json = workspace.saveToJSON(),
            index = parseInt(this.ls.getItem("AG_WorkspacesAmount"));

        this.ls.setItem("AG_WorkspacesAmount", index + 1);
        this.ls.setItem("AG_WSList_WS" + index + "_uniqid", workspace.id);
        this.ls.setItem("AG_WSList_WS" + index + "_name", name);
        this.ls.setItem("AG_WSList_WS" + index + "_data", json);
    }

    /**
     * Récupérer un workspace sauvegardé dans le localStorage à partir de son
     * identifiant unique.
     * @param  {String} uniqid    l'identifiant unique
     * @return {Workspace}        le Workspace, ou null si l'id n'est pas bon.
     */
    getWorkspaceFromLocalStorage(uniqid) {
        let wsAmount = parseInt(this.ls.getItem("AG_WorkspacesAmount"));
        for(let i=0; i<wsAmount; i++) {
            let val = this.ls.getItem("AG_WSList_WS" + i + "_uniqid");
            if (val == uniqid) {
                let json = this.ls.getItem("AG_WSList_WS" + i + "_data"),
                    ws = new Workspace();
                ws.initFromJSON(json);
                return ws;
            }
        }
        return null;
    }

    /**
     * Renvoie la liste des workspace enregistrés (id et nom).
     * @return {[{id, name}]}
     */
    getStoredWorkspaces() {
        let wsAmount = parseInt(this.ls.getItem("AG_WorkspacesAmount")),
            names = [];
        for(let i=0; i<wsAmount; i++) {
            names.push({
                'id': this.ls.getItem("AG_WSList_WS" + i + "_uniqid"),
                'name': this.ls.getItem("AG_WSList_WS" + i + "_name")
            });
        }
        return names;
    }

    /**
     * Supprimer un workspace du localStorage
     * @param  {[type]} uniqid id unique du workspace
     */
    deleteWorkspaceFromLocalStorage(uniqid) {
        //Find index:
        let wsAmount = parseInt(this.ls.getItem("AG_WorkspacesAmount")),
            index = -1;
        for(let i=0; i<wsAmount; i++) {
            let val = this.ls.getItem("AG_WSList_WS" + i + "_uniqid");
            if (val == uniqid) {
                index = i;
                break;
            }
        }
        if(index==-1) {
            console.error("Workspace not found");
            return;
        }

        //Décale les Workspace suivants vers la gauche.
        for(let i = index+1; i<wsAmount; i++) {
            let uniqid = this.ls.getItem("AG_WSList_WS" + i + "_data"),
                name = this.ls.getItem("AG_WSList_WS" + i + "_data"),
                json = this.ls.getItem("AG_WSList_WS" + i + "_data");

            this.ls.setItem("AG_WSList_WS" + (i - 1) + "_uniqid", uniqid);
            this.ls.setItem("AG_WSList_WS" + (i - 1) + "_name", name);
            this.ls.setItem("AG_WSList_WS" + (i - 1) + "_data", json);
        }

        this.ls.setItem("AG_WorkspacesAmount", wsAmount - 1);
    }

    /* #################################################################### */
    /* #################### IMPORT/EXPORT FROM/TO FILE #################### */
    /* #################################################################### */


    /**
     * Récupérer un espace de travail depuis un fichier (async), puis appeler
     * le callback (avec l'objet Workspace en paramètre)
     * @param  {File} file Le fichier
     */
    getWorkspaceFromFile(file, callback) {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = () => {
			let ws = new Workspace();
            ws.initFromJSON(reader.result);
            callback(ws);
		}
    }


}
