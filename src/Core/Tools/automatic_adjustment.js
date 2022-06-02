import { getAllChildrenInGeometry } from '../../GeometryTools/general';
import { app } from '../App';
import { SelectManager } from '../Managers/SelectManager';
import { Coordinates } from '../Objects/Coordinates';
import { addInfoToId } from './general';

function reduceAngle(angle) {
  while (angle < -Math.PI) angle += 2 * Math.PI;
  while (angle >= Math.PI) angle -= 2 * Math.PI;
  return angle;
}

/**
 * Renvoie la transformation qu'il faut appliquer aux figures pour que les 2
 * segments reliant les points de e1 et e2 soient superposés.
 * @param  {{'moving': Object, 'fixed': Object}} e1 1er point commun
 * @param  {{'moving': Object, 'fixed': Object}} e2 2eme point commun
 * @param  {[Shape]} shapes       Le groupe de figures que l'on déplace
 * @param  {Shape} mainShape      La figure principale
 * @return {{rotationAngle: float, translation: Coordinates}}
 */
function computeTransformation(e1, e2, shapes, mainShape) {
  const maxRotateAngle = 0.25; //radians
  let fix1 = e1.fixed.coordinates,
    fix2 = e2.fixed.coordinates,
    moving1 = e1.moving.coordinates,
    moving2 = e2.moving.coordinates;

  let fixedCoordAngle = fix1.angleWith(fix2),
    movingCoordAngle = moving1.angleWith(moving2),
    rotationAngle = fixedCoordAngle - movingCoordAngle,
    center = mainShape.centerCoordinates,
    moving1NewCoords = moving1.rotate(rotationAngle, center),
    translation = fix1.substract(moving1NewCoords);

  rotationAngle = reduceAngle(rotationAngle);

  if (
    Math.abs(rotationAngle) > maxRotateAngle
  )
    return undefined;

  return {
    rotationAngle: rotationAngle,
    translation: translation,
  };
}

/*
    Vérifie:
    - Que les 2 points moving sont de la même figure => pourquoi ?
    - Qu'aucun des 2 points moving n'est un centre
    - Que les 2 segments formés ont la même longueur
    (- Que les 2 points moving sont sur le même segment et/ou aux extrémités
      d'un même segment.)*
    - Si les 2 points fixed ne sont pas de grille, alors ils doivent
      faire partie (du même segment)* de la même figure.
    * Les () indiquent que ce n'est pas/plus le cas
  */
function checkCompatibility(e1, e2) {
  if (e1.moving.shapeId != e2.moving.shapeId) return false;

  if (e1.moving.type == 'shapeCenter' || e2.moving.type == 'shapeCenter')
    return false;

  let d1 = e1.fixed.coordinates.dist(e2.fixed.coordinates),
    d2 = e1.moving.coordinates.dist(e2.moving.coordinates);
  if (Math.abs(d1 - d2) > 1) return false;

  // if (!e1.moving.shape.contains(new Segment(e1.moving, e2.moving))) return false;

  if (e1.fixed.type != 'grid' && e2.fixed.type != 'grid') {
    if (e1.fixed.shapeId != e2.fixed.shapeId) return false;
    // if (!e1.fixed.shape.contains(new Segment(e1.fixed, e2.fixed))) return false;
  }

  return true;
}

function bestPossibility(possibilities) {
  possibilities.filter(Boolean);
  const best = possibilities.sort((poss1, poss2) => {
    const rot1 = Math.abs(reduceAngle(poss1.rotationAngle)),
      rot2 = Math.abs(reduceAngle(poss2.rotationAngle));
    if (Math.abs(rot1 - rot2) < 0.001)
      // equalité d'angle
      return poss1.translation.dist(Coordinates.nullCoordinates) >
        poss2.translation.dist(Coordinates.nullCoordinates)
        ? 1
        : -1;
    else return rot1 - rot2;
  })[0];

  return best;
}

/**
 * Calcule la transformation (déplacement et/ou rotation) qu'il faut appliquer à
 * un groupe de figures en fonction de la grille et de l'ajustement automatique.
 * @param  {[Shape]} shapes       Le groupe de figures que l'on déplace
 * @param  {Shape} mainShape      La figure principale
 * @return {Object}
 *          {
 *              'rotationAngle': float,     // Rotation à effectuer
 *              'tranlation': Coordinates   // Déplacement à effectuer (après la rotation)
 *          }
 *
 */
