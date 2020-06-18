import './Common';
import '../../Reverse';
import '../../Group';
import '../../Ungroup';
import '../../BackgroundColor';
import '../../BorderColor';
import '../../Rotate45';

import { SilhouetteCreatorState } from '../../Tangram/SilhouetteCreatorState';
import '../../Tangram/TangramManager';

import { app } from '../App';

new SilhouetteCreatorState();

app.environment.extension = 'agt';

window.dispatchEvent(new CustomEvent('env-created'));
