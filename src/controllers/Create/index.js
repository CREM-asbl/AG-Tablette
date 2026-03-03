import { CreateTool } from './CreateTool';

let _instance = null;

export default {
  get tool() {
    if (!_instance) {
      _instance = new CreateTool();
    }
    return _instance;
  },
};
