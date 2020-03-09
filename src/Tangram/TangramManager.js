import { app } from '../Core/App';
import { getComplementaryColor } from '../Core/Tools/general';
import { standardTangramKit } from '../Core/ShapesKits/standardTangramKit';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { SelectManager } from '../Core/Managers/SelectManager';
import { Tangram } from './Tangram';
import { Silhouette } from '../Core/Objects/Silhouette';
import { Shape } from '../Core/Objects/Shape';
import { Point } from '../Core/Objects/Point';

addEventListener('close-tangram-popup', () => TangramManager.closePopup());

export class TangramManager {
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
    if (!newSegments) {
      window.dispatchEvent(
        new CustomEvent('show-notif', {
          detail: { message: 'Certaines formes se superposent' },
        }),
      );
      return;
    }

    newSegments = TangramManager.linkNewSegments(newSegments);
    if (!newSegments) {
      window.dispatchEvent(
        new CustomEvent('show-notif', {
          detail: { message: 'La silhouette formée crée une forme creuse' },
        }),
      );
      return;
    }

    let silhouette = TangramManager.getSilhouetteFromSegments(
      newSegments,
      silhouetteMode == 'withInternalSegment' ? internalSegments : [],
    );
    app.tangram.silhouette = silhouette;

    window.dispatchEvent(new CustomEvent('refreshBackground'));
  }

  static getSilhouetteFromSegments(segments, internalSegments) {
    let shapes = segments.map(segs =>
      Shape.createFromSegments(segs, 'silhouette', 'tangram', internalSegments),
    );
    let silhouette = new Silhouette(shapes);
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
      return { newSegments: null, internalSegments: null };

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
    let newSegments = [],
      nextSegment,
      segmentUsed = 0;

    while (segmentUsed != segmentsList.length) {
      // segment beeing in use (may be prolongated)
      let currentSegment = segmentsList.find(seg => !seg.isUsed),
        // first segment used (not modified)
        firstSegment = currentSegment,
        newSegmentsSet = [];

      currentSegment.isUsed = true;
      newSegmentsSet.push(currentSegment);
      segmentUsed++;

      while (!firstSegment.vertexes[0].equal(currentSegment.vertexes[1])) {
        // while not closed
        const newPotentialSegments = segmentsList.filter(
          seg => !seg.isUsed && seg.contains(currentSegment.vertexes[1], false),
        );
        if (newPotentialSegments.length != 1) {
          if (newPotentialSegments.length == 0) console.log('shape cannot be closed (dead end)');
          else console.log('shape is dig (a segment has more than one segment for next)');
          return null;
        }
        nextSegment = newPotentialSegments[0].copy(false);
        newPotentialSegments[0].isUsed = true;
        if (nextSegment.vertexes[1].equal(currentSegment.vertexes[1])) nextSegment.reverse(true);

        if (currentSegment.hasSameDirection(nextSegment, 1, 0, false)) {
          currentSegment.vertexes[1] = nextSegment.vertexes[1];
        } else {
          newSegmentsSet.push(nextSegment);
          currentSegment = nextSegment;
        }
        segmentUsed++;
      }
      if (
        newSegmentsSet.length != 1 &&
        currentSegment.hasSameDirection(firstSegment, 1, 0, false)
      ) {
        newSegmentsSet[0].vertexes[0] = newSegmentsSet.pop().vertexes[0];
      }
      newSegments.push(newSegmentsSet);
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

  static retrieveTangrams() {
    if (!app || app.CremTangrams.length) return;

    fetch('./src/Tangram/CremTangrams/square.agt')
      .then(response => {
        return response.text();
      })
      .then(text => {
        let object = JSON.parse(text);
        if (object) app.CremTangrams.push(object);
      });

    fetch('./src/Tangram/CremTangrams/squareInternal.agt')
      .then(response => {
        return response.text();
      })
      .then(text => {
        let object = JSON.parse(text);
        if (object) app.CremTangrams.push(object);
      });
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

window.addEventListener('create-silhouette', event => {
  TangramManager.createSilhouette(event.detail.shapes, event.detail.silhouetteMode);
});

TangramManager.setTangram(new Tangram('', shapes));

app.CremTangrams = [];

TangramManager.retrieveTangrams();
