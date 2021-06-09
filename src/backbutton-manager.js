import { setState } from './Core/App';
import { goToHomePage } from './Core/Tools/general';

// if (!window.dev_mode)
// window.onbeforeunload = (event) => {
//   return false;
// };
window.onpopstate = e => {
  goToHomePage();
  // setState({environment: undefined, environmentLoading: false});
}