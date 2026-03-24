import { CreateLineTool } from './CreateLineTool';

let _instance = null;

export default {
  get tool() {
    if (!_instance) {
      _instance = new CreateLineTool();
    }
    return _instance;
  },
};
