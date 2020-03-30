import { app } from '../Core/App';
import { getComplementaryColor } from '../Core/Tools/general';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { SelectManager } from '../Core/Managers/SelectManager';
import { Silhouette } from '../Core/Objects/Silhouette';
import { Shape } from '../Core/Objects/Shape';
import { Point } from '../Core/Objects/Point';
import { FileManager } from '../Core/Managers/FileManager';

addEventListener('close-tangram-popup', () => TangramManager.closePopup());

export class TangramManager {
  static showShapes() {
    FileManager.parseFile(app.tangramStartPos);
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
    if (!silhouette) return;
    app.silhouette = silhouette;

    window.dispatchEvent(new CustomEvent('refreshBackground'));
  }

  static getSilhouetteFromSegments(segments, internalSegments) {
    let shapes = segments.map(segs =>
      Shape.createFromSegments(segs, 'silhouette', 'tangram', internalSegments),
    );
    shapes = TangramManager.checkShapesInsideOthers(shapes);
    if (!shapes) return;
    let silhouette = new Silhouette(shapes);
    return silhouette;
  }

  static checkShapesInsideOthers(shapes) {
    for (let i = 0; i < shapes.length; i++) {
      let partialInside = shapes.findIndex(
        (s, idx) => i != idx && s.segments.some(seg => shapes[i].isSegmentInside(seg)),
      );
      if (partialInside != -1) {
        let commonSegs = [
          ...shapes[i].segments.filter(seg => shapes[partialInside].isSegmentInside(seg)),
          ...shapes[partialInside].segments.filter(seg => shapes[i].isSegmentInside(seg)),
        ];
        let nonCommonSegs = [
          ...shapes[i].segments.filter(seg => commonSegs.every(comSeg => !seg.equal(comSeg))),
          ...shapes[partialInside].segments.filter(seg =>
            commonSegs.every(comSeg => !seg.equal(comSeg)),
          ),
        ];
        let extSegs = TangramManager.linkNewSegments(nonCommonSegs);
        if (extSegs.length != 1) {
          window.dispatchEvent(
            new CustomEvent('show-notif', {
              detail: { message: 'Le silhouette créée est trop complexe' },
            }),
          );
          return;
        }
        let intSegs = TangramManager.linkNewSegments(commonSegs);
        if (intSegs.length != 1) {
          window.dispatchEvent(
            new CustomEvent('show-notif', {
              detail: { message: 'Le silhouette créée est trop complexe' },
            }),
          );
          return;
        }
        shapes[i] = Shape.createFromSegments(extSegs[0], 'silhouette', 'tangram', [
          ...shapes[i].internalSegments,
          ...shapes[partialInside].internalSegments,
        ]);
        shapes[i].internalSegmentsSets.push(intSegs[0]);
        shapes.splice(partialInside, 1);
        i--;
      } else {
        let insideOf = shapes.findIndex((s, idx) => i != idx && s.isInside(shapes[i]));
        if (insideOf != -1) {
          shapes[i].internalSegmentsSets.push(shapes[insideOf].segments);
          shapes.splice(insideOf, 1);
          i--;
        }
      }
    }
    return shapes;
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

    let internalSegments = cutSegments.filter(
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
      let currentSegment = segmentsList.find(seg => !seg.isUsed),
        newSegmentsSets = [[]],
        savedSegmentSets = [],
        meetingPoints = [currentSegment.vertexes[0]];

      currentSegment.isUsed = true;
      newSegmentsSets[newSegmentsSets.length - 1].push(currentSegment);
      segmentUsed++;

      while (meetingPoints.length > 0) {
        // while not closed
        const newPotentialSegments = segmentsList.filter(
          seg => !seg.isUsed && seg.contains(currentSegment.vertexes[1], false),
        );
        if (newPotentialSegments.length == 0) {
          console.log('shape cannot be closed (dead end)');
          return null;
        } else if (newPotentialSegments.length > 1) {
          newSegmentsSets.push([]);
          meetingPoints.push(currentSegment.vertexes[1]);
        }
        nextSegment = newPotentialSegments[0].copy(false);
        newPotentialSegments[0].isUsed = true;
        if (nextSegment.vertexes[1].equal(currentSegment.vertexes[1])) nextSegment.reverse(true);

        newSegmentsSets[newSegmentsSets.length - 1].push(nextSegment);
        currentSegment = nextSegment;

        let meetingPointIndex = meetingPoints.findIndex(mtPt =>
          currentSegment.vertexes[1].equal(mtPt),
        );
        if (meetingPointIndex != -1) {
          savedSegmentSets.push(newSegmentsSets.splice(meetingPointIndex).flat());
          meetingPoints.splice(meetingPointIndex);
        }
        segmentUsed++;
      }
      const cleanedSegmentsSets = savedSegmentSets.map(segmentSet => {
        for (let i = 0; i < segmentSet.length; i++) {
          if (
            segmentSet[i].hasSameDirection(segmentSet[(i + 1) % segmentSet.length], 1, 0, false)
          ) {
            segmentSet[i].vertexes[1] = segmentSet[(i + 1) % segmentSet.length].vertexes[1];
            segmentSet.splice((i + 1) % segmentSet.length, 1);
          }
        }
        return segmentSet;
      });
      newSegments.push(...cleanedSegmentsSets);
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
    const shapes = app.silhouette.shapes,
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

// let shapes = [];
// (data => {
//   data.shapes.forEach(s => {
//     let shape = new Shape({ x: 0, y: 0 }, null, s.name, 'tangram');
//     shape.setSegments(s.segments);
//     shape.color = data.color ? data.color : '#000';
//     shape.second_color = getComplementaryColor(shape.color);
//     shapes.push(shape);
//   });
// })(standardTangramKit);

fetch('src/Tangram/tangramStartPos.agt').then(async response => {
  app.tangramStartPos = await response.text();
});

// window.addEventListener(
//   'workspace-changed',
//   () => {
//     app.workspace.setTranslateOffset(new Point(56.325569909594186, 62.67211299799919));
//     app.workspace.setZoomLevel(0.8677803523248963);
//   },
//   { once: true },
// );

window.addEventListener('new-window', () => {
  app.silhouette = new Silhouette();
});

window.addEventListener('create-silhouette', event => {
  TangramManager.createSilhouette(event.detail.shapes, event.detail.silhouetteMode);
});

app.CremTangrams = [];

TangramManager.retrieveTangrams();
