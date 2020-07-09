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

window.dispatchEvent(new CustomEvent('env-created'));
