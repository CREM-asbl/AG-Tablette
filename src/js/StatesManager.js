//States:
import { CreateState } from './States/Create.js';
import { MoveState } from './States/Move.js';
import { RotateState } from './States/Rotate.js';
import { ReverseState } from './States/Reverse.js';
import { GroupState } from './States/Group.js';
import { UngroupState } from './States/Ungroup.js';
import { BackgroundColorState } from './States/BackgroundColor.js';
import { BorderColorState } from './States/BorderColor.js';
import { CopyState } from './States/Copy.js';
import { BuildCenterState } from './States/BuildCenter.js';
import { DeleteState } from './States/Delete.js';
import { TranslatePlaneState } from './States/TranslatePlane.js';
import { ZoomPlaneState } from './States/ZoomPlane.js';
import { PermanentZoomPlaneState } from './States/PermanentZoomPlane.js';
import { OpacityState } from './States/Opacity.js';
import { ToBackgroundState } from './States/ToBackground.js';
import { DivideState } from './States/Divide.js';
import { MergeState } from './States/Merge.js';
import { CutState } from './States/Cut.js';
import { TangramCreatorState } from './States/TangramCreator.js';

//Actions:
import { BackgroundColorAction } from './States/Actions/BackgroundColor.js';
import { BorderColorAction } from './States/Actions/BorderColor.js';
import { BuildCenterAction } from './States/Actions/BuildCenter.js';
import { CreateAction } from './States/Actions/Create.js';
import { DeleteAction } from './States/Actions/Delete.js';
import { CopyAction } from './States/Actions/Copy.js';
import { GroupAction } from './States/Actions/Group.js';
import { MoveAction } from './States/Actions/Move.js';
import { ReverseAction } from './States/Actions/Reverse.js';
import { RotateAction } from './States/Actions/Rotate.js';
import { TranslatePlaneAction } from './States/Actions/TranslatePlane.js';
import { UngroupAction } from './States/Actions/Ungroup.js';
import { ZoomPlaneAction } from './States/Actions/ZoomPlane.js';
import { OpacityAction } from './States/Actions/Opacity.js';
import { ToBackgroundAction } from './States/Actions/ToBackground.js';
import { DivideAction } from './States/Actions/Divide.js';
import { MergeAction } from './States/Actions/Merge.js';
import { CutAction } from './States/Actions/Cut.js';

export const StatesManager = {
  actions: {
    BackgroundColorAction: {
      getInstance: () => new BackgroundColorAction(),
    },
    BorderColorAction: {
      getInstance: () => new BorderColorAction(),
    },
    BuildCenterAction: {
      getInstance: () => new BuildCenterAction(),
    },
    CreateAction: {
      getInstance: () => new CreateAction(),
    },
    DeleteAction: {
      getInstance: () => new DeleteAction(),
    },
    CopyAction: {
      getInstance: () => new CopyAction(),
    },
    GroupAction: {
      getInstance: () => new GroupAction(),
    },
    MoveAction: {
      getInstance: () => new MoveAction(),
    },
    ReverseAction: {
      getInstance: () => new ReverseAction(),
    },
    RotateAction: {
      getInstance: () => new RotateAction(),
    },
    TranslatePlaneAction: {
      getInstance: () => new TranslatePlaneAction(),
    },
    UngroupAction: {
      getInstance: () => new UngroupAction(),
    },
    ZoomPlaneAction: {
      getInstance: () => new ZoomPlaneAction(),
    },
    OpacityAction: {
      getInstance: () => new OpacityAction(),
    },
    ToBackgroundAction: {
      getInstance: () => new ToBackgroundAction(),
    },
    DivideAction: {
      getInstance: () => new DivideAction(),
    },
    MergeAction: {
      getInstance: () => new MergeAction(),
    },
    CutAction: {
      getInstance: () => new CutAction(),
    },
  },

  states: {
    create_shape: {
      name: 'Ajouter une forme',
      instance: null,
      getInstance: () => new CreateState(),
    },
    move_shape: {
      name: 'Glisser',
      instance: null,
      getInstance: () => new MoveState(),
    },
    rotate_shape: {
      name: 'Tourner',
      instance: null,
      getInstance: () => new RotateState(),
    },
    zoom_plane: {
      name: 'Zoom',
      instance: null,
      getInstance: () => new ZoomPlaneState(),
    },
    delete_shape: {
      name: 'Supprimer',
      instance: null,
      getInstance: () => new DeleteState(),
    },
    background_color: {
      name: 'Couleur de fond',
      instance: null,
      getInstance: () => new BackgroundColorState(),
    },
    border_color: {
      name: 'Couleur des bords',
      instance: null,
      getInstance: () => new BorderColorState(),
    },
    group_shapes: {
      name: 'Lier des formes',
      instance: null,
      getInstance: () => new GroupState(),
    },
    ungroup_shapes: {
      name: 'Délier des formes',
      instance: null,
      getInstance: () => new UngroupState(),
    },
    reverse_shape: {
      name: 'Retourner',
      instance: null,
      getInstance: () => new ReverseState(),
    },
    build_shape_center: {
      name: 'Construire le centre',
      instance: null,
      getInstance: () => new BuildCenterState(),
    },
    copy_shape: {
      name: 'Dupliquer',
      instance: null,
      getInstance: () => new CopyState(),
    },
    opacity: {
      name: 'Opacité',
      instance: null,
      getInstance: () => new OpacityState(),
    },
    divide_segment: {
      name: 'Diviser',
      instance: null,
      getInstance: () => new DivideState(),
    },
    merge_shapes: {
      name: 'Fusionner',
      instance: null,
      getInstance: () => new MergeState(),
    },
    cut_shape: {
      name: 'Découper',
      instance: null,
      getInstance: () => new CutState(),
    },
    translate_plane: {
      name: 'Glisser le plan',
      instance: null,
      getInstance: () => new TranslatePlaneState(),
    },
    to_background: {
      name: 'Passer en arrière-plan',
      instance: null,
      getInstance: () => new ToBackgroundState(),
    },
    tangram_creator: {
      name: 'Créer un tangram',
      instance: null,
      getInstance: () => new TangramCreatorState(),
    },
  },

  permanentStates: {
    permanent_zoom_plane: {
      name: 'Zoom',
      instance: null,
      getInstance: () => new PermanentZoomPlaneState(),
    },
  },

  getStateInstance: function(stateName) {
    if (!this.states[stateName]) {
      console.error('This state does not exists');
      return null;
    }
    if (!this.states[stateName].instance) {
      let instance = this.states[stateName].getInstance();
      this.states[stateName].instance = instance;
    }

    return this.states[stateName].instance;
  },

  getPermanentStateInstance: function(stateName) {
    if (!this.permanentStates[stateName]) {
      console.error('This permanent state does not exists');
      return null;
    }
    if (!this.permanentStates[stateName].instance) {
      let instance = this.permanentStates[stateName].getInstance();
      this.permanentStates[stateName].instance = instance;
    }
    return this.permanentStates[stateName].instance;
  },

  getStateText: function(stateName) {
    if (!this.states[stateName]) return null;
    return this.states[stateName].name;
  },

  getActionInstance: actionData => {
    if (!StatesManager.actions[actionData.className]) {
      console.error('unknown action class: ' + actionData.className);
      return;
    }

    const action = StatesManager.actions[actionData.className].getInstance();
    action.initFromObject(actionData.data);
    return action;
  },
};
