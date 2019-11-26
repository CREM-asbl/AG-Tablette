import { app } from '../App';
import { Points } from './points';
import { getAngleOfPoint, rotatePoint } from './geometry';

/**
 * Renvoie la transformation qu'il faut appliquer aux formes pour que les 2
 * segments reliant les points de e1 et e2 soient superposés.
 * @param  {{'moving': Object, 'fixed': Object}} e1 1er point commun
 * @param  {{'moving': Object, 'fixed': Object}} e2 2eme point commun
 * @param  {[Shape]} shapes       Le groupe de formes que l'on déplace
 * @param  {Shape} mainShape      La forme principale
 * @param  {Point} coordinates    Les coordonnées de la forme principale
 * @return {{rotation: float, move: Point}}
 */
function computeTransformation(e1, e2, shapes, mainShape, coordinates) {
  let fix1 = e1.fixed,
    fix2 = e2.fixed,
    moving1 = e1.moving,
    moving2 = e2.moving;

  let pts = {
      fix: Points.sub(fix2.coordinates, fix1.coordinates),
      moving: Points.sub(moving2.coordinates, moving1.coordinates),
    },
    angles = {
      fix: getAngleOfPoint(Points.create(0, 0), pts.fix),
      moving: getAngleOfPoint(Points.create(0, 0), pts.moving),
    },
    mainAngle = angles.fix - angles.moving,
    center = Points.sub(Points.add(mainShape.center, coordinates), {
      x: mainShape.x,
      y: mainShape.y,
    }),
    moving1NewCoords = rotatePoint(moving1.coordinates, mainAngle, center),
    translation = Points.sub(fix1.coordinates, moving1NewCoords);

  return {
    rotation: mainAngle,
    move: translation,
  };
}

/**
 * Calcule la transformation (déplacement et/ou rotation) qu'il faut appliquer à
 * un groupe de formes en fonction de la grille et de l'ajustement automatique.
 * @param  {[Shape]} shapes       Le groupe de formes que l'on déplace
 * @param  {Shape} mainShape      La forme principale
 * @param  {Point} coordinates    Les coordonnées de la forme principale
 * @param  {Boolean} [excludeSelf=true] False: peut magnétiser la forme avec
 *              elle-même (son ancienne position). Utile pour Copy()
 * @return {Object}
 *          {
 *              'rotation': float,  //Rotation à effectuer
 *              'move': Point       //Déplacement à effectuer (après la rotation)
 *          }
 *
 */
