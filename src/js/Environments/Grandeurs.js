import './Common';
import { standardKit } from '../ShapesKits/standardKit';
import { app } from '../App';

import { CreateState } from '../States/Create.js';
import { CreateAction } from '../States/Actions/Create.js';

import { GroupState } from '../States/Group.js';
import { GroupAction } from '../States/Actions/Group.js';

import { UngroupState } from '../States/Ungroup.js';
import { UngroupAction } from '../States/Actions/Ungroup.js';

import { BackgroundColorState } from '../States/BackgroundColor.js';
import { BackgroundColorAction } from '../States/Actions/BackgroundColor.js';

import { BorderColorState } from '../States/BorderColor.js';
import { BorderColorAction } from '../States/Actions/BorderColor.js';

import { CopyState } from '../States/Copy.js';
import { CopyAction } from '../States/Actions/Copy.js';

import { BuildCenterState } from '../States/BuildCenter.js';
import { BuildCenterAction } from '../States/Actions/BuildCenter.js';

import { DeleteState } from '../States/Delete.js';
import { DeleteAction } from '../States/Actions/Delete.js';

import { TranslatePlaneState } from '../States/TranslatePlane.js';
import { TranslatePlaneAction } from '../States/Actions/TranslatePlane.js';

import { ZoomPlaneState } from '../States/ZoomPlane.js';
import { ZoomPlaneAction } from '../States/Actions/ZoomPlane.js';

import { OpacityState } from '../../Opacity/OpacityState.js';
import { OpacityAction } from '../../Opacity/OpacityAction.js';

import { ToBackgroundState } from '../States/ToBackground.js';
import { ToBackgroundAction } from '../States/Actions/ToBackground.js';

import { DivideState } from '../States/Divide.js';
import { DivideAction } from '../States/Actions/Divide.js';

import { MergeState } from '../../Merge/MergeState.js';
import { MergeAction } from '../../Merge/MergeAction.js';

import { CutState } from '../../Cut/CutState.js';
import { CutAction } from '../../Cut/CutAction.js';

import { BifaceState } from '../States/Biface.js';
import { BifaceAction } from '../States/Actions/Biface.js';

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

new TranslatePlaneState();
new TranslatePlaneAction();

new ZoomPlaneState();
new ZoomPlaneAction();

GridManager.initState();

window.dispatchEvent(new CustomEvent('env-created'));
