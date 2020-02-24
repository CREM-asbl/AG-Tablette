import './Common';
import { standardKit } from '../ShapesKits/standardKit';
import { app } from '../App';

import { CreateState } from '../../Create/CreateState';
import { CreateAction } from '../../Create/CreateAction';

import { GroupState } from '../../Group/GroupState';
import { GroupAction } from '../../Group/GroupAction';

import { UngroupState } from '../../Ungroup/UngroupState';
import { UngroupAction } from '../../Ungroup/UngroupAction';

import { BackgroundColorState } from '../../BackgroundColor/BackgroundColorState';
import { BackgroundColorAction } from '../../BackgroundColor/BackgroundColorAction';

import { BorderColorState } from '../../BorderColor/BorderColorState';
import { BorderColorAction } from '../../BorderColor/BorderColorAction';

import { CopyState } from '../../Copy/CopyState';
import { CopyAction } from '../../Copy/CopyAction';

import { BuildCenterState } from '../../BuildCenter/BuildCenterState';
import { BuildCenterAction } from '../../BuildCenter/BuildCenterAction';

import { DeleteState } from '../../Delete/DeleteState';
import { DeleteAction } from '../../Delete/DeleteAction';

import { TranslateState } from '../../Translate/TranslateState';
import { TranslateAction } from '../../Translate/TranslateAction';

import { ZoomState } from '../../Zoom/ZoomState';
import { ZoomAction } from '../../Zoom/ZoomAction';
import { PermanentZoomState } from '../../Zoom/PermanentZoomState';

import { OpacityState } from '../../Opacity/OpacityState';
import { OpacityAction } from '../../Opacity/OpacityAction';

import { ToBackgroundState } from '../../ToBackground/ToBackgroundState';
import { ToBackgroundAction } from '../../ToBackground/ToBackgroundAction';

import { DivideState } from '../../Divide/DivideState';
import { DivideAction } from '../../Divide/DivideAction';

import { MergeState } from '../../Merge/MergeState';
import { MergeAction } from '../../Merge/MergeAction';

import { CutState } from '../../Cut/CutState';
import { CutAction } from '../../Cut/CutAction';

import { BifaceState } from '../../Biface/BifaceState';
import { BifaceAction } from '../../Biface/BifaceAction';

import { GridManager } from '../../Grid/GridManager';

app.environment.loadFamilies(standardKit);

new CreateState();
new CreateAction();

new BuildCenterState();
new BuildCenterAction();

new DivideState();
new DivideAction();

new CutState();
new CutAction();

new CopyState();
new CopyAction();

new MergeState();
new MergeAction();

new DeleteState();
new DeleteAction();

new GroupState();
new GroupAction();

new UngroupState();
new UngroupAction();

new ToBackgroundState();
new ToBackgroundAction();

new BackgroundColorState();
new BackgroundColorAction();

new BorderColorState();
new BorderColorAction();

new OpacityState();
new OpacityAction();

new BifaceState();
new BifaceAction();

new TranslateState();
new TranslateAction();

new ZoomState();
new ZoomAction();
new PermanentZoomState();

GridManager.initState();

window.dispatchEvent(new CustomEvent('env-created'));
