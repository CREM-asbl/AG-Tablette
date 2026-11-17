import { CreatePointTool } from './CreatePointTool';

let _instance = null;

export default {
  get tool() {
    if (!_instance) {
      _instance = new CreatePointTool();
    }
    return _instance;
  },
};
