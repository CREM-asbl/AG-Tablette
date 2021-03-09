import { ZoomTool } from './ZoomTool';
import { ZoomAction } from './ZoomAction';
import { PermanentZoomTool } from './PermanentZoomTool';

export default {
  tool: new ZoomTool(),
  action: new ZoomAction()
}
new PermanentZoomTool();