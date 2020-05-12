import './Common';

import { SilhouetteCreatorState } from '../../Tangram/SilhouetteCreatorState';
import '../../Tangram/TangramManager';

import { GroupState } from '../../Group/GroupState';
import { GroupAction } from '../../Group/GroupAction';

import { UngroupState } from '../../Ungroup/UngroupState';
import { UngroupAction } from '../../Ungroup/UngroupAction';

import { BackgroundColorState } from '../../BackgroundColor/BackgroundColorState';
import { BackgroundColorAction } from '../../BackgroundColor/BackgroundColorAction';

import { BorderColorState } from '../../BorderColor/BorderColorState';
import { BorderColorAction } from '../../BorderColor/BorderColorAction';

import { Rotate45State } from '../../Rotate45/Rotate45State';
import { Rotate45Action } from '../../Rotate45/Rotate45Action';
import { app } from '../App';

new SilhouetteCreatorState();

new GroupState();
new GroupAction();

new UngroupState();
new UngroupAction();

new BackgroundColorState();
new BackgroundColorAction();

new BorderColorState();
new BorderColorAction();

new Rotate45State();
new Rotate45Action();

// new TangramState();

app.environment.extension = 'agt';

window.dispatchEvent(new CustomEvent('env-created'));
