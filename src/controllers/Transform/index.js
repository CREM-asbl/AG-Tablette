import { TransformTool } from './TransformTool';

let _instance = null;

export default {
  get tool() {
    if (!_instance) {
      _instance = new TransformTool();
    }
    return _instance;
  },
};
