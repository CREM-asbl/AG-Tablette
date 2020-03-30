import './Common';
import { kit } from '../ShapesKits/cubesKit';
import { app } from '../App';

app.environment.loadFamilies(kit);

window.dispatchEvent(new CustomEvent('env-created'));
