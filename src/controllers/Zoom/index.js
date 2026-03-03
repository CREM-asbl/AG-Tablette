import { ZoomTool } from './ZoomTool';

let _instance = null;

export default {
  get tool() {
    if (!_instance) {
      _instance = new ZoomTool();
    }
    return _instance;
  },
};
