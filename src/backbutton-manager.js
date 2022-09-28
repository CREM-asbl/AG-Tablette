import { app } from './Core/App';
import { goToHomePage } from './Core/Tools/general';

// if (!window.dev_mode)
// window.onbeforeunload = (event) => {
//   return false;
// };
window.onpopstate = e => {
  if (app.environment?.name?.length > 0 && confirm('retourner à la page d\'accueil ?'))
    goToHomePage();
  else
    history.pushState({}, "main page");
  // setState({environment: undefined, environmentLoading: false});
}
