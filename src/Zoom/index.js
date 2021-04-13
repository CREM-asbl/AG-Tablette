import { ZoomState } from './ZoomState';
import { ZoomAction } from './ZoomAction';
import { PermanentZoomState } from './PermanentZoomState';

export default {
  state: new ZoomState(),
  action: new ZoomAction()
}
new PermanentZoomState();