import { ResetPositionTool } from './ResetPositionTool';

let _instance = null;

export default {
  get tool() {
    if (!_instance) {
      _instance = new ResetPositionTool();
    }
    return _instance;
  },
};
