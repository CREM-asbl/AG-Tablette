import { HideTool } from './HideTool';

let _instance = null;

export default {
  get tool() {
    if (!_instance) {
      _instance = new HideTool();
    }
    return _instance;
  },
};
