import { CreateCircleTool } from './CreateCircleTool';

let _instance = null;

export default {
  get tool() {
    if (!_instance) {
      _instance = new CreateCircleTool();
    }
    return _instance;
  },
};
