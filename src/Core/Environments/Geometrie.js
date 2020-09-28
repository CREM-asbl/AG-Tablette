import './Common';
import { app } from '../App';
// import '../../Create';
import '../../Copy';
import '../../Delete';
import '../../Group';
import '../../Divide';
import '../../Cut';
import '../../Reverse';
import '../../Ungroup';
import '../../ToBackground';
import '../../BackgroundColor';
import '../../BuildCenter';
import '../../BorderColor';
import '../../Translate';
import '../../Zoom';
import '../../Grid';

import '../../RegularCreate';
import '../../IrregularCreate';
import '../../RightAngleTriangle';
import '../../IsoscelesTriangle';
import '../../Transform';

app.environment.extension = 'agl';

window.dispatchEvent(new CustomEvent('env-created'));
