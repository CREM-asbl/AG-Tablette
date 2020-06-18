import './Common';
import { kit } from '../ShapesKits/cubesKit';
import { app } from '../App';
import '../../Create';
import '../../Group';
import '../../Ungroup';
import '../../BackgroundColor';
import '../../BorderColor';
import '../../Copy';
import '../../Delete';
import '../../Translate';
import '../../Zoom';
import '../../ToBackground';

app.environment.loadFamilies(kit);

app.environment.extension = 'agc';

window.dispatchEvent(new CustomEvent('env-created'));
