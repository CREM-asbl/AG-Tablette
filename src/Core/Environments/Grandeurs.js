import './Common';
import { standardKit } from '../ShapesKits/standardKit';
import { app } from '../App';
import '../../Create';
import '../../Reverse';
import '../../Merge';
import '../../Group';
import '../../Ungroup';
import '../../BackgroundColor';
import '../../BorderColor';
import '../../Copy';
import '../../BuildCenter';
import '../../Delete';
import '../../Translate';
import '../../Zoom';
import '../../Opacity';
import '../../ToBackground';
import '../../Divide';
import '../../Cut';
import '../../Biface';
import '../../Grid';

app.environment.loadFamilies(standardKit);

app.environment.extension = 'agg';

window.dispatchEvent(new CustomEvent('env-created'));
