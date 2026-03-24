import { CreateTriangleTool } from './CreateTriangleTool';

let _instance = null;

export default {
  get tool() {
    if (!_instance) {
      _instance = new CreateTriangleTool();
    }
    return _instance;
  },
};
