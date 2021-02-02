import './Common';
import { app } from '../App';
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

import '../../CreateGeometry';
import '../../Transform';

app.environment.extension = 'agl';

window.dispatchEvent(new CustomEvent('state-changed'));
