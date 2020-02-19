import { app } from '../js/App';
import { Tangram } from './Tangram';
import { standardTangramKit } from '../js/ShapesKits/standardTangramKit';
import { Shape } from '../js/Objects/Shape';
import { ShapeManager } from '../js/ShapeManager';
import { getComplementaryColor } from '../js/Tools/general';
import { Point } from '../js/Objects/Point';
import { Segment } from '../js/Objects/Segment';
import { SelectManager } from '../js/SelectManager';
import { Silhouette } from '../js/Objects/Silhouette';

app.tangrams = { main: [], local: [] };

//Todo: Créer un event plus précis
// addEventListener('app-state-changed', () => {
//   if (app.state === 'tangram') TangramManager.showPopup();
// });

addEventListener('close-tangram-popup', () => TangramManager.closePopup());

export class TangramManager {
  // static hide() {
  //   app.workspace.settings.set('isTangramShown', false);
  // }

  // static show(tangramType, tangramId) {
  //   app.workspace.settings.set('isTangramShown', true);
  //   app.workspace.settings.set('shownTangram', {
  //     type: tangramType,
  //     id: tangramId,
  //   });
  // }

  static showShapes() {
    app.tangram.shapes.forEach(s => ShapeManager.addShape(s.copy()));
  }

  static hideShapes() {
    app.workspace.shapes = [];
  }

  static setTangram(tangram) {
    app.tangram = tangram;
    app.workspace.setTranslateOffset(new Point(56.325569909594186, 62.67211299799919));
    app.workspace.setZoomLevel(0.8677803523248963);
  }

  static createSilhouette(shapes, silhouetteMode) {
    let { newSegments, internalSegments } = TangramManager.checkGroupMerge(shapes);
    if (!newSegments)
      window.dispatchEvent(
        new CustomEvent('show-notif', {
          detail: { message: 'Formes creuses ou en plusieurs morceaux' },
        }),
      );

    newSegments = TangramManager.linkNewSegments(newSegments);
    if (!newSegments) {
      window.dispatchEvent(
        new CustomEvent('show-notif', {
          detail: { message: 'Formes creuses ou en plusieurs morceaux' },
        }),
      );
      return;
    }

    let silhouette = TangramManager.getSilhouetteFromSegments(
      newSegments,
      silhouetteMode == 'withInternalSegment' ? internalSegments : [],
    );
    return silhouette;
  }

  static getSilhouetteFromSegments(segments, internalSegments) {
    let shape = new Shape({ x: 0, y: 0 }, null, 'silhouette', 'tangram');
    shape.setSegments(segments);
    shape.setInternalSegments(internalSegments);
    shape.color = '#000';
    shape.second_color = getComplementaryColor(shape.color);
    shape.opacity = 1;
    let silhouette = new Silhouette(shape);
    return silhouette;
  }

