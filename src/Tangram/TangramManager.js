import { app } from '../js/App';
import { Tangram } from './Tangram';

app.states = {
  ...app.states,
  tangram: {
    name: 'Faire un Tangram',
    type: 'tool',
  },
};

app.tangrams = { main: [], local: [] };

//Todo: Créer un event plus précis
addEventListener('app-state-changed', () => {
  if (app.state === 'tangram') TangramManager.showPopup();
});

addEventListener('close-tangram-popup', () => TangramManager.closePopup());

export class TangramManager {
  static hide() {
    app.workspace.settings.set('isTangramShown', false);
  }

  static show(tangramType, tangramId) {
    app.workspace.settings.set('isTangramShown', true);
    app.workspace.settings.set('shownTangram', {
      type: tangramType,
      id: tangramId,
    });
  }

  static closePopup() {
    document.querySelector('tangram-popup').remove();
  }

  static showPopup() {
    this.retrieveTangrams();
    import('./tangram-popup');
    const popup = document.createElement('tangram-popup');
    popup.style.display = 'block';
    document.querySelector('body').appendChild(popup);
  }

  static addLocalTangram(tangram) {
    app.tangrams.local.push(tangram);
    let ls = window.localStorage,
      amount = parseInt(ls.getItem('AG_TangramsAmount')),
      object = tangram.saveToObject(),
      json = JSON.stringify(object);
    ls.setItem('AG_TangramsAmount', amount + 1);
    ls.setItem('AG_TangramsList_TG' + amount, json);
  }

  static retrieveTangrams() {
    //Main
    if (!app) return;
    app.tangrams.main = mainTangramsJSON.map(data => {
      let tangram = new Tangram();
      tangram.initFromObject(data);
      return tangram;
    });

    //Local
    let ls = window.localStorage;
    app.tangrams.local.splice(0); //vider le tableau

    //Init localStorage if necessary
    if (ls.getItem('AG_TangramsAmount') == null) {
      ls.setItem('AG_TangramsAmount', 0);
    }

    let amount = parseInt(ls.getItem('AG_TangramsAmount'));
    for (let i = 0; i < amount; i++) {
      let tangram = new Tangram(),
        json = ls.getItem('AG_TangramsList_TG' + i),
        object = JSON.parse(json);

      tangram.initFromObject(object);
      app.tangrams.local.push(tangram);
    }
  }

  static deleteLocalTangram(id) {
    let ls = window.localStorage,
      index = app.tangrams.local.findIndex(tangram => tangram.id == id),
      tangramAmount = parseInt(ls.getItem('AG_TangramsAmount'));
    if (index == -1) return null;
    app.tangrams.local.splice(index, 1);

    //Décale les Tangrams suivants vers la gauche.
    for (let i = index + 1; i < tangramAmount; i++) {
      let json = ls.getItem('AG_TangramsList_TG' + i);
      ls.setItem('AG_TangramsList_TG' + (i - 1), json);
    }

    ls.setItem('AG_TangramsAmount', tangramAmount - 1);
  }

  static getTangram(type, id) {
    let tab = app.tangrams[type];
    for (let i = 0; i < tab.length; i++) {
      if (tab[i].id == id) return tab[i];
    }
    return null;
  }

  static getCurrentTangram() {
    if (!app.workspace.settings.get('isTangramShown')) return null;
    let { type, id } = app.workspace.settings.get('shownTangram');
    return this.getTangram(type, id);
  }

  /**
   * Renvoie un point de la silhouette du tangram qui est proche du point reçu,
   * ou null si pas de point proche.
   * @param  {Point} point Coordonnées d'un point
   * @return {Point}
   */
  static getNearTangramPoint(point) {
    //TODO: si mode silhouette, uniquement contour, sinon points internes aussi.
    let tangram = this.getCurrentTangram();
    if (tangram == null) return null;

    let bestPoint = null,
      bestDist = 1000 * 1000 * 1000;

    tangram.polygons.forEach(polygon => {
      polygon.forEach(tangramPt => {
        if (app.interactionAPI.arePointsInMagnetismDistance(point, tangramPt)) {
          let dist = point.dist(tangramPt);
          if (dist < bestDist) {
            bestDist = dist;
            bestOffset = tangramPt;
          }
        }
      });
    });

    return bestPoint;
  }

  /**
   * Calcule l'ajustement que l'on peut appliquer à un groupe de formes, pour
   * se coller à la silouette du tangram. Si aucune des formes n'est proche de
   * la silouette, renvoie null.
   * @param {[Shapes]} shapes      Liste des formes du groupe
   * @param {Shape} mainShape   La forme sélectionnée par l'utilisateur
   * @param {Point} coordinates Coordonnées de la forme sélectionnée
   */
  static getShapeGroupOffset(shapes, mainShape, coordinates) {
    //Calcule la liste des sommets des formes
    let points = shapes
      .map(s => {
        return s.buildSteps
          .filter(bs => bs.type == 'vertex')
          .map(vertex => {
            return {
              shape: s,
              relativePoint: vertex.coordinates,
              realPoint: vertex.coordinates
                .addCoordinates(s)
                .addCoordinates(coordinates)
                .subCoordinates(mainShape),
            };
          });
      })
      .reduce((total, val) => {
        return total.concat(val);
      }, []);

    if (points.length == 0) return null;
    let tangram = this.getCurrentTangram();
    if (tangram == null) return null;

    let tangramPoints = tangram.polygons.reduce((total, elem) => {
      return total.concat(elem);
    }, []);

    let bestOffset = null,
      bestDist = 1000 * 1000 * 1000;

    points.forEach(pt => {
      tangramPoints.forEach(tangramPt => {
        if (app.interactionAPI.arePointsInMagnetismDistance(pt.realPoint, tangramPt)) {
          let dist = pt.realPoint.addCoordinates(tangramPt);
          if (dist < bestDist) {
            bestDist = dist;
            bestOffset = tangramPt.subCoordinates(pt.realPoint);
          }
        }
      });
    });

    return bestOffset;
  }
}

/**
 * Copier-coller le contenu d'un ou plusieurs fichier(s) tangram.json.
 * Ces tangrams sont importés via la méthode retrieveTangrams()
 */
let mainTangramsJSON = [

];
