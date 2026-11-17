import { CopyTool } from './CopyTool';

let _instance = null;

export default {
  get tool() {
    if (!_instance) {
      _instance = new CopyTool();
    }
    return _instance;
  },
};
