import { app } from '../App';
import { Point } from '../Objects/Point';
import { Segment } from '../Objects/Segment';

/**
 * Renvoie la transformation qu'il faut appliquer aux formes pour que les 2
 * segments reliant les points de e1 et e2 soient superposés.
 * @param  {{'moving': Object, 'fixed': Object}} e1 1er point commun
 * @param  {{'moving': Object, 'fixed': Object}} e2 2eme point commun
 * @param  {[Shape]} shapes       Le groupe de formes que l'on déplace
 * @param  {Shape} mainShape      La forme principale
 * @return {{rotation: float, move: Point}}
 */
function computeTransformation(e1, e2, shapes, mainShape) {
  let fix1 = e1.fixed,
    fix2 = e2.fixed,
    moving1 = e1.moving,
    moving2 = e2.moving;

  let pts = {
      fix: fix2.subCoordinates(fix1),
      moving: moving2.subCoordinates(moving1),
    },
    angles = {
      fix: new Point(0, 0).getAngle(pts.fix),
      moving: new Point(0, 0).getAngle(pts.moving),
    },
    mainAngle = angles.fix - angles.moving,
    center = mainShape.center,
    moving1NewCoords = moving1.getRotated(mainAngle, center),
    translation = fix1.subCoordinates(moving1NewCoords);

  return {
    rotation: mainAngle,
    move: translation,
  };
}

/*
    Vérifie:
    - Que les 2 points moving sont de la même forme => pourquoi ?
    - Qu'aucun des 2 points moving n'est un centre
    - Que les 2 segments formés ont la même longueur
    - Que les 2 points moving sont sur le même segment et/ou aux extrémités
      d'un même segment.
    - Si les 2 points fixed ne sont ni tangram ni grille, alors ils doivent
      faire partie du même segment de la même forme.
  */
function checkCompatibility(e1, e2) {
  if (e1.moving.shape.id != e2.moving.shape.id) return false;

  if (e1.moving.type == 'center' || e2.moving.type == 'center') return false;

  let d1 = e1.fixed.dist(e2.fixed),
    d2 = e1.moving.dist(e2.moving);
  if (Math.abs(d1 - d2) > 1) return false;

  if (!e1.moving.shape.contains(new Segment(e1.moving, e2.moving))) return false;

  if (
    e1.fixed.type != 'tangram' &&
    e1.fixed.type != 'grid' &&
    e2.fixed.type != 'tangram' &&
    e2.fixed.type != 'grid'
  ) {
    if (e1.fixed.shape.id != e2.fixed.shape.id) return false;
    if (!e1.fixed.shape.contains(new Segment(e1.fixed, e2.fixed))) return false;
  }

  return true;
}

function bestPossibility(possibilities) {
  const best = possibilities.sort((poss1, poss2) => {
    const rot1 = Math.abs(poss1.rotation),
      rot2 = Math.abs(poss2.rotation);
    if (Math.abs(rot1 - rot2) < 0.001)
      // equalité d'angle
      return poss1.move.dist(new Point(0, 0)) > poss2.move.dist(new Point(0, 0)) ? 1 : -1;
    else return rot1 - rot2;
  })[0];

  // console.log(best);

  return best;
}

/**
 * Calcule la transformation (déplacement et/ou rotation) qu'il faut appliquer à
 * un groupe de formes en fonction de la grille et de l'ajustement automatique.
 * @param  {[Shape]} shapes       Le groupe de formes que l'on déplace
 * @param  {Shape} mainShape      La forme principale
 * @return {Object}
 *          {
 *              'rotation': float,  //Rotation à effectuer
 *              'move': Point       //Déplacement à effectuer (après la rotation)
 *          }
 *
 */
