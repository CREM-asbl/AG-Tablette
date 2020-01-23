import './Common';

import { GroupState } from '../States/Group.js';
import { UngroupState } from '../States/Ungroup.js';

import { GroupAction } from '../States/Actions/Group.js';
import { UngroupAction } from '../States/Actions/Ungroup';
import { ToBackgroundAction } from '../States/Actions/ToBackground';
import { ToBackgroundState } from '../States/ToBackground';
import { BackgroundColorState } from '../States/BackgroundColor';
import { BorderColorState } from '../States/BorderColor';
import { OpacityState } from '../States/Opacity';
import { BifaceState } from '../States/Biface';
import { TranslatePlaneState } from '../States/TranslatePlane';
import { ZoomPlaneState } from '../States/ZoomPlane';
import { TangramCreatorState } from '../../Tangram/TangramCreator';
import { BackgroundColorAction } from '../States/Actions/BackgroundColor';
import { BorderColorAction } from '../States/Actions/BorderColor';
import { OpacityAction } from '../States/Actions/Opacity';
import { BifaceAction } from '../States/Actions/Biface';
import { TranslatePlaneAction } from '../States/Actions/TranslatePlane';
import { ZoomPlaneAction } from '../States/Actions/ZoomPlane';
import { TangramManager } from '../../Tangram/TangramManager';
import { GridManager } from '../../Grid/GridManager';

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
new TangramManager();
new TangramCreatorState();

GridManager.initState();

dispatchEvent(new CustomEvent('app-state-changed'));
