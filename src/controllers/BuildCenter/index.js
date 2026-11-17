import { BuildCenterTool } from './BuildCenterTool';

let _instance = null;

export default {
  get tool() {
    if (!_instance) {
      _instance = new BuildCenterTool();
    }
    return _instance;
  },
};