export function getShapeAdjustment(shapes, mainShape) {
  const maxRotateAngle = 0.25; //radians
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
  let ptList = [];
  shapes.forEach(s => {
    if (s.isCircle()) s.points && ptList.push(...s.points);
    else ptList.push(...s.allOutlinePoints);
    if (s.isCenterShown) ptList.push(s.center);
  });

  //Pour chaque point, calculer le(s) point(s) le(s) plus proche(s).
  let cPtListTangram = [],
    cPtListGrid = [],
    cPtListBorder = [],
    cPtListShape = [];
  ptList.forEach(point => {
    if (point.type != 'center' && tangram) {
      let pt = app.tangramManager.getNearTangramPoint(point);
      if (pt) {
        cPtListTangram.push({
          fixed: pt,
          moving: point,
          dist: pt.dist(point),
        });
      }
    } else if (grid) {
      let pt = app.workspace.grid.getClosestGridPoint(point);
      cPtListGrid.push({
        fixed: pt,
        moving: point,
        dist: pt.dist(point),
      });
    }
    let constr = app.interactionAPI.getEmptySelectionConstraints().points;
    constr.canSelect = true;
    constr.types = ['vertex', 'segmentPoint', 'center'];
    constr.blacklist = shapes;
    let pt = app.interactionAPI.selectPoint(point, constr, false, false);
    if (pt) {
      cPtListShape.push({
        fixed: pt,
        moving: point,
        dist: pt.dist(point),
      });
    }
  });

  cPtListBorder = cPtListShape.filter(
    pt => pt.fixed.type == 'vertex' || pt.fixed.type == 'segmentPoint',
  );

  console.log(cPtListTangram, cPtListGrid, cPtListBorder, cPtListShape);

  let possibilities = [];

  // if (tangram) {
  //   //segment: 2 points de la silhouette ?
  //   for (let i = 0; i < cPtListTangram.length; i++) {
  //     for (let j = i + 1; j < cPtListTangram.length; j++) {
  //       let e1 = cPtListTangram[i],
  //         e2 = cPtListTangram[j];
  //       if (checkCompatibility(e1, e2)) {
  //         let t = computeTransformation(e1, e2, shapes, mainShape);
  //         if (Math.abs(t.rotation) <= maxRotateAngle) {
  //           return t;
  //         }
  //       }
  //     }
  //   }

  //   if (automaticAdjustment) {
  //     //segment: 1 point de la silhouette et 1 point d'une autre forme ?
  //     for (let i = 0; i < cPtListTangram.length; i++) {
  //       for (let j = 0; j < cPtListBorder.length; j++) {
  //         let e1 = cPtListTangram[i],
  //           e2 = cPtListBorder[j];
  //         if (checkCompatibility(e1, e2)) {
  //           let t = computeTransformation(e1, e2, shapes, mainShape);
  //           if (Math.abs(t.rotation) <= maxRotateAngle) {
  //             return t;
  //           }
  //         }
  //       }
  //     }
  //   }
  // }

  if (grid) {
    //segment: 2 points de la grille ?
    for (let i = 0; i < cPtListGrid.length; i++) {
      for (let j = i + 1; j < cPtListGrid.length; j++) {
        let e1 = cPtListGrid[i],
          e2 = cPtListGrid[j];
        if (checkCompatibility(e1, e2)) {
          let t = computeTransformation(e1, e2, shapes, mainShape);
          if (Math.abs(t.rotation) <= maxRotateAngle) {
            possibilities.push(t);
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
            let t = computeTransformation(e1, e2, shapes, mainShape);
            if (Math.abs(t.rotation) <= maxRotateAngle) {
              possibilities.push(t);
            }
          }
        }
      }
    }
  }

  if (possibilities.length) {
    // console.log('2 points de la grille');
    return bestPossibility(possibilities);
  }

  if (automaticAdjustment) {
    //segment: 2 points d'autres formes ?
    for (let i = 0; i < cPtListBorder.length; i++) {
      for (let j = i + 1; j < cPtListBorder.length; j++) {
        let e1 = cPtListBorder[i],
          e2 = cPtListBorder[j];
        if (checkCompatibility(e1, e2)) {
          let t = computeTransformation(e1, e2, shapes, mainShape);
          if (Math.abs(t.rotation) <= maxRotateAngle) {
            possibilities.push(t);
          }
        }
      }
    }
  }

  if (possibilities.length) {
    // console.log("2 points d'une autre forme");
    return bestPossibility(possibilities);
  }

  // if (tangram) {
  //   //point: un seul point du tangram ?
  //   let best = null,
  //     bestDist = 1000 * 1000;
  //   for (let i = 0; i < cPtListTangram.length; i++) {
  //     let e = cPtListTangram[i];
  //     if (e.dist < bestDist) {
  //       bestDist = e.dist;
  //       best = e;
  //     }
  //   }
  //   if (best) {
  //     transformation.move = best.fixed.subCoordinates(best.moving);
  //     return transformation;
  //   }
  // }

  if (grid) {
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
      transformation.move = best.fixed.subCoordinates(best.moving);
      // console.log('1 point de la grille');
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
      transformation.move = best.fixed.subCoordinates(best.moving);
      // console.log("1 point d'une autre forme");
      return transformation;
    }
  }

  // console.log('nothing');

  //Rien n'a été trouvé, aucune transformation à faire.
  return transformation;
}
