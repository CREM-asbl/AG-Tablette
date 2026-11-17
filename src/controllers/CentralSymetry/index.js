import { CentralSymetryTool } from './CentralSymetryTool';

let _instance = null;

export default {
  get tool() {
    if (!_instance) {
      _instance = new CentralSymetryTool();
    }
    return _instance;
  },
};