export function getShapeAdjustment(shapes, mainShape, coordinates, excludeSelf = true) {
  let maxRotateAngle = 0.25; //radians
  /**
   * Il faut considérer que les coordonnées des formes du groupe (shapes[i].x,
   * shapes[i].y) doivent d'abord subir une translation de coordinates-mainShape!
   */
  let grid = app.workspace.settings.get('isGridShown'),
    tangram = app.workspace.settings.get('isTangramShown'),
    automaticAdjustment = app.settings.get('automaticAdjustment'),
    transformation = {
      rotation: 0,
      move: { x: 0, y: 0 },
    };

  if (!grid && !automaticAdjustment && !tangram) return transformation;

  if (grid && tangram) {
    console.error('le Tangram et la Grille ne doivent pas être activés en même temps');
  }

  //Générer la liste des points du groupe de formes
  let ptList = shapes
    .map(s => {
      let list = [];
      s.buildSteps.forEach((bs, i) => {
        if (bs.type == 'vertex') {
          list.push({
            shape: s,
            relativeCoordinates: bs.coordinates,
            coordinates: Points.add(bs.coordinates, Points.sub(coordinates, mainShape)),
            pointType: 'vertex',
            index: i,
          });
        } else if (bs.type == 'segment') {
          bs.points.forEach(pt => {
            list.push({
              shape: s,
              relativeCoordinates: pt,
              coordinates: Points.add(pt, Points.sub(coordinates, mainShape)),
              pointType: 'segmentPoint',
              index: i,
            });
          });
        }
      });
      if (s.isCenterShown) {
        list.push({
          shape: s,
          relativeCoordinates: s.center,
          coordinates: Points.add(s.center, Points.sub(coordinates, mainShape)),
          pointType: 'center',
        });
      }
      return list;
    })
    .reduce((total, val) => {
      return total.concat(val);
    }, []);

  //Pour chaque point, calculer le(s) point(s) le(s) plus proche(s).
  let commonPointsList = [];
  ptList.forEach(point => {
    if (point.pointType != 'center' && tangram) {
      let pt = app.tangramManager.getNearTangramPoint(point.coordinates);
      if (pt) {
        commonPointsList.push({
          fixed: {
            pointType: 'tangram',
            coordinates: pt,
          },
          moving: point,
          dist: Points.dist(pt, point.coordinates),
        });
      }
    }
    if (grid && !tangram) {
      let pt = app.workspace.grid.getClosestGridPoint(point.coordinates);
      commonPointsList.push({
        fixed: {
          pointType: 'grid',
          coordinates: pt,
        },
        moving: point,
        dist: Points.dist(pt, point.coordinates),
      });
    }
    let constr = app.interactionAPI.getEmptySelectionConstraints()['points'];
    constr.canSelect = true;
    constr.types = ['vertex', 'segmentPoint', 'center'];
    if (excludeSelf) constr.blacklist = shapes;
    let pt = app.interactionAPI.selectPoint(point.coordinates, constr, false, false);
    if (pt) {
      commonPointsList.push({
        fixed: pt,
        moving: point,
        dist: Points.dist(pt.coordinates, point.coordinates),
      });
    }
  });

  //Trouver un segment commun ou un point commun
  let cPtListTangram = commonPointsList.filter(pt => pt.fixed.pointType == 'tangram'),
    cPtListGrid = commonPointsList.filter(pt => pt.fixed.pointType == 'grid'),
    cPtListBorder = commonPointsList.filter(pt => {
      return pt.fixed.pointType == 'vertex' || pt.fixed.pointType == 'segmentPoint';
    }),
    cPtListShape = commonPointsList.filter(pt => {
      return (
        pt.fixed.pointType == 'vertex' ||
        pt.fixed.pointType == 'segmentPoint' ||
        pt.fixed.pointType == 'center'
      );
    });
  let checkCompatibility = (e1, e2) => {
    /*
        Vérifie:
        - Que les 2 points moving sont de la même forme
        - Qu'aucun des 2 points moving n'est un centre
        - Que les 2 segments formés ont la même longueur
        - Que les 2 points moving sont sur le même segment et/ou aux extrémités
          d'un même segment.
        - Si les 2 points fixed ne sont ni tangram ni grille, alors ils doivent
          faire partie du même segment de la même forme.
         */
    if (e1.moving.shape.id != e2.moving.shape.id) return false;

    if (e1.moving.pointType == 'center' || e2.moving.pointType == 'center') return false;

    let d1 = Points.dist(e1.fixed.coordinates, e2.fixed.coordinates),
      d2 = Points.dist(e1.moving.coordinates, e2.moving.coordinates);
    if (Math.abs(d1 - d2) > 1) return false;

    if (!e1.moving.shape.isSegmentPart(e1.moving, e2.moving)) return false;

    if (
      e1.fixed.pointType != 'tangram' &&
      e1.fixed.pointType != 'grid' &&
      e2.fixed.pointType != 'tangram' &&
      e2.fixed.pointType != 'grid'
    ) {
      if (e1.fixed.shape.id != e2.fixed.shape.id) return false;
      if (!e1.fixed.shape.isSegmentPart(e1.fixed, e2.fixed)) return false;
    }

    return true;
  };

  if (tangram) {
    //segment: 2 points de la silhouette ?
    for (let i = 0; i < cPtListTangram.length; i++) {
      for (let j = i + 1; j < cPtListTangram.length; j++) {
        let e1 = cPtListTangram[i],
          e2 = cPtListTangram[j];
        if (checkCompatibility(e1, e2)) {
          let t = computeTransformation(e1, e2, shapes, mainShape, coordinates);
          if (Math.abs(t.rotation) <= maxRotateAngle) {
            return t;
          }
        }
      }
    }

    if (automaticAdjustment) {
      //segment: 1 point de la silhouette et 1 point d'une autre forme ?
      for (let i = 0; i < cPtListTangram.length; i++) {
        for (let j = 0; j < cPtListBorder.length; j++) {
          let e1 = cPtListTangram[i],
            e2 = cPtListBorder[j];
          if (checkCompatibility(e1, e2)) {
            let t = computeTransformation(e1, e2, shapes, mainShape, coordinates);
            if (Math.abs(t.rotation) <= maxRotateAngle) {
              return t;
            }
          }
        }
      }
    }
  }

  if (grid && !tangram) {
    //segment: 2 points de la grille ?
    for (let i = 0; i < cPtListGrid.length; i++) {
      for (let j = i + 1; j < cPtListGrid.length; j++) {
        let e1 = cPtListGrid[i],
          e2 = cPtListGrid[j];
        if (checkCompatibility(e1, e2)) {
          let t = computeTransformation(e1, e2, shapes, mainShape, coordinates);
          if (Math.abs(t.rotation) <= maxRotateAngle) {
            return t;
          }
        }
      }
    }

    /*
        La grille attire les formes vers ses points. Mais si l'ajustement automatique
        n'est pas activé, la forme est uniquement translatée: il n'y a pas de légère
        rotation (d'ajustement) possible.
         */
    if (automaticAdjustment) {
      //segment: 1 point de la grille et 1 point d'une autre forme ?
      for (let i = 0; i < cPtListGrid.length; i++) {
        for (let j = 0; j < cPtListBorder.length; j++) {
          let e1 = cPtListGrid[i],
            e2 = cPtListBorder[j];
          if (checkCompatibility(e1, e2)) {
            let t = computeTransformation(e1, e2, shapes, mainShape, coordinates);
            if (Math.abs(t.rotation) <= maxRotateAngle) {
              return t;
            }
          }
        }
      }
    }
  }

  if (automaticAdjustment) {
    //segment: 2 points d'autres formes?
    for (let i = 0; i < cPtListBorder.length; i++) {
      for (let j = i + 1; j < cPtListBorder.length; j++) {
        let e1 = cPtListBorder[i],
          e2 = cPtListBorder[j];
        if (checkCompatibility(e1, e2)) {
          let t = computeTransformation(e1, e2, shapes, mainShape, coordinates);
          if (Math.abs(t.rotation) <= maxRotateAngle) {
            return t;
          }
        }
      }
    }
  }

  if (tangram) {
    //point: un seul point du tangram ?
    let best = null,
      bestDist = 1000 * 1000;
    for (let i = 0; i < cPtListTangram.length; i++) {
      let e = cPtListTangram[i];
      if (e.dist < bestDist) {
        bestDist = e.dist;
        best = e;
      }
    }
    if (best) {
      transformation.move = Points.sub(best.fixed.coordinates, best.moving.coordinates);
      return transformation;
    }
  }

  if (grid && !tangram) {
    //point: un seul point de la grille?
    let best = null,
      bestDist = 1000 * 1000;
    for (let i = 0; i < cPtListGrid.length; i++) {
      let e = cPtListGrid[i];
      if (e.dist < bestDist) {
        bestDist = e.dist;
        best = e;
      }
    }
    if (best) {
      transformation.move = Points.sub(best.fixed.coordinates, best.moving.coordinates);
      return transformation;
    }
  }

  if (automaticAdjustment) {
    //point un seul point d'une autre forme?
    let best = null,
      bestDist = 1000 * 1000;
    for (let i = 0; i < cPtListShape.length; i++) {
      let e = cPtListShape[i];
      if (e.dist < bestDist) {
        bestDist = e.dist;
        best = e;
      }
    }
    if (best) {
      transformation.move = Points.sub(best.fixed.coordinates, best.moving.coordinates);
      return transformation;
    }
  }

  //Rien n'a été trouvé, aucune transformation à faire.
  return transformation;
}

/**
 * Calcule la translation à appliquer à une forme qu'on a ajouté au canvas,
 * à la position donnée.
 * @param  {Point} coordinates Coordonnées du clic lors de l'ajout de la forme
 * @return {Point}             Translation à effectuer.
 */
export function getNewShapeAdjustment(coordinates) {
  let grid = app.workspace.settings.get('isGridShown'),
    automaticAdjustment = app.settings.get('automaticAdjustment'),
    translation = { x: 0, y: 0 };

  if (!grid && !automaticAdjustment) return translation;

  if (grid) {
    /*
        Si la grille est activée, être uniquement attiré par la grille.
         */
    let gridPoint = app.workspace.grid.getClosestGridPoint(coordinates);
    return Points.sub(gridPoint, coordinates);
  } else if (automaticAdjustment) {
    let constr = app.interactionAPI.getEmptySelectionConstraints()['points'];
    constr.canSelect = true;
    constr.types = ['center', 'vertex', 'segmentPoint'];
    let point = app.interactionAPI.selectPoint(coordinates, constr);
    if (!point) return translation;
    return Points.sub(point.coordinates, coordinates);
  }
}
