import { app } from '../App';
import './Common';
import '../../Reverse';
import '../../Group';
import '../../Ungroup';
import '../../BackgroundColor';
import '../../BorderColor';
import '../../Rotate45';
import '../../Tangram';

app.environment.extension = 'agt';
app.settings.set('areShapesPointed', false);

window.dispatchEvent(new CustomEvent('env-created'));
