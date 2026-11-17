import { RotateTool } from './RotateTool';

let _instance = null;

export default {
  get tool() {
    if (!_instance) {
      _instance = new RotateTool();
    }
    return _instance;
  },
};
