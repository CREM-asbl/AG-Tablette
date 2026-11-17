import { Rotate45Tool } from './Rotate45Tool';

let _instance = null;

export default {
  get tool() {
    if (!_instance) {
      _instance = new Rotate45Tool();
    }
    return _instance;
  },
};
