import { app } from './Core/App';
import { goToHomePage } from './Core/Tools/general';

window.onpopstate = e => {
  if (app.environment?.name?.length > 0 && confirm('retourner à la page d\'accueil ?'))
    goToHomePage();
  else
    history.pushState({}, "main page");
}
