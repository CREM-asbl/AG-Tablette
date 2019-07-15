import { CreateState } from './States/Create.js' //TODO: pourquoi cela ne fonctionne pas sans le ".js" ?
import { MoveState } from './States/Move.js'
import { RotateState } from './States/Rotate.js'
import { ReverseState } from './States/Reverse.js'
import { GroupState } from './States/Group.js'
import { UngroupState } from './States/Ungroup.js'
import { BackgroundColorState } from './States/BackgroundColor.js'
import { BorderColorState } from './States/BorderColor.js'
import { DuplicateState } from './States/Duplicate.js'
import { BuildCenterState } from './States/BuildCenter.js'
import { DeleteState } from './States/Delete.js'
import { TranslatePlaneState } from './States/TranslatePlane.js'
import { ZoomPlaneState } from './States/ZoomPlane.js'
import { PermanentZoomPlaneState } from './States/PermanentZoomPlane.js'


export class StatesManager {
    /*
    Utilisé notamment dans WorkspaceHistory.initFromObject, pour vérifier
    qu'un nom d'action est bien valide avant d'utiliser eval().
     */
    static registeredActions = [
        'BackgroundColorAction',
        'BorderColorAction',
        'BuildCenterAction',
        'CreateAction',
        'DeleteAction',
        'DuplicateAction',
        'GroupAction',
        'MoveAction',
        'ReverseAction',
        'RotateAction',
        'TranslatePlaneAction',
        'UngroupAction',
        'ZoomPlaneAction',
        'XXXXX',
        'XXXXX',
        'XXXXX',
        'XXXXX',
        'XXXXX',
        'XXXXX',
        'XXXXX',
        'XXXXX',
        'XXXXX'
    ];

    static states = {
        'create_shape': {
            "name": 'Ajouter une forme',
            "instance": null,
            "getInstance": function() { return new CreateState(); }
        },
        'move_shape': {
            "name": 'Glisser',
            "instance": null,
            "getInstance": function() { return new MoveState(); }
        },
        'rotate_shape': {
            "name": 'Tourner',
            "instance": null,
            "getInstance": function() { return new RotateState(); }
        },
        'zoom_plane': {
            "name": 'Zoom',
            "instance": null,
            "getInstance": function() { return new ZoomPlaneState(); }
        },
        'delete_shape': {
            "name": 'Supprimer',
            "instance": null,
            "getInstance": function() { return new DeleteState(); }
        },
        'background_color': {
            "name": 'Couleur de fond',
            "instance": null,
            "getInstance": function() { return new BackgroundColorState(); }
        },
        'border_color': {
            "name": 'Couleur des bords',
            "instance": null,
            "getInstance": function() { return new BorderColorState(); }
        },
        'group_shapes': {
            "name": 'Lier des formes',
            "instance": null,
            "getInstance": function() { return new GroupState(); }
        },
        'ungroup_shapes': {
            "name": 'Délier des formes',
            "instance": null,
            "getInstance": function() { return new UngroupState(); }
        },
        'reverse_shape': {
            "name": 'Retourner',
            "instance": null,
            "getInstance": function() { return new ReverseState(); }
        },
        'build_shape_center': {
            "name": 'Construire le centre',
            "instance": null,
            "getInstance": function() { return new BuildCenterState(); }
        },
        'duplicate_shape': {
            "name": 'Dupliquer',
            "instance": null,
            "getInstance": function() { return new DuplicateState(); }
        },
        'divide_segment': {
            "name": 'Diviser',
            "instance": null,
            "getInstance": function() { return new XXXXXXXXXX(); }
        },
        'merge_shapes': {
            "name": 'Fusionner',
            "instance": null,
            "getInstance": function() { return new XXXXXXXXXX(); }
        },
        'cut_shape': {
            "name": 'Découper',
            "instance": null,
            "getInstance": function() { return new XXXXXXXXXX(); }
        },
        'translate_plane': {
            "name": 'Glisser le plan',
            "instance": null,
            "getInstance": function() { return new TranslatePlaneState(); }
        }
    };

    static permanentStates = {
        'permanent_zoom_plane': {
            "name": 'Zoom',
            "instance": null,
            "getInstance": function() { return new PermanentZoomPlaneState(); }
        }
    }

    static getStateInstance(stateName) {
        if(!this.states[stateName]) {
            console.error("This state does not exists");
            return null;
        }
        if(!this.states[stateName].instance) {
            let instance = this.states[stateName].getInstance();
            this.states[stateName].instance = instance;
        }

        return this.states[stateName].instance;
    }

    static getPermanentStateInstance(stateName) {
        if(!this.permanentStates[stateName]) {
            console.error("This permanent state does not exists");
            return null;
        }
        if(!this.permanentStates[stateName].instance) {
            let instance = this.permanentStates[stateName].getInstance();
            this.permanentStates[stateName].instance = instance;
        }
        return this.permanentStates[stateName].instance;
    }

    static getStateText(stateName) {
        if(!this.states[stateName]) return null;
        return this.states[stateName].name;
    }
}
