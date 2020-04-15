import './Common';
import { kit } from '../ShapesKits/cubesKit';
import { app } from '../App';

import { CreateState } from '../../Create/CreateState';
import { CreateAction } from '../../Create/CreateAction';

new CreateState();
new CreateAction();

app.environment.loadFamilies(kit);

window.dispatchEvent(new CustomEvent('env-created'));
