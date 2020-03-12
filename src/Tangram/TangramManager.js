import { app } from '../Core/App';
import { getComplementaryColor } from '../Core/Tools/general';
import { standardTangramKit } from '../Core/ShapesKits/standardTangramKit';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { SelectManager } from '../Core/Managers/SelectManager';
import { Tangram } from './Tangram';
import { Silhouette } from '../Core/Objects/Silhouette';
import { Shape } from '../Core/Objects/Shape';
import { Segment } from '../Core/Objects/Segment';
import { Point } from '../Core/Objects/Point';

app.tangrams = { main: [], local: [] };

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

    window.addEventListener(
      'workspace-changed',
      () => {
        app.workspace.setTranslateOffset(new Point(56.325569909594186, 62.67211299799919));
        app.workspace.setZoomLevel(0.8677803523248963);
      },
      { once: true },
    );
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
    let silhouette = new Silhouette([shape]);
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

    let cutSegments = oldSegments
      .map((segment, idx, segments) => {
        let vertexesInside = segments
          .filter((seg, i) => i != idx)
          .map(seg =>
            seg.vertexes.filter(
              vertex =>
                segment.isPointOnSegment(vertex) &&
                !segment.vertexes.some(vert => vert.equal(vertex)),
            ),
          )
          .flat()
          .filter((vertex, idx, vertexes) => vertexes.findIndex(v => v.equal(vertex)) == idx);
        if (vertexesInside.length) return segment.divideWith(vertexesInside);
        else return segment;
      })
      .flat();

    // delete common segments
    let newSegments = [];
    cutSegments.forEach((seg, i, segments) => {
      if (seg.used) return;
      let segs = segments
        .map(segment => (segment.equal(seg) ? segment : undefined))
        .filter(Boolean);
      if (segs.length == 1) newSegments.push(seg);
      else segs.forEach(seg => (seg.used = true));
    });

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

  static async getTangramFromServer(filename) {
    const response = await fetch(filename, { mode: 'cors' }),
      smallFilename = filename.slice('http://api.crem.be'.length);
    if (response.ok) {
      let object = await response.json();
      if (object) return { ...object, filename: smallFilename };
      else console.error('Failed to parse file', smallFilename);
    } else {
      console.error('Failed to get file', smallFilename);
    }
  }

  static async retrieveTangrams() {
    if (!app || app.CremTangrams.length) return;

    const serverURL = 'http://api.crem.be/',
      folder = 'tangram/',
      filenames = ['Square.agt', 'SquareInternal.agt'],
      fullFilenames = filenames.map(name => serverURL + folder + name);

    let jsons = (await Promise.all(
      fullFilenames.map(async filename => this.getTangramFromServer(filename)),
    )).filter(Boolean);

    jsons.forEach(json => app.CremTangrams.push(json));
  }

  /**
   * Renvoie un point de la silhouette du tangram qui est proche du point reçu,
   * ou null si pas de point proche.
   * @param  {Point} point Coordonnées d'un point
   * @return {Point}
   */
  static getNearTangramPoint(point) {
    const shapes = app.tangram.silhouette.shapes,
      allPoints = shapes.map(s => s.allPoints).flat();

    let bestPoint = null,
      bestDist = 1000 * 1000 * 1000;

    allPoints.forEach(tangramPt => {
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