  static checkGroupMerge(shapes) {
    if (
      shapes.some(shape =>
        shapes.some(s => {
          if (s.id == shape.id) return false;
          else return s.overlapsWith(shape);
        }),
      )
    )
      return null;

    let oldSegments = shapes.map(s => s.segments.map(seg => seg.copy())).flat(),
      oldSegmentsSave = oldSegments.map(seg => seg.copy());

    // TODO replace indexes by real segments

    // delete common segments
    let newSegments = [];
    oldSegments.forEach((seg, i, segments) => {
      if (seg.used) return;
      let indexes = oldSegments
        .map((segment, idx) => {
          if (segment.equal(seg)) {
            return idx;
          }
        })
        .filter(el => el !== undefined);
      if (indexes.length == 1) newSegments.push(seg);
      else indexes.forEach(idx => (segments[idx].used = true));
    });

    // delete segments inside others
    newSegments.forEach(seg => (seg.used = false));
    oldSegments = newSegments;
    newSegments = [];
    oldSegments.forEach((seg, i, segments) => {
      if (seg.used) return;
      let indexes = oldSegments
        .map((segment, idx) => {
          if (idx != i && seg.isSubsegment(segment)) {
            return idx;
          }
        })
        .filter(el => el !== undefined);
      if (indexes.length != 0) {
        segments[i].used = true;
        indexes.forEach(idx => (segments[idx].used = true));
        let subsegs = indexes.map(idx => segments[idx]);
        subsegs.forEach(subseg => !subseg.hasSameDirection(seg) && subseg.reverse());
        subsegs.sort((subseg1, subseg2) =>
          subseg1.vertexes[1].dist(seg.vertexes[1]) < subseg2.vertexes[1].dist(seg.vertexes[1])
            ? 1
            : -1,
        );
        let currentSegment = seg;
        subsegs.forEach(subseg => {
          if (!subseg.vertexes[0].equal(currentSegment.vertexes[0]))
            newSegments.push(new Segment(currentSegment.vertexes[0], subseg.vertexes[0]));
          currentSegment = new Segment(subseg.vertexes[1], currentSegment.vertexes[1]);
        });
        if (currentSegment.length > 0.001) newSegments.push(currentSegment);
      }
    });
    oldSegments.forEach(seg => {
      return !seg.used ? newSegments.push(seg) : undefined;
    });

    // resize segments that share subSegments with others
    newSegments.forEach(seg => (seg.used = false));
    oldSegments = newSegments;
    newSegments = [];
    for (let i = 0; i < oldSegments.length; i++) {
      let seg = oldSegments[i];
      let commonSegmentIdx = oldSegments.findIndex(
        (segment, idx) =>
          idx != i &&
          seg.subSegments.some(subseg =>
            segment.subSegments.some(subseg2 => subseg.equal(subseg2)),
          ),
      );
      if (commonSegmentIdx == -1) continue;
      let commonSegment = oldSegments[commonSegmentIdx];
      let junction = seg.subSegments
        .filter(subseg => commonSegment.subSegments.some(subseg2 => subseg.equal(subseg2)))
        .sort((seg1, seg2) => (seg1.length < seg2.length ? 1 : -1))[0];
      !commonSegment.hasSameDirection(seg) && commonSegment.reverse();
      !junction.hasSameDirection(seg) && junction.reverse();
      let createdSegments = [];
      if (!seg.vertexes[0].equal(junction.vertexes[0]))
        createdSegments.push(new Segment(seg.vertexes[0], junction.vertexes[0]));
      if (!seg.vertexes[1].equal(junction.vertexes[1]))
        createdSegments.push(new Segment(seg.vertexes[1], junction.vertexes[1]));
      if (!commonSegment.vertexes[0].equal(junction.vertexes[0]))
        createdSegments.push(new Segment(commonSegment.vertexes[0], junction.vertexes[0]));
      if (!commonSegment.vertexes[1].equal(junction.vertexes[1]))
        createdSegments.push(new Segment(commonSegment.vertexes[1], junction.vertexes[1]));
      let indexToRemove = [i, commonSegmentIdx].sort((idx1, idx2) => idx1 - idx2);
      oldSegments.splice(indexToRemove[1], 1);
      oldSegments.splice(indexToRemove[0], 1, ...createdSegments);
      i = -1;
    }
    newSegments = oldSegments;

    let internalSegments = oldSegmentsSave.filter(
      oldSeg => !newSegments.some(newSeg => oldSeg.isSubsegment(newSeg)),
    );

    return { newSegments, internalSegments };
  }

