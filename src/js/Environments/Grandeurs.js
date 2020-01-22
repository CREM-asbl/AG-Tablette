import { standardKit } from '../ShapesKits/standardKit';
import { app } from '../App';

// States:
import { CreateState } from '../States/Create.js';
import { MoveState } from '../States/Move.js';
import { RotateState } from '../States/Rotate.js';
import { ReverseState } from '../States/Reverse.js';
import { GroupState } from '../States/Group.js';
import { UngroupState } from '../States/Ungroup.js';
import { BackgroundColorState } from '../States/BackgroundColor.js';
import { BorderColorState } from '../States/BorderColor.js';
import { CopyState } from '../States/Copy.js';
import { BuildCenterState } from '../States/BuildCenter.js';
import { DeleteState } from '../States/Delete.js';
import { TranslatePlaneState } from '../States/TranslatePlane.js';
import { ZoomPlaneState } from '../States/ZoomPlane.js';
import { OpacityState } from '../States/Opacity.js';
import { ToBackgroundState } from '../States/ToBackground.js';
import { DivideState } from '../States/Divide.js';
import { MergeState } from '../States/Merge.js';
import { CutState } from '../States/Cut.js';
import { TangramCreatorState } from '../States/TangramCreator.js';
import { BifaceState } from '../States/Biface.js';
// Permanent:
import { PermanentZoomPlaneState } from '../States/PermanentZoomPlane.js';

// Actions:
import { BackgroundColorAction } from '../States/Actions/BackgroundColor.js';
import { BorderColorAction } from '../States/Actions/BorderColor.js';
import { BuildCenterAction } from '../States/Actions/BuildCenter.js';
import { CreateAction } from '../States/Actions/Create.js';
import { DeleteAction } from '../States/Actions/Delete.js';
import { CopyAction } from '../States/Actions/Copy.js';
import { GroupAction } from '../States/Actions/Group.js';
import { MoveAction } from '../States/Actions/Move.js';
import { ReverseAction } from '../States/Actions/Reverse.js';
import { RotateAction } from '../States/Actions/Rotate.js';
import { TranslatePlaneAction } from '../States/Actions/TranslatePlane.js';
import { UngroupAction } from '../States/Actions/Ungroup.js';
import { ZoomPlaneAction } from '../States/Actions/ZoomPlane.js';
import { OpacityAction } from '../States/Actions/Opacity.js';
import { ToBackgroundAction } from '../States/Actions/ToBackground.js';
import { DivideAction } from '../States/Actions/Divide.js';
import { MergeAction } from '../States/Actions/Merge.js';
import { CutAction } from '../States/Actions/Cut.js';
import { BifaceAction } from '../States/Actions/Biface.js';

app.environment.loadFamilies(standardKit);

app.states = {
  create_shape: {
    name: 'Ajouter une forme',
  },
  move_shape: {
    name: 'Glisser',
  },
  rotate_shape: {
    name: 'Tourner',
  },
  zoom_plane: {
    name: 'Zoom',
  },
  delete_shape: {
    name: 'Supprimer',
  },
  background_color: {
    name: 'Couleur de fond',
  },
  border_color: {
    name: 'Couleur des bords',
  },
  group_shapes: {
    name: 'Lier des formes',
  },
  ungroup_shapes: {
    name: 'Délier des formes',
  },
  reverse_shape: {
    name: 'Retourner',
  },
  build_shape_center: {
    name: 'Construire le centre',
  },
  copy_shape: {
    name: 'Dupliquer',
  },
  opacity: {
    name: 'Opacité',
  },
  divide_segment: {
    name: 'Diviser',
  },
  merge_shapes: {
    name: 'Fusionner',
  },
  cut_shape: {
    name: 'Découper',
  },
  translate_plane: {
    name: 'Glisser le plan',
  },
  to_background: {
    name: 'Passer en arrière-plan',
  },
  tangram_creator: {
    name: 'Créer un tangram',
  },
  biface: {
    name: 'Rendre biface',
  },
  permanentStates: {
    name: 'Zoom permanent',
  },
};

new CreateState();
new MoveState();
new RotateState();
new ZoomPlaneState();
new DeleteState();
new BackgroundColorState();
new BorderColorState();
new GroupState();
new UngroupState();
new ReverseState();
new BuildCenterState();
new CopyState();
new OpacityState();
new DivideState();
new MergeState();
new CutState();
new TranslatePlaneState();
new ToBackgroundState();
new TangramCreatorState();
new BifaceState();

app.permanentStates = {
  name: 'Zoom permanent',
};

new PermanentZoomPlaneState();

app.actions = {
  BackgroundColorAction: {
    name: 'BackgroundColorAction',
  },
  BorderColorAction: {
    name: 'BorderColorAction',
  },
  BuildCenterAction: {
    name: 'BuildCenterAction',
  },
  CreateAction: {
    name: 'CreateAction',
  },
  DeleteAction: {
    name: 'DeleteAction',
  },
  CopyAction: {
    name: 'CopyAction',
  },
  GroupAction: {
    name: 'GroupAction',
  },
  MoveAction: {
    name: 'MoveAction',
  },
  ReverseAction: {
    name: 'ReverseAction',
  },
  RotateAction: {
    name: 'RotateAction',
  },
  TranslatePlaneAction: {
    name: 'TranslatePlaneAction',
  },
  UngroupAction: {
    name: 'UngroupAction',
  },
  ZoomPlaneAction: {
    name: 'ZoomPlaneAction',
  },
  OpacityAction: {
    name: 'OpacityAction',
  },
  ToBackgroundAction: {
    name: 'ToBackgroundAction',
  },
  DivideAction: {
    name: 'DivideAction',
  },
  MergeAction: {
    name: 'MergeAction',
  },
  CutAction: {
    name: 'CutAction',
  },
  BifaceAction: {
    name: 'BifaceAction',
  },
};

new BackgroundColorAction();
new BorderColorAction();
new BuildCenterAction();
new CreateAction();
new DeleteAction();
new CopyAction();
new GroupAction();
new MoveAction();
new ReverseAction();
new RotateAction();
new TranslatePlaneAction();
new UngroupAction();
new ZoomPlaneAction();
new OpacityAction();
new ToBackgroundAction();
new DivideAction();
new MergeAction();
new CutAction();
new BifaceAction();

window.dispatchEvent(new CustomEvent('refresh'));
window.dispatchEvent(new CustomEvent('env-changed', { detail: { envName: 'Grandeurs' } }));
