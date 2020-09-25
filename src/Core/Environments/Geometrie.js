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
import '../../BorderColor';
import '../../Translate';
import '../../Zoom';
import '../../Grid';

import '../../RegularCreate';
import '../../IrregularCreate';
import '../../Transform';
import '../../TriangleRectangle';

app.environment.extension = 'agl';

window.dispatchEvent(new CustomEvent('env-created'));
