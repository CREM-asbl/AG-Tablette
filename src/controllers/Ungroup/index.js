import { UngroupTool } from './UngroupTool';

let _instance = null;

export default {
  get tool() {
    if (!_instance) {
      _instance = new UngroupTool();
    }
    return _instance;
  },
};
