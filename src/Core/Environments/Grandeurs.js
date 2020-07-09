import './Common';
import { standardKit } from '../ShapesKits/standardKit';
import { app } from '../App';
import '../../Create';
import '../../Reverse';
import '../../BuildCenter';
import '../../Divide';
import '../../Cut';
import '../../Copy';
import '../../Merge';
import '../../Delete';
import '../../Group';
import '../../Ungroup';
import '../../ToBackground';
import '../../BackgroundColor';
import '../../BorderColor';
import '../../Opacity';
import '../../Biface';
import '../../Translate';
import '../../Zoom';
import '../../Grid';

app.environment.loadFamilies(standardKit);

app.environment.extension = 'agg';

window.dispatchEvent(new CustomEvent('env-created'));
