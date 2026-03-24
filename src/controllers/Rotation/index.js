import { RotationTool } from './RotationTool';

let _instance = null;

export default {
  get tool() {
    if (!_instance) {
      _instance = new RotationTool();
    }
    return _instance;
  },
};
