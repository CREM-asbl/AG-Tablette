import { GroupTool } from './GroupTool';

let _instance = null;

export default {
  get tool() {
    if (!_instance) {
      _instance = new GroupTool();
    }
    return _instance;
  },
};
