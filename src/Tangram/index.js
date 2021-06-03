import './TangramManager';
import { SilhouetteCreatorTool } from './SilhouetteCreatorTool';
import { SolutionCheckerTool } from './SolutionCheckerTool';

export default {
  tool: new SilhouetteCreatorTool(),
};
new SolutionCheckerTool();
