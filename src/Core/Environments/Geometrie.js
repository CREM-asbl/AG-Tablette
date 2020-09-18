import './Common';
import { app } from '../App';
import '../../Create';
import '../../Copy';
import '../../Delete';
import '../../Group';
import '../../Merge';
import '../../Ungroup';
import '../../ToBackground';
import '../../BackgroundColor';
import '../../BorderColor';
import '../../Translate';
import '../../Zoom';
import '../../Grid';

import '../../RegularCreate';
import '../../IrregularCreate';

app.environment.extension = 'agl';

window.dispatchEvent(new CustomEvent('env-created'));
