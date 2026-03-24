import { MoveTool } from './MoveTool';

let _instance = null;

export default {
  get tool() {
    if (!_instance) {
      _instance = new MoveTool();
    }
    return _instance;
  },
};
