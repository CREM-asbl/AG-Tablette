/**
 * Permet de sauvegarder et restaurer un espace de travail (Workspace),
 * en utilisant le localStorage du navigateur.
 */
import { Workspace } from './Workspace'
import { Shape } from './Shape'
import { ShapeStep } from './ShapeStep'
import { Family } from './Family'

export class Storer {
    constructor() {
        this.__init();
    }

    /**
     * Initialise le local storage si c'est le premier lancement de l'application.
     */
    __init() {
        if (window.localStorage.getItem("AG_WorkspacesAmount") != null)
            return;

        window.localStorage.setItem("AG_WorkspacesAmount", 0);
    };

    /**
     * Sauvegarder un Workspace dans le localStorage
     * @param  {Workspace} workspace le Workspace à sauvegarder
     * @param  {String} name      un nom pour le workspace (à choisir)
     */
    saveWorkspace(workspace, name) {

        if (name === undefined)
            name = "Espace de travail sans nom";

        let wsdata = { name: name, ...workspace.getSaveData() }

        //Store:
        var json_string = JSON.stringify(wsdata);

        let index = parseInt(window.localStorage.getItem("AG_WorkspacesAmount"));
        window.localStorage.setItem("AG_WorkspacesAmount", index + 1);

        window.localStorage.setItem("AG_WSList_WS" + index + "_uniqid", wsdata.uniqid);
        window.localStorage.setItem("AG_WSList_WS" + index + "_name", name);
        window.localStorage.setItem("AG_WSList_WS" + index + "_data", json_string);
    }

    getWorkspaceIndex(uniqid) {
        var wsAmount = parseInt(window.localStorage.getItem("AG_WorkspacesAmount")); //TODO: si null
        for (var i = 0; i < wsAmount; i++) {
            var val = window.localStorage.getItem("AG_WSList_WS" + i + "_uniqid");
            if (val == uniqid)
                return i;
        }
        return -1;
    };

    /**
     * Récupérer un workspace sauvegardé à partir de son identifiant unique
     * @param  {String} uniqid l'identifiant unique
     * @return {Workspace}        le Workspace
     */
    getWorkspace(uniqid) {
        var app = app;
        var wsAmount = parseInt(window.localStorage.getItem("AG_WorkspacesAmount"));
        for (var i = 0; i < wsAmount; i++) {
            var val = window.localStorage.getItem("AG_WSList_WS" + i + "_uniqid");
            if (val == uniqid) {
                //Extract data:
                var json_string = window.localStorage.getItem("AG_WSList_WS" + i + "_data");
                var wsdata = JSON.parse(json_string);
                var ws = new Workspace(app);
                ws.appVersion = wsdata.appVersion;
                ws.menuId = wsdata.menuId;
                ws.nextShapeId = wsdata.nextShapeId;
                ws.nextFamilyId = wsdata.nextFamilyId;
                ws.zoomLevel = wsdata.zoomLevel;

                //history:
                ws.history.steps = wsdata.history;

                //shapesList:
                ws.shapesList = wsdata.shapesList.map(function (val) {
                    var shape = Shape.createFromSaveData(val, ws, true);
                    return shape;
                });
                ws.shapesList = ws.shapesList.map(function (val, i) {
                    return Shape.createFromSaveData(wsdata.shapesList[i], ws, false, val);
                });

                //families:
                ws.families = wsdata.families.map(function (data) {
                    var family = new Family(
                        data.name,
                        data.defaultColor
                    );
                    family.shapesList = data.shapesList.map(function (data2) {
                        return {
                            'color': data2.color,
                            'name': data2.name,
                            'refPoint': data2.refPoint,
                            'buildSteps': data2.buildSteps.map(function (data3) {
                                return ShapeStep.createFromSaveData(data3);
                            })
                        };
                    });
                    return family;
                });

                //systemShapeGroups & userShapeGroups:
                const mapFct = group => {
                    return group.map(function (shapeId) {
                        var shape = ws.shapesList.find(function (val) {
                            return val.id == shapeId;
                        });
                        if (!shape) {
                            console.error("Storer: error retrieving Shape");
                            return null;
                        }
                        return shape;
                    });
                };
                ws.systemShapeGroups = wsdata.systemShapeGroups.map(mapFct);
                ws.userShapeGroups = wsdata.userShapeGroups.map(mapFct);

                return ws;
            }
        }
        return null;
    }

    /**
     * Récupérer un workspace à partir de son nom
     * @param  {String} name nom du Workspace
     * @return {Workspace}      le Workspace
     */
    getWorkspaceByName(name) {
        var wsAmount = parseInt(window.localStorage.getItem("AG_WorkspacesAmount"));
        for (var i = wsAmount - 1; i >= 0; i--) {
            var val = window.localStorage.getItem("AG_WSList_WS" + i + "_name");
            if (val == name) {
                window.localStorage.getItem("AG_WSList_WS" + i + "_name");
                var uniqid = window.localStorage.getItem("AG_WSList_WS" + i + "_uniqid");
                return this.getWorkspace(uniqid);
            }
        }
        return null;
    };

    /**
     * Renvoie le nombre de workspaces existants.
     * @return {[type]} [description]
     */
    getAmountStoredWorkspaces() {
        return parseInt(window.localStorage.getItem("AG_WorkspacesAmount"));
    };

    /**
     * Renvoie la liste des workspaces existants
     * @return {[{'name': String, 'uniqid': String}]} workspaces existants
     */
    getWorkspacesList() {
        var len = this.getAmountStoredWorkspaces();
        var list = [];
        for (var i = 0; i < len; i++) {
            list.push({
                'name': window.localStorage.getItem("AG_WSList_WS" + i + "_name"),
                'uniqid': window.localStorage.getItem("AG_WSList_WS" + i + "_uniqid")
            });
        }
        return list;
    };

    /**
     * Supprimer un workspace
     * @param  {[type]} uniqid id unique du workspace
     * @return {Boolean}        false si le workspace n'existe pas, true sinon.
     */
    deleteWorkspace(uniqid) {
        var index = this.getWorkspaceIndex(uniqid);
        if (index == -1) {
            console.error("this Workspace does not exist");
            return false;
        }

        //Décaler les workspace suivants de 1 vers la gauche dans la liste.
        //Cela écrase le workspace qui doit être supprimé.
        var len = this.getAmountStoredWorkspaces();
        for (var i = index + 1; i < len; i++) {
            var json_string = window.localStorage.getItem("AG_WSList_WS" + i + "_data");
            var name = window.localStorage.getItem("AG_WSList_WS" + i + "_data");
            var uniqid = window.localStorage.getItem("AG_WSList_WS" + i + "_data");

            window.localStorage.setItem("AG_WSList_WS" + (i - 1) + "_uniqid", uniqid);
            window.localStorage.setItem("AG_WSList_WS" + (i - 1) + "_name", name);
            window.localStorage.setItem("AG_WSList_WS" + (i - 1) + "_data", json_string);
        }
        window.localStorage.removeItem("AG_WSList_WS" + (len - 1) + "_uniqid");
        window.localStorage.removeItem("AG_WSList_WS" + (len - 1) + "_name");
        window.localStorage.removeItem("AG_WSList_WS" + (len - 1) + "_data");

        window.localStorage.setItem("AG_WorkspacesAmount", len - 1);

        return true;
    }
}
