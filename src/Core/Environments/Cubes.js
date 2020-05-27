import './Common';
import { kit } from '../ShapesKits/cubesKit';
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

import { DeleteState } from '../../Delete/DeleteState';
import { DeleteAction } from '../../Delete/DeleteAction';

import { TranslateState } from '../../Translate/TranslateState';
import { TranslateAction } from '../../Translate/TranslateAction';

import { ZoomState } from '../../Zoom/ZoomState';
import { ZoomAction } from '../../Zoom/ZoomAction';
import { PermanentZoomState } from '../../Zoom/PermanentZoomState';

import { ToBackgroundState } from '../../ToBackground/ToBackgroundState';
import { ToBackgroundAction } from '../../ToBackground/ToBackgroundAction';

new CreateState();
new CreateAction();

new CopyState();
new CopyAction();

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

new TranslateState();
new TranslateAction();

new ZoomState();
new ZoomAction();
new PermanentZoomState();

app.environment.loadFamilies(kit);

app.environment.extension = 'agc';

window.dispatchEvent(new CustomEvent('env-created'));
