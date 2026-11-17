import { ColorTool } from './ColorTool';

let _instance = null;

export default {
  get tool() {
    if (!_instance) {
      _instance = new ColorTool();
    }
    return _instance;
  },
};
