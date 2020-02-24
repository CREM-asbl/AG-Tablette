import './Common';

import { GroupState } from '../../Group/GroupState';
import { GroupAction } from '../../Group/GroupAction';

import { UngroupState } from '../../Ungroup/UngroupState';
import { UngroupAction } from '../../Ungroup/UngroupAction';

import { BackgroundColorState } from '../../BackgroundColor/BackgroundColorState';
import { BackgroundColorAction } from '../../BackgroundColor/BackgroundColorAction';

import { BorderColorState } from '../../BorderColor/BorderColorState';
import { BorderColorAction } from '../../BorderColor/BorderColorAction';

import { OpacityState } from '../../Opacity/OpacityState';
import { OpacityAction } from '../../Opacity/OpacityAction';

import { BifaceState } from '../../Biface/BifaceState';
import { BifaceAction } from '../../Biface/BifaceAction';

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

new Rotate45State();
new Rotate45Action();

new SilhouetteCreatorState();
new TangramState();

window.dispatchEvent(new CustomEvent('env-created'));
