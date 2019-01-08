/**
 * Permet de sauvegarder et restaurer un espace de travail (Workspace),
 * en utilisant le localStorage du navigateur.
 */

/**
 * Constructeur
 * @param app: Référence vers l'application (App)
 */
function Storer(app) {
    this.__init();

	//référence vers l'application
	this.app = app;
}

/**
 * Initialise le local storage si c'est le premier lancement de l'application.
 */
Storer.prototype.__init = function() {
    if(window.localStorage.getItem("AG_WorkspacesAmount")!=null)
        return;

    window.localStorage.setItem("AG_WorkspacesAmount", 0);
};

/**
 * Sauvegarder un Workspace dans le localStorage
 * @param  {Workspace} workspace le Workspace à sauvegarder
 * @param  {String} name      un nom pour le workspace (à choisir)
 */
Storer.prototype.saveWorkspace = function(workspace, name) {
    if(name===undefined)
        name = "Espace de travail sans nom";

    var wsdata = {
        'name': name,
        'uniqid': workspace.uniqid,
        'appVersion': workspace.appVersion,
        'menuId': workspace.menuId,
        'nextShapeId': workspace.nextShapeId,
        'nextFamilyId': workspace.nextFamilyId,
        'zoomLevel': workspace.zoomLevel
    };

    //history:
    wsdata.history = workspace.history.steps;

    //shapesList:
    wsdata.shapesList = workspace.shapesList.map(function(val){
        return val.getSaveData();
    });

    //families:
    wsdata.families = workspace.families.map(function(family){
        return {
            'name': family.name,
            'defaultColor': family.defaultColor,
            'id': family.id,
            'shapesList': family.shapesList.map(function(shape){
                return {
                    'color': shape.color,
                    'name': shape.name,
                    'refPoint': shape.refPoint,
                    'buildSteps': shape.buildSteps.map(function(bs){
                        return bs.getSaveData();
                    })
                };
            })
        };
    });

    //systemShapeGroups:
    wsdata.systemShapeGroups = workspace.systemShapeGroups.map(function(group){
        return group.map(function(shape){
            return shape.id;
        });
    });

    //userShapeGroups:
    wsdata.userShapeGroups = workspace.userShapeGroups.map(function(group){
        return group.map(function(shape){
            return shape.id;
        });
    });

    //Store:
    var json_string = JSON.stringify(wsdata);

    /*
        S'il y a déjà un espace de travail enregistré ayant cet uniqid, l'écraser.
        Sinon en ajouter un
     */
    var index = this.getWorkspaceIndex(workspace.uniqid);
    if(index==-1) {
        index = parseInt(window.localStorage.getItem("AG_WorkspacesAmount"));
        window.localStorage.setItem("AG_WorkspacesAmount", index+1);
    }

    window.localStorage.setItem("AG_WSList_WS"+index+"_uniqid", workspace.uniqid);
    window.localStorage.setItem("AG_WSList_WS"+index+"_name", name);
    window.localStorage.setItem("AG_WSList_WS"+index+"_data", json_string);
}

Storer.prototype.getWorkspaceIndex = function(uniqid) {
    var wsAmount = parseInt(window.localStorage.getItem("AG_WorkspacesAmount"));
    for(var i=0; i<wsAmount; i++) {
        var val = window.localStorage.getItem("AG_WSList_WS"+i+"_uniqid");
        if(val==uniqid)
            return i;
    }
    return -1;
};

/**
 * Récupérer un workspace sauvegardé à partir de son identifiant unique
 * @param  {String} uniqid l'identifiant unique
 * @return {Workspace}        le Workspace
 */
Storer.prototype.getWorkspace = function(uniqid) {
    var app = this.app;
    var wsAmount = parseInt(window.localStorage.getItem("AG_WorkspacesAmount"));
    for(var i=0; i<wsAmount; i++) {
        var val = window.localStorage.getItem("AG_WSList_WS"+i+"_uniqid");
        if(val==uniqid) {
            //Extract data:
            var json_string = window.localStorage.getItem("AG_WSList_WS"+i+"_data");
            var wsdata = JSON.parse(json_string);
            var ws = new Workspace(app);
            ws.uniqid = wsdata.uniqid;
            ws.appVersion = wsdata.appVersion;
            ws.menuId = wsdata.menuId;
            ws.nextShapeId = wsdata.nextShapeId;
            ws.nextFamilyId = wsdata.nextFamilyId;
            ws.zoomLevel = wsdata.zoomLevel;

            //history:
            ws.history.steps = wsdata.history;

            //shapesList:
            ws.shapesList = wsdata.shapesList.map(function(val){
                var shape = Shape.createFromSaveData(val, ws, true);
                return shape;
            });
            ws.shapesList = ws.shapesList.map(function(val, i){
                return Shape.createFromSaveData(wsdata.shapesList[i], ws, false, val);
            });

            //families:
            ws.families = wsdata.families.map(function(data){
                var family = new Family(
                    app,
                    data.name,
                    data.defaultColor
                );
                family.shapesList = data.shapesList.map(function(data2){
                    var shape = {
                        'color': data2.color,
                        'name': data2.name,
                        'refPoint': data2.refPoint,
                        'buildSteps': data2.buildSteps.map(function(data3){
                            return ShapeStep.createFromSaveData(data3);
                        })
                    };
                });
                return family;
            });

            //systemShapeGroups & userShapeGroups:
            var mapFct = function(group){
                return group.map(function(shapeId){
                    var shape = ws.shapesList.find(function(val){
                        return val.id == shapeId;
                    });
                    if(!shape) {
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
Storer.prototype.getWorkspaceByName = function (name) {
    var wsAmount = parseInt(window.localStorage.getItem("AG_WorkspacesAmount"));
    for(var i=wsAmount-1; i>=0; i--) {
        var val = window.localStorage.getItem("AG_WSList_WS"+i+"_name");
        if(val==name) {window.localStorage.getItem("AG_WSList_WS"+i+"_name");
            var uniqid = window.localStorage.getItem("AG_WSList_WS"+i+"_uniqid");
            return this.getWorkspace(uniqid);
        }
    }
    return null;
};