export function getShapeAdjustment(shapes, mainShape) {
  let grid = app.settings.gridShown,
    // tangram = app.tangram.isSilhouetteShown,
    automaticAdjustment = app.settings.automaticAdjustment,
    transformation = {
      rotationAngle: 0,
      translation: Coordinates.nullCoordinates,
    };

  if (!grid && !automaticAdjustment) return transformation;

  // if (grid && tangram) {
  //   console.error('le Tangram et la Grille ne doivent pas être activés en même temps');
  // }

  let shapesAndAllChildren = [...shapes];
  if (app.environment.name == 'Geometrie') {
    shapes.forEach(s => getAllChildrenInGeometry(s, shapesAndAllChildren));
  }

  //Générer la liste des points du groupe de figures
  let ptList = [];
  shapes.forEach((s) => {
    ptList.push(...s.vertexes, ...s.divisionPoints);
    if (s.isCenterShown) ptList.push(s.center);
  });

  // Pour chaque point, calculer le(s) point(s) le(s) plus proche(s).
  let cPtListGrid = [],
    cPtListBorder = [],
    cPtListShape = [];
  ptList.forEach((point) => {
    if (grid) {
      let gridPoint = app.gridCanvasLayer.getClosestGridPoint(point.coordinates);
      if (gridPoint) {
        cPtListGrid.push({
          fixed: gridPoint,
          moving: point,
          dist: gridPoint.coordinates.dist(point.coordinates),
        });
      }
    }
    let constr = SelectManager.getEmptySelectionConstraints().points;
    constr.canSelect = true;
    constr.types = ['vertex', 'divisionPoint', 'shapeCenter'];
    constr.blacklist = shapesAndAllChildren.map((s) => {
      return { shapeId: addInfoToId(s.id, 'main') };
    });
    constr.numberOfObjects = 'allInDistance';
    let pts = SelectManager.selectPoint(point, constr, false);
    if (pts) {
      pts.forEach((pt) => {
        cPtListShape.push({
          fixed: pt,
          moving: point,
          dist: pt.coordinates.dist(point.coordinates),
        });
      });
    }
  });

  cPtListBorder = cPtListShape.filter(
    (pt) => pt.fixed.type == 'vertex' || pt.fixed.type == 'divisionPoint',
  );

  let possibilities = [];

  if (grid) {
    //segment: 2 points de la grille ?
    for (let i = 0; i < cPtListGrid.length; i++) {
      for (let j = i + 1; j < cPtListGrid.length; j++) {
        let e1 = cPtListGrid[i],
          e2 = cPtListGrid[j];
        if (checkCompatibility(e1, e2)) {
          let t = computeTransformation(e1, e2, shapes, mainShape);
          possibilities.push(t);
        }
      }
    }

    /*
        La grille attire les figures vers ses points. Mais si l'ajustement automatique
        n'est pas activé, la figure est uniquement translatée: il n'y a pas de légère
        rotation (d'ajustement) possible.
         */
    if (automaticAdjustment) {
      //segment: 1 point de la grille et 1 point d'une autre figure ?
      for (let i = 0; i < cPtListGrid.length; i++) {
        for (let j = 0; j < cPtListBorder.length; j++) {
          let e1 = cPtListGrid[i],
            e2 = cPtListBorder[j];
          if (checkCompatibility(e1, e2)) {
            let t = computeTransformation(e1, e2, shapes, mainShape);
            possibilities.push(t);
          }
        }
      }
    }
  }

  if (possibilities.filter(Boolean).length > 0) {
    console.info('2 points de la grille');
    return bestPossibility(possibilities);
  }

  if (automaticAdjustment) {
    //segment: 2 points d'autres figures ?
    for (let i = 0; i < cPtListBorder.length; i++) {
      for (let j = i + 1; j < cPtListBorder.length; j++) {
        let e1 = cPtListBorder[i],
          e2 = cPtListBorder[j];
        if (checkCompatibility(e1, e2)) {
          console.info('2 points');
          let t = computeTransformation(e1, e2, shapes, mainShape);
          possibilities.push(t);
        }
      }
    }
  }

  if (possibilities.filter(Boolean).length > 0) {
    console.info("2 points d'une autre figure");
    return bestPossibility(possibilities);
  }

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
      transformation.translation = best.fixed.coordinates.substract(
        best.moving.coordinates,
      );
      console.info('1 point de la grille');
      return transformation;
    }
  }

  if (automaticAdjustment) {
    //point un seul point d'une autre figure?
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
      transformation.translation = best.fixed.coordinates.substract(
        best.moving.coordinates,
      );
      console.info("1 point d'une autre figure");
      return transformation;
    }
  }

  console.info('nothing');

  //Rien n'a été trouvé, aucune transformation à faire.
  return transformation;
}
