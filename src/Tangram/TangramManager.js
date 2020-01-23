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
 * Copier-coller le contenu d'un fichier tangram.json.
 * Ces tangrams sont importés via la méthode retrieveTangrams()
 */
let mainTangramsJSON = [
  {
    id: '16c967eb9724a8ce',
    name: 'Bateau',
    shapes: [
      {
        id: '16c967eb970404b5',
        coordinates: { x: 571.355339059328, y: 202.644660940672 },
        name: 'Petit losange',
        familyName: 'Carré',
        refPoint: { x: -35.355339059328, y: 35.355339059328 },
        color: '#F00',
        borderColor: '#000',
        isCenterShown: false,
        isReversed: false,
        opacity: 1,
        buildSteps: [
          { type: 'moveTo', coordinates: { x: -85.355339059328, y: 35.355339059328 } },
          { type: 'vertex', coordinates: { x: -85.355339059328, y: 35.355339059328 } },
          {
            type: 'segment',
            coordinates: { x: 14.644660940671997, y: 35.355339059328 },
            points: [],
            isArc: false,
          },
          { type: 'vertex', coordinates: { x: 14.644660940671997, y: 35.355339059328 } },
          {
            type: 'segment',
            coordinates: { x: 85.35533905932999, y: -35.35533905932999 },
            points: [],
            isArc: false,
          },
          { type: 'vertex', coordinates: { x: 85.35533905932999, y: -35.35533905932999 } },
          {
            type: 'segment',
            coordinates: { x: -14.644660940670008, y: -35.35533905932999 },
            points: [],
            isArc: false,
          },
          { type: 'vertex', coordinates: { x: -14.644660940670008, y: -35.35533905932999 } },
          {
            type: 'segment',
            coordinates: { x: -85.355339059328, y: 35.355339059328 },
            points: [],
            isArc: false,
          },
        ],
      },
      {
        id: '16c967eb9719ca4b',
        coordinates: { x: 552.666666666668, y: 271.333333333332 },
        name: 'Triangle rectangle isocèle',
        familyName: 'Carré',
        refPoint: { x: -33.333333333332, y: 33.333333333332 },
        color: '#F00',
        borderColor: '#000',
        isCenterShown: false,
        isReversed: true,
        opacity: 1,
        buildSteps: [
          { type: 'moveTo', coordinates: { x: 33.333333333332, y: -33.333333333332 } },
          { type: 'vertex', coordinates: { x: 33.333333333332, y: -33.333333333332 } },
          {
            type: 'segment',
            coordinates: { x: 33.33333333333201, y: 66.666666666668 },
            points: [],
            isArc: false,
          },
          { type: 'vertex', coordinates: { x: 33.33333333333201, y: 66.666666666668 } },
          {
            type: 'segment',
            coordinates: { x: -66.666666666668, y: -33.33333333333201 },
            points: [],
            isArc: false,
          },
          { type: 'vertex', coordinates: { x: -66.666666666668, y: -33.33333333333201 } },
          {
            type: 'segment',
            coordinates: { x: 33.333333333332, y: -33.333333333332 },
            points: [],
            isArc: false,
          },
        ],
      },
      {
        id: '16c967eb9715c928',
        coordinates: { x: 511, y: 288 },
        name: 'Petit triangle rectangle isocèle',
        familyName: 'Carré',
        refPoint: { x: -50, y: 25 },
        color: '#F00',
        borderColor: '#000',
        isCenterShown: false,
        isReversed: true,
        opacity: 1,
        buildSteps: [
          { type: 'moveTo', coordinates: { x: -25, y: 50 } },
          { type: 'vertex', coordinates: { x: -25, y: 50 } },
          { type: 'segment', coordinates: { x: -25, y: -50 }, points: [], isArc: false },
          { type: 'vertex', coordinates: { x: -25, y: -50 } },
          { type: 'segment', coordinates: { x: 25, y: 0 }, points: [], isArc: false },
          { type: 'vertex', coordinates: { x: 25, y: 0 } },
          { type: 'segment', coordinates: { x: -25, y: 50 }, points: [], isArc: false },
        ],
      },
      {
        id: '16c967eb97183a13',
        coordinates: { x: 536, y: 313 },
        name: 'Petit triangle rectangle isocèle',
        familyName: 'Carré',
        refPoint: { x: -50, y: 25 },
        color: '#F00',
        borderColor: '#000',
        isCenterShown: false,
        isReversed: false,
        opacity: 1,
        buildSteps: [
          { type: 'moveTo', coordinates: { x: -50, y: 25 } },
          { type: 'vertex', coordinates: { x: -50, y: 25 } },
          { type: 'segment', coordinates: { x: 50, y: 25 }, points: [], isArc: false },
          { type: 'vertex', coordinates: { x: 50, y: 25 } },
          { type: 'segment', coordinates: { x: 0, y: -25 }, points: [], isArc: false },
          { type: 'vertex', coordinates: { x: 0, y: -25 } },
          { type: 'segment', coordinates: { x: -50, y: 25 }, points: [], isArc: false },
        ],
      },
      {
        id: '16c967eb97173f72',
        coordinates: { x: 469.333333333332, y: 304.666666666668 },
        name: 'Petit triangle rectangle',
        familyName: 'Carré',
        refPoint: { x: -33.333333333332, y: 33.333333333332 },
        color: '#F00',
        borderColor: '#000',
        isCenterShown: false,
        isReversed: false,
        opacity: 1,
        buildSteps: [
          { type: 'moveTo', coordinates: { x: -33.333333333332, y: 33.333333333332 } },
          { type: 'vertex', coordinates: { x: -33.333333333332, y: 33.333333333332 } },
          {
            type: 'segment',
            coordinates: { x: 16.666666666668, y: 33.333333333332 },
            points: [],
            isArc: false,
          },
          { type: 'vertex', coordinates: { x: 16.666666666668, y: 33.333333333332 } },
          {
            type: 'segment',
            coordinates: { x: 16.666666666668, y: -66.666666666668 },
            points: [],
            isArc: false,
          },
          { type: 'vertex', coordinates: { x: 16.666666666668, y: -66.666666666668 } },
          {
            type: 'segment',
            coordinates: { x: -33.333333333332, y: 33.333333333332 },
            points: [],
            isArc: false,
          },
        ],
      },
      {
        id: '16c967eb9715a01d',
        coordinates: { x: 486, y: 388 },
        name: 'Carré',
        familyName: 'Carré',
        refPoint: { x: -50, y: 50 },
        color: '#F00',
        borderColor: '#000',
        isCenterShown: false,
        isReversed: false,
        opacity: 1,
        buildSteps: [
          { type: 'moveTo', coordinates: { x: -50, y: 50 } },
          { type: 'vertex', coordinates: { x: -50, y: 50 } },
          { type: 'segment', coordinates: { x: 50, y: 50 }, points: [], isArc: false },
          { type: 'vertex', coordinates: { x: 50, y: 50 } },
          { type: 'segment', coordinates: { x: 50, y: -50 }, points: [], isArc: false },
          { type: 'vertex', coordinates: { x: 50, y: -50 } },
          { type: 'segment', coordinates: { x: -50, y: -50 }, points: [], isArc: false },
          { type: 'vertex', coordinates: { x: -50, y: -50 } },
          { type: 'segment', coordinates: { x: -50, y: 50 }, points: [], isArc: false },
        ],
      },
      {
        id: '16c967eb9713dd8b',
        coordinates: { x: 436, y: 488 },
        name: 'Parallélogramme',
        familyName: 'Carré',
        refPoint: { x: 0, y: 50 },
        color: '#F00',
        borderColor: '#000',
        isCenterShown: false,
        isReversed: false,
        opacity: 1,
        buildSteps: [
          { type: 'moveTo', coordinates: { x: 0, y: 50 } },
          { type: 'vertex', coordinates: { x: 0, y: 50 } },
          { type: 'segment', coordinates: { x: 100, y: 50 }, points: [], isArc: false },
          { type: 'vertex', coordinates: { x: 100, y: 50 } },
          { type: 'segment', coordinates: { x: 0, y: -50 }, points: [], isArc: false },
          { type: 'vertex', coordinates: { x: 0, y: -50 } },
          { type: 'segment', coordinates: { x: -100, y: -50 }, points: [], isArc: false },
          { type: 'vertex', coordinates: { x: -100, y: -50 } },
          { type: 'segment', coordinates: { x: 0, y: 50 }, points: [], isArc: false },
        ],
      },
      {
        id: '16c967eb97151203',
        coordinates: { x: 536, y: 488 },
        name: 'Parallélogramme',
        familyName: 'Carré',
        refPoint: { x: 0, y: 50 },
        color: '#F00',
        borderColor: '#000',
        isCenterShown: false,
        isReversed: false,
        opacity: 1,
        buildSteps: [
          { type: 'moveTo', coordinates: { x: 0, y: 50 } },
          { type: 'vertex', coordinates: { x: 0, y: 50 } },
          { type: 'segment', coordinates: { x: 100, y: 50 }, points: [], isArc: false },
          { type: 'vertex', coordinates: { x: 100, y: 50 } },
          { type: 'segment', coordinates: { x: 0, y: -50 }, points: [], isArc: false },
          { type: 'vertex', coordinates: { x: 0, y: -50 } },
          { type: 'segment', coordinates: { x: -100, y: -50 }, points: [], isArc: false },
          { type: 'vertex', coordinates: { x: -100, y: -50 } },
          { type: 'segment', coordinates: { x: 0, y: 50 }, points: [], isArc: false },
        ],
      },
      {
        id: '16c967eb9717e083',
        coordinates: { x: 419.333333333332, y: 404.666666666668 },
        name: 'Petit triangle rectangle',
        familyName: 'Carré',
        refPoint: { x: -33.333333333332, y: 33.333333333332 },
        color: '#F00',
        borderColor: '#000',
        isCenterShown: false,
        isReversed: false,
        opacity: 1,
        buildSteps: [
          { type: 'moveTo', coordinates: { x: -33.333333333332, y: 33.333333333332 } },
          { type: 'vertex', coordinates: { x: -33.333333333332, y: 33.333333333332 } },
          {
            type: 'segment',
            coordinates: { x: 16.666666666668, y: 33.333333333332 },
            points: [],
            isArc: false,
          },
          { type: 'vertex', coordinates: { x: 16.666666666668, y: 33.333333333332 } },
          {
            type: 'segment',
            coordinates: { x: 16.666666666668, y: -66.666666666668 },
            points: [],
            isArc: false,
          },
          { type: 'vertex', coordinates: { x: 16.666666666668, y: -66.666666666668 } },
          {
            type: 'segment',
            coordinates: { x: -33.333333333332, y: 33.333333333332 },
            points: [],
            isArc: false,
          },
        ],
      },
      {
        id: '16c967eb97115e0e',
        coordinates: { x: 553.57876435722, y: 420.2239755942638 },
        name: 'Petit triangle rectangle isocèle',
        familyName: 'Carré',
        refPoint: { x: -50, y: 25 },
        color: '#F00',
        borderColor: '#000',
        isCenterShown: false,
        isReversed: false,
        opacity: 1,
        buildSteps: [
          { type: 'moveTo', coordinates: { x: 53.13081316869251, y: 17.38150430870387 } },
          { type: 'vertex', coordinates: { x: 53.13081316869251, y: 17.38150430870387 } },
          {
            type: 'segment',
            coordinates: { x: -17.97328445425242, y: -52.93355312017634 },
            points: [],
            isArc: false,
          },
          { type: 'vertex', coordinates: { x: -17.97328445425242, y: -52.93355312017634 } },
          {
            type: 'segment',
            coordinates: { x: -17.578764357220034, y: 17.776024405736212 },
            points: [],
            isArc: false,
          },
          { type: 'vertex', coordinates: { x: -17.578764357220034, y: 17.776024405736212 } },
          {
            type: 'segment',
            coordinates: { x: 53.13081316869251, y: 17.38150430870387 },
            points: [],
            isArc: false,
          },
        ],
      },
      {
        id: '16c967eb971e41bb',
        coordinates: { x: 602.666666666668, y: 471.333333333332 },
        name: 'Triangle rectangle isocèle',
        familyName: 'Carré',
        refPoint: { x: -33.333333333332, y: 33.333333333332 },
        color: '#F00',
        borderColor: '#000',
        isCenterShown: false,
        isReversed: true,
        opacity: 1,
        buildSteps: [
          { type: 'moveTo', coordinates: { x: 33.333333333332, y: -33.333333333332 } },
          { type: 'vertex', coordinates: { x: 33.333333333332, y: -33.333333333332 } },
          {
            type: 'segment',
            coordinates: { x: 33.33333333333201, y: 66.666666666668 },
            points: [],
            isArc: false,
          },
          { type: 'vertex', coordinates: { x: 33.33333333333201, y: 66.666666666668 } },
          {
            type: 'segment',
            coordinates: { x: -66.666666666668, y: -33.33333333333201 },
            points: [],
            isArc: false,
          },
          { type: 'vertex', coordinates: { x: -66.666666666668, y: -33.33333333333201 } },
          {
            type: 'segment',
            coordinates: { x: 33.333333333332, y: -33.333333333332 },
            points: [],
            isArc: false,
          },
        ],
      },
      {
        id: '16c967eb9712898',
        coordinates: { x: 769.333333333332, y: 471.333333333332 },
        name: 'Triangle rectangle isocèle',
        familyName: 'Carré',
        refPoint: { x: -33.333333333332, y: 33.333333333332 },
        color: '#F00',
        borderColor: '#000',
        isCenterShown: false,
        isReversed: false,
        opacity: 1,
        buildSteps: [
          { type: 'moveTo', coordinates: { x: -33.333333333332, y: -33.333333333332 } },
          { type: 'vertex', coordinates: { x: -33.333333333332, y: -33.333333333332 } },
          {
            type: 'segment',
            coordinates: { x: -33.33333333333201, y: 66.666666666668 },
            points: [],
            isArc: false,
          },
          { type: 'vertex', coordinates: { x: -33.33333333333201, y: 66.666666666668 } },
          {
            type: 'segment',
            coordinates: { x: 66.666666666668, y: -33.33333333333201 },
            points: [],
            isArc: false,
          },
          { type: 'vertex', coordinates: { x: 66.666666666668, y: -33.33333333333201 } },
          {
            type: 'segment',
            coordinates: { x: -33.333333333332, y: -33.333333333332 },
            points: [],
            isArc: false,
          },
        ],
      },
      {
        id: '16c967eb972226c3',
        coordinates: { x: 686, y: 488 },
        name: 'Carré',
        familyName: 'Carré',
        refPoint: { x: -50, y: 50 },
        color: '#F00',
        borderColor: '#000',
        isCenterShown: false,
        isReversed: false,
        opacity: 1,
        buildSteps: [
          { type: 'moveTo', coordinates: { x: -50, y: 50 } },
          { type: 'vertex', coordinates: { x: -50, y: 50 } },
          { type: 'segment', coordinates: { x: 50, y: 50 }, points: [], isArc: false },
          { type: 'vertex', coordinates: { x: 50, y: 50 } },
          { type: 'segment', coordinates: { x: 50, y: -50 }, points: [], isArc: false },
          { type: 'vertex', coordinates: { x: 50, y: -50 } },
          { type: 'segment', coordinates: { x: -50, y: -50 }, points: [], isArc: false },
          { type: 'vertex', coordinates: { x: -50, y: -50 } },
          { type: 'segment', coordinates: { x: -50, y: 50 }, points: [], isArc: false },
        ],
      },
    ],
    polygons: [
      [
        { x: 336, y: 438 },
        { x: 436, y: 538 },
        { x: 536, y: 538 },
        { x: 636, y: 538 },
        { x: 736, y: 538 },
        { x: 836, y: 438 },
        { x: 736, y: 438 },
        { x: 636, y: 438 },
        { x: 606.7095775259126, y: 437.60547990296766 },
        { x: 535.6054799029677, y: 367.29042247408745 },
        { x: 536, y: 338 },
        { x: 586, y: 338 },
        { x: 586, y: 238 },
        { x: 656.710678118658, y: 167.289321881342 },
        { x: 556.710678118658, y: 167.289321881342 },
        { x: 486, y: 238 },
        { x: 436, y: 338 },
        { x: 386, y: 438 },
        { x: 336, y: 438 },
      ],
    ],
  },
  {
    id: '16c969ca7339014',
    name: 'Jaune',
    shapes: [
      {
        id: '16c969ca7313a2e2',
        coordinates: { x: 389.6987298108, y: 151.79491924319998 },
        name: 'Petit losange',
        familyName: 'Triangle équilatéral',
        refPoint: { x: -93.3012701892, y: 25 },
        color: '#FF0',
        borderColor: '#000',
        isCenterShown: false,
        isReversed: false,
        opacity: 1,
        buildSteps: [
          { type: 'moveTo', coordinates: { x: -93.3012701892, y: 25 } },
          { type: 'vertex', coordinates: { x: -93.3012701892, y: 25 } },
          {
            type: 'segment',
            coordinates: { x: 6.698729810800003, y: 25 },
            points: [],
            isArc: false,
          },
          { type: 'vertex', coordinates: { x: 6.698729810800003, y: 25 } },
          { type: 'segment', coordinates: { x: 93.3012701892, y: -25 }, points: [], isArc: false },
          { type: 'vertex', coordinates: { x: 93.3012701892, y: -25 } },
          {
            type: 'segment',
            coordinates: { x: -6.698729810800003, y: -25 },
            points: [],
            isArc: false,
          },
          { type: 'vertex', coordinates: { x: -6.698729810800003, y: -25 } },
          { type: 'segment', coordinates: { x: -93.3012701892, y: 25 }, points: [], isArc: false },
        ],
      },
      {
        id: '16c969ca731d940c',
        coordinates: { x: 439.69872981080005, y: 78.58983848640003 },
        name: 'Petit losange',
        familyName: 'Triangle équilatéral',
        refPoint: { x: -93.3012701892, y: 25 },
        color: '#FF0',
        borderColor: '#000',
        isCenterShown: false,
        isReversed: false,
        opacity: 1,
        buildSteps: [
          { type: 'moveTo', coordinates: { x: -93.3012701892, y: 25 } },
          { type: 'vertex', coordinates: { x: -93.3012701892, y: 25 } },
          {
            type: 'segment',
            coordinates: { x: 6.698729810800003, y: 25 },
            points: [],
            isArc: false,
          },
          { type: 'vertex', coordinates: { x: 6.698729810800003, y: 25 } },
          { type: 'segment', coordinates: { x: 93.3012701892, y: -25 }, points: [], isArc: false },
          { type: 'vertex', coordinates: { x: 93.3012701892, y: -25 } },
          {
            type: 'segment',
            coordinates: { x: -6.698729810800003, y: -25 },
            points: [],
            isArc: false,
          },
          { type: 'vertex', coordinates: { x: -6.698729810800003, y: -25 } },
          { type: 'segment', coordinates: { x: -93.3012701892, y: 25 }, points: [], isArc: false },
        ],
      },
      {
        id: '16c969ca7317b7e7',
        coordinates: { x: 570.5, y: 96.89110867559998 },
        name: 'Trapèze rectangle',
        familyName: 'Triangle équilatéral',
        refPoint: { x: -37.5, y: 43.3012701892 },
        color: '#FF0',
        borderColor: '#000',
        isCenterShown: false,
        isReversed: false,
        opacity: 1,
        buildSteps: [
          { type: 'moveTo', coordinates: { x: 12.5, y: -43.3012701892 } },
          { type: 'vertex', coordinates: { x: 12.5, y: -43.3012701892 } },
          {
            type: 'segment',
            coordinates: { x: -37.5, y: -43.3012701892 },
            points: [],
            isArc: false,
          },
          { type: 'vertex', coordinates: { x: -37.5, y: -43.3012701892 } },
          {
            type: 'segment',
            coordinates: { x: -37.5, y: 43.3012701892 },
            points: [],
            isArc: false,
          },
          { type: 'vertex', coordinates: { x: -37.5, y: 43.3012701892 } },
          { type: 'segment', coordinates: { x: 62.5, y: 43.3012701892 }, points: [], isArc: false },
          { type: 'vertex', coordinates: { x: 62.5, y: 43.3012701892 } },
          {
            type: 'segment',
            coordinates: { x: 12.5, y: -43.3012701892 },
            points: [],
            isArc: false,
          },
        ],
      },
      {
        id: '16c969ca73290ac4',
        coordinates: { x: 620.5, y: 183.49364905399997 },
        name: 'Trapèze rectangle',
        familyName: 'Triangle équilatéral',
        refPoint: { x: -37.5, y: 43.3012701892 },
        color: '#FF0',
        borderColor: '#000',
        isCenterShown: false,
        isReversed: false,
        opacity: 1,
        buildSteps: [
          { type: 'moveTo', coordinates: { x: 12.5, y: -43.3012701892 } },
          { type: 'vertex', coordinates: { x: 12.5, y: -43.3012701892 } },
          {
            type: 'segment',
            coordinates: { x: -37.5, y: -43.3012701892 },
            points: [],
            isArc: false,
          },
          { type: 'vertex', coordinates: { x: -37.5, y: -43.3012701892 } },
          {
            type: 'segment',
            coordinates: { x: -37.5, y: 43.3012701892 },
            points: [],
            isArc: false,
          },
          { type: 'vertex', coordinates: { x: -37.5, y: 43.3012701892 } },
          { type: 'segment', coordinates: { x: 62.5, y: 43.3012701892 }, points: [], isArc: false },
          { type: 'vertex', coordinates: { x: 62.5, y: 43.3012701892 } },
          {
            type: 'segment',
            coordinates: { x: 12.5, y: -43.3012701892 },
            points: [],
            isArc: false,
          },
        ],
      },
      {
        id: '16c969ca7328f681',
        coordinates: { x: 633, y: 313.3974596216 },
        name: 'Hexagone régulier',
        familyName: 'Triangle équilatéral',
        refPoint: { x: -50, y: 86.6025403784 },
        color: '#FF0',
        borderColor: '#000',
        isCenterShown: false,
        isReversed: false,
        opacity: 1,
        buildSteps: [
          { type: 'moveTo', coordinates: { x: -50, y: -86.6025403784 } },
          { type: 'vertex', coordinates: { x: -50, y: -86.6025403784 } },
          { type: 'segment', coordinates: { x: -100, y: 0 }, points: [], isArc: false },
          { type: 'vertex', coordinates: { x: -100, y: 0 } },
          { type: 'segment', coordinates: { x: -50, y: 86.6025403784 }, points: [], isArc: false },
          { type: 'vertex', coordinates: { x: -50, y: 86.6025403784 } },
          { type: 'segment', coordinates: { x: 50, y: 86.6025403784 }, points: [], isArc: false },
          { type: 'vertex', coordinates: { x: 50, y: 86.6025403784 } },
          { type: 'segment', coordinates: { x: 100, y: 0 }, points: [], isArc: false },
          { type: 'vertex', coordinates: { x: 100, y: 0 } },
          { type: 'segment', coordinates: { x: 50, y: -86.6025403784 }, points: [], isArc: false },
          { type: 'vertex', coordinates: { x: 50, y: -86.6025403784 } },
          { type: 'segment', coordinates: { x: -50, y: -86.6025403784 }, points: [], isArc: false },
        ],
      },
      {
        id: '16c969ca7328196c',
        coordinates: { x: 520.5, y: 356.6987298108 },
        name: 'Trapèze rectangle',
        familyName: 'Triangle équilatéral',
        refPoint: { x: -37.5, y: 43.3012701892 },
        color: '#FF0',
        borderColor: '#000',
        isCenterShown: false,
        isReversed: false,
        opacity: 1,
        buildSteps: [
          { type: 'moveTo', coordinates: { x: 12.5, y: -43.3012701892 } },
          { type: 'vertex', coordinates: { x: 12.5, y: -43.3012701892 } },
          {
            type: 'segment',
            coordinates: { x: -37.5, y: -43.3012701892 },
            points: [],
            isArc: false,
          },
          { type: 'vertex', coordinates: { x: -37.5, y: -43.3012701892 } },
          {
            type: 'segment',
            coordinates: { x: -37.5, y: 43.3012701892 },
            points: [],
            isArc: false,
          },
          { type: 'vertex', coordinates: { x: -37.5, y: 43.3012701892 } },
          { type: 'segment', coordinates: { x: 62.5, y: 43.3012701892 }, points: [], isArc: false },
          { type: 'vertex', coordinates: { x: 62.5, y: 43.3012701892 } },
          {
            type: 'segment',
            coordinates: { x: 12.5, y: -43.3012701892 },
            points: [],
            isArc: false,
          },
        ],
      },
      {
        id: '16c969ca7329c4a5',
        coordinates: { x: 483, y: 251.19661282879997 },
        name: 'Grand triangle isocèle',
        familyName: 'Triangle équilatéral',
        refPoint: { x: -50, y: 62.2008467928 },
        color: '#FF0',
        borderColor: '#000',
        isCenterShown: false,
        isReversed: false,
        opacity: 1,
        buildSteps: [
          { type: 'moveTo', coordinates: { x: -50, y: 62.2008467928 } },
          { type: 'vertex', coordinates: { x: -50, y: 62.2008467928 } },
          { type: 'segment', coordinates: { x: 50, y: 62.2008467928 }, points: [], isArc: false },
          { type: 'vertex', coordinates: { x: 50, y: 62.2008467928 } },
          {
            type: 'segment',
            coordinates: { x: 0, y: -124.40169358559999 },
            points: [],
            isArc: false,
          },
          { type: 'vertex', coordinates: { x: 0, y: -124.40169358559999 } },
          { type: 'segment', coordinates: { x: -50, y: 62.2008467928 }, points: [], isArc: false },
        ],
      },
      {
        id: '16c969ca7324fa30',
        coordinates: { x: 466.3903963122852, y: 342.1989505300944 },
        name: 'Triangle rectangle',
        familyName: 'Triangle équilatéral',
        refPoint: { x: -16.6666666666666, y: 28.867513459466 },
        color: '#FF0',
        borderColor: '#000',
        isCenterShown: false,
        isReversed: false,
        opacity: 1,
        buildSteps: [
          { type: 'moveTo', coordinates: { x: 16.78089053378069, y: 57.70193085158483 } },
          { type: 'vertex', coordinates: { x: 16.78089053378069, y: 57.70193085158483 } },
          {
            type: 'segment',
            coordinates: { x: 16.60950577850434, y: -28.90043994308833 },
            points: [],
            isArc: false,
          },
          { type: 'vertex', coordinates: { x: 16.60950577850434, y: -28.90043994308833 } },
          {
            type: 'segment',
            coordinates: { x: -33.390396312285176, y: -28.80149090849444 },
            points: [],
            isArc: false,
          },
          { type: 'vertex', coordinates: { x: -33.390396312285176, y: -28.80149090849444 } },
          {
            type: 'segment',
            coordinates: { x: 16.78089053378069, y: 57.70193085158483 },
            points: [],
            isArc: false,
          },
        ],
      },
      {
        id: '16c969ca732aa96c',
        coordinates: { x: 433, y: 371.132486540534 },
        name: 'Triangle équilatéral',
        familyName: 'Triangle équilatéral',
        refPoint: { x: -50, y: 28.867513459466 },
        color: '#FF0',
        borderColor: '#000',
        isCenterShown: false,
        isReversed: false,
        opacity: 1,
        buildSteps: [
          { type: 'moveTo', coordinates: { x: 0, y: -57.735026918934 } },
          { type: 'vertex', coordinates: { x: 0, y: -57.735026918934 } },
          {
            type: 'segment',
            coordinates: { x: -50, y: 28.867513459466 },
            points: [],
            isArc: false,
          },
          { type: 'vertex', coordinates: { x: -50, y: 28.867513459466 } },
          { type: 'segment', coordinates: { x: 50, y: 28.867513459466 }, points: [], isArc: false },
          { type: 'vertex', coordinates: { x: 50, y: 28.867513459466 } },
          { type: 'segment', coordinates: { x: 0, y: -57.735026918934 }, points: [], isArc: false },
        ],
      },
      {
        id: '16c969ca732ec08c',
        coordinates: { x: 483, y: 443.3012701892 },
        name: 'Trapèze isocèle',
        familyName: 'Triangle équilatéral',
        refPoint: { x: -100, y: 43.3012701892 },
        color: '#FF0',
        borderColor: '#000',
        isCenterShown: false,
        isReversed: true,
        opacity: 1,
        buildSteps: [
          { type: 'moveTo', coordinates: { x: -50, y: 43.3012701892 } },
          { type: 'vertex', coordinates: { x: -50, y: 43.3012701892 } },
          {
            type: 'segment',
            coordinates: { x: -100, y: -43.3012701892 },
            points: [],
            isArc: false,
          },
          { type: 'vertex', coordinates: { x: -100, y: -43.3012701892 } },
          { type: 'segment', coordinates: { x: 100, y: -43.3012701892 }, points: [], isArc: false },
          { type: 'vertex', coordinates: { x: 100, y: -43.3012701892 } },
          { type: 'segment', coordinates: { x: 50, y: 43.3012701892 }, points: [], isArc: false },
          { type: 'vertex', coordinates: { x: 50, y: 43.3012701892 } },
          { type: 'segment', coordinates: { x: -50, y: 43.3012701892 }, points: [], isArc: false },
        ],
      },
      {
        id: '16c969ca732a975f',
        coordinates: { x: 508, y: 529.9038105676 },
        name: 'Losange',
        familyName: 'Triangle équilatéral',
        refPoint: { x: -25, y: 43.3012701892 },
        color: '#FF0',
        borderColor: '#000',
        isCenterShown: false,
        isReversed: false,
        opacity: 1,
        buildSteps: [
          { type: 'moveTo', coordinates: { x: -75, y: -43.3012701892 } },
          { type: 'vertex', coordinates: { x: -75, y: -43.3012701892 } },
          { type: 'segment', coordinates: { x: -25, y: 43.3012701892 }, points: [], isArc: false },
          { type: 'vertex', coordinates: { x: -25, y: 43.3012701892 } },
          { type: 'segment', coordinates: { x: 75, y: 43.3012701892 }, points: [], isArc: false },
          { type: 'vertex', coordinates: { x: 75, y: 43.3012701892 } },
          { type: 'segment', coordinates: { x: 25, y: -43.3012701892 }, points: [], isArc: false },
          { type: 'vertex', coordinates: { x: 25, y: -43.3012701892 } },
          { type: 'segment', coordinates: { x: -75, y: -43.3012701892 }, points: [], isArc: false },
        ],
      },
      {
        id: '16c969ca732222f7',
        coordinates: { x: 433, y: 544.3375672973339 },
        name: 'Triangle équilatéral',
        familyName: 'Triangle équilatéral',
        refPoint: { x: -50, y: 28.867513459466 },
        color: '#FF0',
        borderColor: '#000',
        isCenterShown: false,
        isReversed: false,
        opacity: 1,
        buildSteps: [
          { type: 'moveTo', coordinates: { x: 0, y: -57.735026918934 } },
          { type: 'vertex', coordinates: { x: 0, y: -57.735026918934 } },
          {
            type: 'segment',
            coordinates: { x: -50, y: 28.867513459466 },
            points: [],
            isArc: false,
          },
          { type: 'vertex', coordinates: { x: -50, y: 28.867513459466 } },
          { type: 'segment', coordinates: { x: 50, y: 28.867513459466 }, points: [], isArc: false },
          { type: 'vertex', coordinates: { x: 50, y: 28.867513459466 } },
          { type: 'segment', coordinates: { x: 0, y: -57.735026918934 }, points: [], isArc: false },
        ],
      },
      {
        id: '16c969ca7329c58b',
        coordinates: { x: 708, y: 529.9038105676 },
        name: 'Losange',
        familyName: 'Triangle équilatéral',
        refPoint: { x: -25, y: 43.3012701892 },
        color: '#FF0',
        borderColor: '#000',
        isCenterShown: false,
        isReversed: false,
        opacity: 1,
        buildSteps: [
          { type: 'moveTo', coordinates: { x: -75, y: -43.3012701892 } },
          { type: 'vertex', coordinates: { x: -75, y: -43.3012701892 } },
          { type: 'segment', coordinates: { x: -25, y: 43.3012701892 }, points: [], isArc: false },
          { type: 'vertex', coordinates: { x: -25, y: 43.3012701892 } },
          { type: 'segment', coordinates: { x: 75, y: 43.3012701892 }, points: [], isArc: false },
          { type: 'vertex', coordinates: { x: 75, y: 43.3012701892 } },
          { type: 'segment', coordinates: { x: 25, y: -43.3012701892 }, points: [], isArc: false },
          { type: 'vertex', coordinates: { x: 25, y: -43.3012701892 } },
          { type: 'segment', coordinates: { x: -75, y: -43.3012701892 }, points: [], isArc: false },
        ],
      },
      {
        id: '16c969ca733a6691',
        coordinates: { x: 608, y: 529.9038105676 },
        name: 'Losange',
        familyName: 'Triangle équilatéral',
        refPoint: { x: -25, y: 43.3012701892 },
        color: '#FF0',
        borderColor: '#000',
        isCenterShown: false,
        isReversed: false,
        opacity: 1,
        buildSteps: [
          { type: 'moveTo', coordinates: { x: -75, y: -43.3012701892 } },
          { type: 'vertex', coordinates: { x: -75, y: -43.3012701892 } },
          { type: 'segment', coordinates: { x: -25, y: 43.3012701892 }, points: [], isArc: false },
          { type: 'vertex', coordinates: { x: -25, y: 43.3012701892 } },
          { type: 'segment', coordinates: { x: 75, y: 43.3012701892 }, points: [], isArc: false },
          { type: 'vertex', coordinates: { x: 75, y: 43.3012701892 } },
          { type: 'segment', coordinates: { x: 25, y: -43.3012701892 }, points: [], isArc: false },
          { type: 'vertex', coordinates: { x: 25, y: -43.3012701892 } },
          { type: 'segment', coordinates: { x: -75, y: -43.3012701892 }, points: [], isArc: false },
        ],
      },
      {
        id: '16c969ca73312433',
        coordinates: { x: 633, y: 443.3012701892 },
        name: 'Trapèze isocèle',
        familyName: 'Triangle équilatéral',
        refPoint: { x: -100, y: 43.3012701892 },
        color: '#FF0',
        borderColor: '#000',
        isCenterShown: false,
        isReversed: false,
        opacity: 1,
        buildSteps: [
          { type: 'moveTo', coordinates: { x: -50, y: -43.3012701892 } },
          { type: 'vertex', coordinates: { x: -50, y: -43.3012701892 } },
          { type: 'segment', coordinates: { x: -100, y: 43.3012701892 }, points: [], isArc: false },
          { type: 'vertex', coordinates: { x: -100, y: 43.3012701892 } },
          { type: 'segment', coordinates: { x: 100, y: 43.3012701892 }, points: [], isArc: false },
          { type: 'vertex', coordinates: { x: 100, y: 43.3012701892 } },
          { type: 'segment', coordinates: { x: 50, y: -43.3012701892 }, points: [], isArc: false },
          { type: 'vertex', coordinates: { x: 50, y: -43.3012701892 } },
          { type: 'segment', coordinates: { x: -50, y: -43.3012701892 }, points: [], isArc: false },
        ],
      },
    ],
    polygons: [
      [
        { x: 383, y: 573.2050807567998 },
        { x: 483, y: 573.2050807567999 },
        { x: 583, y: 573.2050807567999 },
        { x: 683, y: 573.2050807567999 },
        { x: 783, y: 573.2050807567999 },
        { x: 733, y: 486.60254037839996 },
        { x: 683, y: 400 },
        { x: 733, y: 313.3974596216 },
        { x: 683, y: 226.79491924319996 },
        { x: 633, y: 140.1923788648 },
        { x: 583, y: 53.589838486399984 },
        { x: 533, y: 53.589838486399984 },
        { x: 433.00000000000006, y: 53.589838486400026 },
        { x: 346.39745962160004, y: 103.58983848640003 },
        { x: 446.39745962160004, y: 103.58983848640003 },
        { x: 533, y: 53.589838486400026 },
        { x: 533, y: 140.1923788648 },
        { x: 583, y: 140.1923788648 },
        { x: 583, y: 226.79491924319996 },
        { x: 533, y: 313.3974596216 },
        { x: 483, y: 126.79491924319998 },
        { x: 383, y: 126.79491924319998 },
        { x: 296.3974596216, y: 176.79491924319998 },
        { x: 396.3974596216, y: 176.79491924319998 },
        { x: 483, y: 126.79491924319998 },
        { x: 433, y: 313.3974596216 },
        { x: 383, y: 400 },
        { x: 433, y: 486.60254037839985 },
        { x: 383, y: 573.2050807567998 },
      ],
    ],
  },
];
