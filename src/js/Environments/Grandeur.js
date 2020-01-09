import { standardKit } from '../ShapesKits/standardKit';
import { Environment } from './Environment';
import { app } from '../App';

//States:
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
import { PermanentZoomPlaneState } from '../States/PermanentZoomPlane.js';

//Actions:
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

/**
 * L'environnement "Grandeur".
 */
export class GrandeurEnvironment extends Environment {
  constructor() {
    super('Grandeur');

    this.loadFamilies(standardKit);

    this.states = {
      create_shape: {
        name: 'Ajouter une forme',
        instance: new CreateState(),
      },
      move_shape: {
        name: 'Glisser',
        instance: new MoveState(),
      },
      rotate_shape: {
        name: 'Tourner',
        instance: new RotateState(),
      },
      zoom_plane: {
        name: 'Zoom',
        instance: new ZoomPlaneState(),
      },
      delete_shape: {
        name: 'Supprimer',
        instance: new DeleteState(),
      },
      background_color: {
        name: 'Couleur de fond',
        instance: new BackgroundColorState(),
      },
      border_color: {
        name: 'Couleur des bords',
        instance: new BorderColorState(),
      },
      group_shapes: {
        name: 'Lier des formes',
        instance: new GroupState(),
      },
      ungroup_shapes: {
        name: 'Délier des formes',
        instance: new UngroupState(),
      },
      reverse_shape: {
        name: 'Retourner',
        instance: new ReverseState(),
      },
      build_shape_center: {
        name: 'Construire le centre',
        instance: new BuildCenterState(),
      },
      copy_shape: {
        name: 'Dupliquer',
        instance: new CopyState(),
      },
      opacity: {
        name: 'Opacité',
        instance: new OpacityState(),
      },
      divide_segment: {
        name: 'Diviser',
        instance: new DivideState(),
      },
      merge_shapes: {
        name: 'Fusionner',
        instance: new MergeState(),
      },
      cut_shape: {
        name: 'Découper',
        instance: new CutState(),
      },
      translate_plane: {
        name: 'Glisser le plan',
        instance: new TranslatePlaneState(),
      },
      to_background: {
        name: 'Passer en arrière-plan',
        instance: new ToBackgroundState(),
      },
      tangram_creator: {
        name: 'Créer un tangram',
        instance: new TangramCreatorState(),
      },
      biface: {
        name: 'Rendre biface',
        instance: new BifaceState(),
      },
    };

    app.states = this.states;

    this.actions = {
      BackgroundColorAction: {
        instance: new BackgroundColorAction(),
      },
      BorderColorAction: {
        instance: new BorderColorAction(),
      },
      BuildCenterAction: {
        instance: new BuildCenterAction(),
      },
      CreateAction: {
        instance: new CreateAction(),
      },
      DeleteAction: {
        instance: new DeleteAction(),
      },
      CopyAction: {
        instance: new CopyAction(),
      },
      GroupAction: {
        instance: new GroupAction(),
      },
      MoveAction: {
        instance: new MoveAction(),
      },
      ReverseAction: {
        instance: new ReverseAction(),
      },
      RotateAction: {
        instance: new RotateAction(),
      },
      TranslatePlaneAction: {
        instance: new TranslatePlaneAction(),
      },
      UngroupAction: {
        instance: new UngroupAction(),
      },
      ZoomPlaneAction: {
        instance: new ZoomPlaneAction(),
      },
      OpacityAction: {
        instance: new OpacityAction(),
      },
      ToBackgroundAction: {
        instance: new ToBackgroundAction(),
      },
      DivideAction: {
        instance: new DivideAction(),
      },
      MergeAction: {
        instance: new MergeAction(),
      },
      CutAction: {
        instance: new CutAction(),
      },
      BifaceAction: {
        instance: new BifaceAction(),
      },
    };

    app.actions = this.actions;
  }
}
