import { ShowTool } from './ShowTool';

let _instance = null;

export default {
  get tool() {
    if (!_instance) {
      _instance = new ShowTool();
    }
    return _instance;
  },
};
