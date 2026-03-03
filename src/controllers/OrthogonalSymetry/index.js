import { OrthogonalSymetryTool } from './OrthogonalSymetryTool';

let _instance = null;

export default {
  get tool() {
    if (!_instance) {
      _instance = new OrthogonalSymetryTool();
    }
    return _instance;
  },
};