  static linkNewSegments(segmentsList) {
    // Todo : Voir si on ne peut pas la simplifier
    let newSegments = [];

    // segment beeing in use (may be prolongated)
    let currentSegment = segmentsList[0].copy(false);
    // last segment used (not modified)
    let lastSegment = currentSegment;
    let firstSegment = currentSegment;
    let nextSegment;
    let segmentUsed = 0;

    newSegments.push(currentSegment);
    segmentUsed++;

    while (!firstSegment.vertexes[0].equal(currentSegment.vertexes[1])) {
      // while not closed
      const newPotentialSegments = segmentsList.filter(
        seg => !seg.equal(lastSegment) && seg.contains(currentSegment.vertexes[1], false),
      );
      if (newPotentialSegments.length != 1) {
        if (newPotentialSegments.length == 0) console.log('shape cannot be closed (dead end)');
        else console.log('shape is dig (a segment has more than one segment for next)');
        return null;
      }
      nextSegment = newPotentialSegments[0].copy(false);
      if (nextSegment.vertexes[1].equal(currentSegment.vertexes[1])) nextSegment.reverse(true);

      if (currentSegment.hasSameDirection(nextSegment, 1, 0, false)) {
        currentSegment.vertexes[1] = nextSegment.vertexes[1];
      } else {
        newSegments.push(nextSegment);
        currentSegment = nextSegment;
      }
      segmentUsed++;
      lastSegment = nextSegment;
    }
    if (segmentUsed != segmentsList.length) {
      console.log('shape is dig (not all segments have been used)');
      return null;
    }
    if (newSegments.length != 1 && currentSegment.hasSameDirection(firstSegment, 1, 0, false)) {
      newSegments[0].vertexes[0] = newSegments.pop().vertexes[0];
    }
    return newSegments;
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

  // static addLocalTangram(tangram) {
  //   app.tangrams.local.push(tangram);
  //   let ls = window.localStorage,
  //     amount = parseInt(ls.getItem('AG_TangramsAmount')),
  //     object = tangram.saveToObject(),
  //     json = JSON.stringify(object);
  //   ls.setItem('AG_TangramsAmount', amount + 1);
  //   ls.setItem('AG_TangramsList_TG' + amount, json);
  // }

  static retrieveTangrams() {
    //Main
    if (!app || app.CremTangrams.length) return;

    fetch('./src/CremTangrams/square.agt')
      .then(response => {
        return response.text();
      })
      .then(text => {
        let object = JSON.parse(text);
        if (object) app.CremTangrams.push(object);
      });

    // const //fs = require('fs'),
    //   dirname = '../CremTangrams';

    // // function readFiles(dirname, onFileContent, onError) {
    // fs.readdir(dirname, (err, filenames) => {
    //   if (err) {
    //     console.error(err);
    //     return;
    //   }
    //   filenames.forEach((filename) => {
    //     fs.readFile(dirname + filename, 'utf-8', (err, content) => {
    //       if (err) {
    //         onError(err);
    //         return;
    //       }

    //       let object = JSON.parse(content);
    //       if (object)
    //         app.tangrams.push(object);
    //     });
    //   });
    //   // });
    // });

    // app.tangrams.main = mainTangramsJSON.map(data => {
    //   let tangram = new Tangram();
    //   tangram.initFromObject(data);
    //   return tangram;
    // });
  }

  // static deleteLocalTangram(id) {
  //   let ls = window.localStorage,
  //     index = app.tangrams.local.findIndex(tangram => tangram.id == id),
  //     tangramAmount = parseInt(ls.getItem('AG_TangramsAmount'));
  //   if (index == -1) return null;
  //   app.tangrams.local.splice(index, 1);

  //   //Décale les Tangrams suivants vers la gauche.
  //   for (let i = index + 1; i < tangramAmount; i++) {
  //     let json = ls.getItem('AG_TangramsList_TG' + i);
  //     ls.setItem('AG_TangramsList_TG' + (i - 1), json);
  //   }

  //   ls.setItem('AG_TangramsAmount', tangramAmount - 1);
  // }

  // static getTangram(type, id) {
  //   let tab = app.tangrams[type];
  //   for (let i = 0; i < tab.length; i++) {
  //     if (tab[i].id == id) return tab[i];
  //   }
  //   return null;
  // }

  // static getCurrentTangram() {
  //   if (!app.workspace.settings.get('isTangramShown')) return null;
  //   let { type, id } = app.workspace.settings.get('shownTangram');
  //   return this.getTangram(type, id);
  // }

  /**
   * Renvoie un point de la silhouette du tangram qui est proche du point reçu,
   * ou null si pas de point proche.
   * @param  {Point} point Coordonnées d'un point
   * @return {Point}
   */
  static getNearTangramPoint(point) {
    let shape = app.tangram.silhouette.shape;

    let bestPoint = null,
      bestDist = 1000 * 1000 * 1000;

    shape.allPoints.forEach(tangramPt => {
      if (SelectManager.arePointsInMagnetismDistance(point, tangramPt)) {
        let dist = point.dist(tangramPt);
        if (dist < bestDist) {
          bestDist = dist;
          bestPoint = tangramPt;
        }
      }
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
  // static getShapeGroupOffset(shapes, mainShape, coordinates) {
  //   //Calcule la liste des sommets des formes
  //   let points = shapes
  //     .map(s => {
  //       return s.buildSteps
  //         .filter(bs => bs.type == 'vertex')
  //         .map(vertex => {
  //           return {
  //             shape: s,
  //             relativePoint: vertex.coordinates,
  //             realPoint: vertex.coordinates
  //               .addCoordinates(s)
  //               .addCoordinates(coordinates)
  //               .subCoordinates(mainShape),
  //           };
  //         });
  //     })
  //     .reduce((total, val) => {
  //       return total.concat(val);
  //     }, []);

  //   if (points.length == 0) return null;
  //   let tangram = this.getCurrentTangram();
  //   if (tangram == null) return null;

  //   let tangramPoints = tangram.polygons.reduce((total, elem) => {
  //     return total.concat(elem);
  //   }, []);

  //   let bestOffset = null,
  //     bestDist = 1000 * 1000 * 1000;

  //   points.forEach(pt => {
  //     tangramPoints.forEach(tangramPt => {
  //       if (app.interactionAPI.arePointsInMagnetismDistance(pt.realPoint, tangramPt)) {
  //         let dist = pt.realPoint.addCoordinates(tangramPt);
  //         if (dist < bestDist) {
  //           bestDist = dist;
  //           bestOffset = tangramPt.subCoordinates(pt.realPoint);
  //         }
  //       }
  //     });
  //   });

  //   return bestOffset;
  // }
}

/**
 * Copier-coller le contenu d'un ou plusieurs fichier(s) tangram.json.
 * Ces tangrams sont importés via la méthode retrieveTangrams()
 */
// let mainTangramsJSON = [];

let shapes = [];
(data => {
  data.shapes.forEach(s => {
    let shape = new Shape({ x: 0, y: 0 }, null, s.name, 'tangram');
    shape.setSegments(s.segments);
    shape.color = data.color ? data.color : '#000';
    shape.second_color = getComplementaryColor(shape.color);
    shapes.push(shape);
  });
})(standardTangramKit);

window.addEventListener('new-window', () => {
  TangramManager.setTangram(new Tangram('', shapes));
});

TangramManager.setTangram(new Tangram('', shapes));

app.CremTangrams = [];

TangramManager.retrieveTangrams();
