//States:
import { CreateState } from './States/Create.js' //TODO: pourquoi cela ne fonctionne pas sans le ".js" ?
import { MoveState } from './States/Move.js'
import { RotateState } from './States/Rotate.js'
import { ReverseState } from './States/Reverse.js'
import { GroupState } from './States/Group.js'
import { UngroupState } from './States/Ungroup.js'
import { BackgroundColorState } from './States/BackgroundColor.js'
import { BorderColorState } from './States/BorderColor.js'
import { CopyState } from './States/Copy.js'
import { BuildCenterState } from './States/BuildCenter.js'
import { DeleteState } from './States/Delete.js'
import { TranslatePlaneState } from './States/TranslatePlane.js'
import { ZoomPlaneState } from './States/ZoomPlane.js'
import { PermanentZoomPlaneState } from './States/PermanentZoomPlane.js'
import { OpacityState } from './States/Opacity.js'
import { ToBackgroundState } from './States/ToBackground.js'
import { DivideState } from './States/Divide.js'
import { MergeState } from './States/Merge.js'
import { CutState } from './States/Cut.js'

//Actions:
import  { BackgroundColorAction } from './States/Actions/BackgroundColor.js'
import  { BorderColorAction } from './States/Actions/BorderColor.js'
import  { BuildCenterAction } from './States/Actions/BuildCenter.js'
import  { CreateAction } from './States/Actions/Create.js'
import  { DeleteAction } from './States/Actions/Delete.js'
import  { CopyAction } from './States/Actions/Copy.js'
import  { GroupAction } from './States/Actions/Group.js'
import  { MoveAction } from './States/Actions/Move.js'
import  { ReverseAction } from './States/Actions/Reverse.js'
import  { RotateAction } from './States/Actions/Rotate.js'
import  { TranslatePlaneAction } from './States/Actions/TranslatePlane.js'
import  { UngroupAction } from './States/Actions/Ungroup.js'
import  { ZoomPlaneAction } from './States/Actions/ZoomPlane.js'
import  { OpacityAction } from './States/Actions/Opacity.js'
import  { ToBackgroundAction } from './States/Actions/ToBackground.js'
import  { DivideAction } from './States/Actions/Divide.js'
import  { MergeAction } from './States/Actions/Merge.js'
import  { CutAction } from './States/Actions/Cut.js'

export class StatesManager {
    static actions = {
        'BackgroundColorAction': {
            "getInstance": function() { return new BackgroundColorAction(); }
        },
        'BorderColorAction': {
            "getInstance": function() { return new BorderColorAction(); }
        },
        'BuildCenterAction': {
            "getInstance": function() { return new BuildCenterAction(); }
        },
        'CreateAction': {
            "getInstance": function() { return new CreateAction(); }
        },
        'DeleteAction': {
            "getInstance": function() { return new DeleteAction(); }
        },
        'CopyAction': {
            "getInstance": function() { return new CopyAction(); }
        },
        'GroupAction': {
            "getInstance": function() { return new GroupAction(); }
        },
        'MoveAction': {
            "getInstance": function() { return new MoveAction(); }
        },
        'ReverseAction': {
            "getInstance": function() { return new ReverseAction(); }
        },
        'RotateAction': {
            "getInstance": function() { return new RotateAction(); }
        },
        'TranslatePlaneAction': {
            "getInstance": function() { return new TranslatePlaneAction(); }
        },
        'UngroupAction': {
            "getInstance": function() { return new UngroupAction(); }
        },
        'ZoomPlaneAction': {
            "getInstance": function() { return new ZoomPlaneAction(); }
        },
        'OpacityAction': {
            "getInstance": function() { return new OpacityAction(); }
        },
        'ToBackgroundAction': {
            "getInstance": function() { return new ToBackgroundAction(); }
        },
        'DivideAction': {
            "getInstance": function() { return new DivideAction(); }
        },
        'MergeAction': {
            "getInstance": function() { return new MergeAction(); }
        },
        'CutAction': {
            "getInstance": function() { return new CutAction(); }
        }
    };

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
        'copy_shape': {
            "name": 'Dupliquer',
            "instance": null,
            "getInstance": function() { return new CopyState(); }
        },
        'opacity': {
            "name": 'Opacité',
            "instance": null,
            "getInstance": function() { return new OpacityState(); }
        },
        'divide_segment': {
            "name": 'Diviser',
            "instance": null,
            "getInstance": function() { return new DivideState(); }
        },
        'merge_shapes': {
            "name": 'Fusionner',
            "instance": null,
            "getInstance": function() { return new MergeState(); }
        },
        'cut_shape': {
            "name": 'Découper',
            "instance": null,
            "getInstance": function() { return new CutState(); }
        },
        'translate_plane': {
            "name": 'Glisser le plan',
            "instance": null,
            "getInstance": function() { return new TranslatePlaneState(); }
        },
        'to_background': {
            "name": 'Passer en arrière plan',
            "instance": null,
            "getInstance": function() { return new ToBackgroundState(); }
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
