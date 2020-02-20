import './Common';

import { GroupState } from '../States/Group.js';
import { GroupAction } from '../States/Actions/Group.js';

import { UngroupState } from '../States/Ungroup.js';
import { UngroupAction } from '../States/Actions/Ungroup';

import { BackgroundColorState } from '../States/BackgroundColor';
import { BackgroundColorAction } from '../States/Actions/BackgroundColor';

import { BorderColorState } from '../States/BorderColor';
import { BorderColorAction } from '../States/Actions/BorderColor';

import { OpacityState } from '../States/Opacity';
import { OpacityAction } from '../States/Actions/Opacity';

import { BifaceState } from '../States/Biface';
import { BifaceAction } from '../States/Actions/Biface';

import { TranslatePlaneState } from '../States/TranslatePlane';
import { TranslatePlaneAction } from '../States/Actions/TranslatePlane';

import { ZoomPlaneState } from '../States/ZoomPlane';
import { ZoomPlaneAction } from '../States/Actions/ZoomPlane';

import { Rotate45State } from '../../Rotate45/Rotate45State';
import { Rotate45Action } from '../../Rotate45/Rotate45Action';

import { SilhouetteCreatorState } from '../../Tangram/SilhouetteCreatorState';
import { TangramState } from '../../Tangram/TangramState';
import '../../Tangram/TangramManager';

new GroupState();
new GroupAction();

new UngroupState();
new UngroupAction();

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

new Rotate45State();
new Rotate45Action();

new SilhouetteCreatorState();
new TangramState();

window.dispatchEvent(new CustomEvent('env-created'));
