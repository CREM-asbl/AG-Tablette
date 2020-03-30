import { app } from '../Core/App';
import { SelectManager } from '../Core/Managers/SelectManager';
import { Silhouette } from '../Core/Objects/Silhouette';
import { Shape } from '../Core/Objects/Shape';
import { FileManager } from '../Core/Managers/FileManager';

const serverURL = 'https://api.crem.be/';

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
    app.silhouette = silhouette;

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

  static async getTangramFromServer(filename) {
    const response = await fetch(filename, { mode: 'cors' }),
      smallFilename = filename.slice(serverURL.length);
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

    const folder = 'tangram/',
      filenames = ['withInternal.agt', 'noInternal.agt'],
      fullFilenames = filenames.map(name => serverURL + folder + name);

    let jsons = (
      await Promise.all(fullFilenames.map(async filename => this.getTangramFromServer(filename)))
    ).filter(Boolean);

    jsons.forEach(json => app.CremTangrams.push(json));
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
}

fetch('src/Tangram/tangramStartPos.agt').then(async response => {
  app.tangramStartPos = await response.text();
});

window.addEventListener('new-window', () => {
  app.silhouette = new Silhouette();
});

window.addEventListener('create-silhouette', event => {
  TangramManager.createSilhouette(event.detail.shapes, event.detail.silhouetteMode);
});

app.CremTangrams = [];

TangramManager.retrieveTangrams();
