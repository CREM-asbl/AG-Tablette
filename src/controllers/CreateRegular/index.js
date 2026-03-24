import { CreateRegularTool } from './CreateRegularTool';
import './regular-popup';

let _instance = null;

export default {
  get tool() {
    if (!_instance) {
      _instance = new CreateRegularTool();
    }
    return _instance;
  },
};
