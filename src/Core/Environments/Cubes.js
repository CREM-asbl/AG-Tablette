import './Common';
import { cubesKit } from '../ShapesKits/cubesKit';
import { app, setState } from '../App';
import '../../Create';
import '../../Copy';
import '../../Delete';
import '../../Group';
import '../../Ungroup';
import '../../ToBackground';
import '../../BackgroundColor';
import '../../BorderColor';
import '../../Translate';
import '../../Zoom';
import '../../Grid';

app.environment.loadFamilies(cubesKit);

app.environment.extension = 'agc';

window.dispatchEvent(new CustomEvent('state-changed'));
