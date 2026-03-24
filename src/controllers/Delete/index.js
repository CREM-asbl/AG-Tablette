import { DeleteTool } from './DeleteTool';

let _instance = null;

export default {
  get tool() {
    if (!_instance) {
      _instance = new DeleteTool();
    }
    return _instance;
  },
};
