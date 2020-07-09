import './Common';
import { kit } from '../ShapesKits/cubesKit';
import { app } from '../App';
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

app.environment.loadFamilies(kit);

app.environment.extension = 'agc';

window.dispatchEvent(new CustomEvent('env-created'));
