import { uniqId, mod } from '../Tools/general';
import { Points } from '../Tools/points';
import { Point } from './Point';
import { distanceBetweenPoints } from '../Tools/geometry';
import { Segment, Vertex, MoveTo } from '../Objects/ShapeBuildStep';
import { app } from '../App';

/**
 * Représente une forme
 */
export class Shape {
  /**
   * Constructeur
   * @param {float} x          position X
   * @param {float} y          position Y
   * @param {[ShapeBuildStep]} buildSteps étapes de construction de la forme
   *                                          (Segment, Vertex, MoveTo)
   * @param {String} name       nom de la forme
   * @param {String} familyName     nom de la famille de la forme
   */
  constructor({ x, y }, buildSteps, name, familyName) {
    this.id = uniqId();

    this.x = x;
    this.y = y;
    this.buildSteps = buildSteps;
    this.name = name;
    this.familyName = familyName;

    // [this.vertexes, this.segments] = this.getDataFromBuildSteps(buildSteps);

    this.color = '#aaa';
    this.borderColor = '#000';
    this.opacity = 0.7;
    this.isCenterShown = false;
    this.isReversed = false;

    this.second_color = '#aaa';
    this.isBiface = false;
    this.haveBeenReversed = false;
  }

  /**
   * init vertexes and segments with new method (just defined segments)
   */
  getDataFromBuildSteps(buildSteps) {
    let result = { vertexes: [], segments: [] },
      first_point_of_path = new Point(buildSteps.steps[0].dep),
      new_len;

    result.vertexes.push(first_point_of_path);

    buildSteps.step.forEach(step => {
      new_len = result.vertexes.push(new Point(step.arr));
      result.vertexes.push(
        new Segment(
          result.vertexes.find(vertex => vertex.equal(step.dep)),
          retult.vertexes[new_len],
        ),
      );
    });

    return result;
  }

  get allOutlinePoints() {
    let points = [];
    this.segments.forEach(
      segment => (points = [...points, segment.vertexes[0], ...segment.points]),
    );
    return points;
  }

  //Todo: Refactorer
  setBuildStepsFromString(buildSteps) {
    this.buildSteps = buildSteps.map((step, index) => {
      if (step.type === 'moveTo') return new MoveTo(step);
      if (step.type === 'vertex') return new Vertex(step);
      if (step.type === 'segment')
        return new Segment(
          {
            x: buildSteps[index - 1].x,
            y: buildSteps[index - 1].y,
          },
          { x: step.x, y: step.y },
          step.isArc,
        );
      console.error('No valid type');
      return null;
    });
  }

  setBuildStepsFromObject(buildSteps) {
    this.buildSteps = buildSteps.map((bsData, index) => {
      if (bsData.type === 'vertex') return new Vertex(bsData.coordinates);
      else if (bsData.type === 'moveTo') return new MoveTo(bsData.coordinates);
      else {
        let segment = new Segment(
          buildSteps[index - 1].coordinates,
          bsData.coordinates,
          bsData.isArc,
        );
        bsData.points.forEach(pt => segment.addPoint(pt));
        return segment;
      }
    });
  }
  /******/

  /**
   * Renvoie true si la forme est un cercle, c'est-à-dire si buildSteps
   * commence par un moveTo puis est uniquement composé de segments de
   * type arc.
   * @return {Boolean} true si cercle, false sinon.
   */
  isCircle() {
    return this.buildSteps.every((bs, index) => {
      if (index == 0) return bs.type == 'moveTo';
      return bs.type == 'segment' && bs.isArc;
    });
  }

  /**
   * say if the shape is a Segment
   */
  isSegment() {
    return this.buildSteps.filter(buildstep => buildstep.type === 'segment').length === 1;
  }

  //FIX:  redondance avec InteractionAPI.selectSegment()
  isPointOnSegment(point) {
    if (!this.isSegment()) return false;

    const segment = this.buildSteps.filter(buildstep => buildstep.type === 'segment')[0];

    let projection = segment.projectionPointOnSegment(point);

    if (!segment.isPointOnSegment(projection)) return false;

    let dist = distanceBetweenPoints(point, projection);

    if (dist <= app.settings.get('selectionDistance')) return true;
    return false;
  }

  /**
   * Renvoie l'index du buildStep suivant, en passant les moveTo.
   * @param  {int} bsIndex l'index d'une buildStep.
   * @return {int}
   */
  getNextBuildstepIndex(bsIndex) {
    if (bsIndex < 0 || bsIndex >= this.buildSteps.length || !Number.isFinite(bsIndex)) {
      console.error('Bad bsIndex value');
      return null;
    }

    if (bsIndex + 1 == this.buildSteps.length) {
      return 1; //skip 0 (moveTo)
    }

    if (this.buildSteps[bsIndex + 1].type == 'moveTo') {
      /*
            Cela signifie que la forme est en fait composée de 2 formes...
             */
      console.error('Cas non prévu!');
      return null;
    }

    return bsIndex + 1;
  }

  contains(object) {
    if (object instanceof Point) {
      if (this.allOutlinePoints.some(outline_point => outline_point.equal(object))) return true;
      if (this.isCenterShown && this.center.equal(object)) return true;
      return false;
    } else if (object instanceof Segment) {
      if (this.segments.some(segment => segment.equal(object))) return true;
      return false;
    } else {
      console.log('unsupported object');
      return false;
    }
  }

  /**
   * Renvoie l'index du buildStep précédent, en passant les moveTo.
   * @param  {int} bsIndex l'index d'une buildStep.
   * @return {int}
   */
  getPrevBuildstepIndex(bsIndex) {
    if (bsIndex < 0 || bsIndex >= this.buildSteps.length || !Number.isFinite(bsIndex)) {
      console.error('Bad bsIndex value');
      return null;
    }

    if (bsIndex <= 1) {
      return this.buildSteps.length - 1; //skip 0 (moveTo)
    }

    if (this.buildSteps[bsIndex - 1].type == 'moveTo') {
      /*
            Cela signifie que la forme est en fait composée de 2 formes...
             */
      console.error('Cas non prévu!');
      return null;
    }

    return bsIndex - 1;
  }

  /**
   * Renvoie l'index du vertex suivant. Renvoie -1 si il n'y a pas de vertex
   * suivant (ex: si cercle).
   * @param  {int} bsIndex l'index d'une buildStep.
   * @return {int}
   */
  getNextVertexIndex(bsIndex) {
    if (bsIndex < 0 || bsIndex >= this.buildSteps.length || !Number.isFinite(bsIndex)) {
      console.error('Bad bsIndex value');
      return null;
    }

    let nextVertexIndex = -1,
      index = bsIndex + 1;

    while (index != bsIndex) {
      if (index == this.buildSteps.length) {
        index = 1; //skip 0 (moveTo)
        continue;
      }
      if (this.buildSteps[index].type == 'moveTo') {
        /*
                Cela signifie que la forme est en fait composée de 2 formes...
                 */
        console.error('Cas non prévu!');
        return null;
      }
      if (this.buildSteps[index].type == 'vertex') {
        nextVertexIndex = index;
        break;
      }
      index++;
    }
    return nextVertexIndex;
  }

  /**
   * Renvoie l'index du vertex précédent. Renvoie null si il n'y a pas de vertex
   * précédent (ex: si cercle).
   * @param  {int} bsIndex l'index d'une buildStep.
   * @return {int}
   */
  getPrevVertexIndex(bsIndex) {
    if (bsIndex < 0 || bsIndex >= this.buildSteps.length || !Number.isFinite(bsIndex)) {
      console.error('Bad bsIndex value');
      return null;
    }

    let prevVertexIndex = null,
      index = bsIndex - 1;

    while (index != bsIndex) {
      if (index <= 0) {
        index = this.buildSteps.length - 1; //skip 0 (moveTo)
        continue;
      }
      if (this.buildSteps[index].type == 'moveTo') {
        /*
                Cela signifie que la forme est en fait composée de 2 formes...
                 */
        console.error('Cas non prévu!');
        return null;
      }
      if (this.buildSteps[index].type == 'vertex') {
        prevVertexIndex = index;
        break;
      }
      index--;
    }
    return prevVertexIndex;
  }

  /**
   * Renvoie l'index du premier et du dernier segment constituant un arc de
   * cercle.
   * @param  {int} buildStepIndex L'index d'un des segments de l'arc
   * @return {[int, int]}
   */
  getArcEnds(buildStepIndex) {
    if (
      buildStepIndex < 0 ||
      buildStepIndex >= this.buildSteps.length ||
      !Number.isFinite(buildStepIndex)
    ) {
      console.error('Bad bsIndex value');
      return null;
    }
    if (this.buildSteps[buildStepIndex].isArc !== true) {
      console.error('Bad bsIndex value');
      return null;
    }

    let segmentsIds = this.getArcSegmentIndexes(buildStepIndex);
    return [segmentsIds[0], segmentsIds[segmentsIds.length - 1]];
  }

  /**
   * Renvoie la liste des index des segments constituant un arc de cercle.
   * @param  {int} buildStepIndex L'index d'un des segments de l'arc
   * @return {[int]}
   */
  getArcSegmentIndexes(buildStepIndex) {
    if (
      buildStepIndex < 0 ||
      buildStepIndex >= this.buildSteps.length ||
      !Number.isFinite(buildStepIndex)
    ) {
      console.error('Bad bsIndex value');
      return null;
    }
    if (this.buildSteps[buildStepIndex].isArc !== true) {
      console.error('Bad bsIndex value');
      return null;
    }

    let bs = this.buildSteps;
    if (this.isCircle()) {
      let rep = [];
      for (let i = 1; i < bs.length; i++) rep.push(i);
      return rep;
    }

    let indexList = [buildStepIndex];

    for (let i = 0, curIndex = buildStepIndex; i < bs.length - 1; i++) {
      curIndex = mod(curIndex - 1, bs.length);

      if (curIndex == 0 && bs[curIndex].type == 'moveTo') continue;

      if (bs[curIndex].type != 'segment' || !bs[curIndex].isArc) break;

      indexList.unshift(curIndex);
    }

    for (let i = 0, curIndex = buildStepIndex; i < bs.length - 1; i++) {
      curIndex = (curIndex + 1) % bs.length;

      if (curIndex == 0 && bs[curIndex].type == 'moveTo') continue;

      if (bs[curIndex].type != 'segment' || !bs[curIndex].isArc) break;

      indexList.push(curIndex);
    }

    return indexList;
  }

  /**
   * Renvoie true si les 2 points forment un segment ou un morceau de segment
   * @param  {Object}  point1
   * @param  {Object}  point2
   * @return {Boolean}
   */
  isSegmentPart(point1, point2) {
    if (
      point1.shape.id != this.id ||
      point2.shape.id != this.id ||
      point1.pointType == 'center' ||
      point2.pointType == 'center'
    ) {
      console.error('bad point value');
      return null;
    }
    if (point1.pointType == 'vertex' && point2.pointType == 'vertex') {
      //2 vertex. forment un segment entier ?
      return this.contains(new Segment(point1.index, point2.index));
    }
    if (point1.pointType != 'vertex' && point2.pointType != 'vertex') {
      //2 segmentPoints. sur le même segment ?
      return point1.index == point2.index;
    }
    if (point2.pointType == 'vertex') {
      [point2, point1] = [point1, point2];
    }

    //ici: point1: vertex; point2: segmentPoint.
    if (point1.index < point2.index) {
      let nextBsIndex = this.getNextBuildstepIndex(point1.index);
      return (
        nextBsIndex == point2.index && nextBsIndex.type == 'segment' && nextBsIndex.isArc !== true
      );
    } else {
      let prevBsIndex = this.getPrevBuildstepIndex(point1.index);
      return (
        prevBsIndex == point2.index && prevBsIndex.type == 'segment' && prevBsIndex.isArc !== true
      );
    }
  }

  // /**
  //  * Renvoie true si bsIndex1 et bsIndex2 sont les index de 2 sommets (vertex)
  //  * entre lesquels il y a un segment qui n'est pas un arc de cercle!
  //  * @param  {int}  bsIndex1
  //  * @param  {int}  bsIndex2
  //  * @return {Boolean}
  //  */
  // isSegment(bsIndex1, bsIndex2) {
  //   let bs = this.buildSteps;
  //   if (bs[bsIndex1].type != 'vertex' || bs[bsIndex2].type != 'vertex') {
  //     console.error('bad bsIndex');
  //     return null;
  //   }

  //   if (bsIndex1 > bsIndex2) {
  //     [bsIndex1, bsIndex2] = [bsIndex2, bsIndex1];
  //   }

  //   if (
  //     bsIndex1 + 2 == bsIndex2 &&
  //     bs[bsIndex1 + 1].type == 'segment' &&
  //     bs[bsIndex1 + 1].isArc !== true
  //   )
  //     return true;
  //   if (
  //     bsIndex1 == 1 &&
  //     bsIndex2 == bs.length - 2 &&
  //     bs[bsIndex2 + 1].type == 'segment' &&
  //     bs[bsIndex2 + 1].isArc !== true
  //   )
  //     return true;
  //   return false;
  // }

  /**
   * Renvoie la longueur d'un arc de cercle
   * @param  {int} buildStepIndex l'index (dans buildSteps) d'un des segments
   * de l'arc de cercle
   * @return {float}                La longueur de l'arc
   */
  getArcLength(buildStepIndex) {
    if (
      buildStepIndex < 0 ||
      buildStepIndex >= this.buildSteps.length ||
      !Number.isFinite(buildStepIndex)
    ) {
      console.error('Bad bsIndex value');
      return null;
    }
    if (this.buildSteps[buildStepIndex].isArc !== true) {
      console.error('Bad bsIndex value');
      return null;
    }

    let arcsList = this.getArcSegmentIndexes(buildStepIndex),
      length = 0,
      bs = this.buildSteps;
    arcsList.forEach(arcIndex => {
      if (arcIndex == 0) return;
      length += Points.dist(bs[arcIndex].coordinates, bs[arcIndex - 1].coordinates);
    });

    return length;
  }

  /**
   * Récupère les coordonnées de la forme
   * @return {{x: float, y: float}} les coordonnées ({x: float, y: float})
   */
  getCoordinates() {
    return { x: this.x, y: this.y };
  }

  /**
   * Vérifie si un point se trouve sur un bord de la forme.
   * @param  {Point}  point Le point (coordonnées absolues)
   * @return {Boolean}       true si le point se trouve sur le bord.
   */
  isPointInBorder(point) {
    const relativeCoordinates = {
      x: point.x - this.x,
      y: point.y - this.y,
    };
    return this.buildSteps.some(bs => {
      if (bs.type === 'vertex') return Points.equal(bs.coordinates, relativeCoordinates);
      if (bs.type === 'segment') {
        const projection = bs.projectionPointOnSegment(relativeCoordinates),
          projDist = Points.dist(projection, relativeCoordinates);
        return projDist < 1 && bs.isPointOnSegment(projection);
      }
      return false;
    });
  }

  /**
   * Vérifie si cette forme se superpose avec une autre forme.
   * @param  {Shape} shape L'autre forme
   * @return {overlap}     true: si les 2 formes se superposent
   */
  overlapsWith(shape) {
    let is_potential_dig = false,
      s1 = this,
      s2 = shape,
      s1_segments = s1.getSegments(),
      s2_segments = s2.getSegments();

    // s1 in s2 ? if a point of s1 is in s2
    let vertexes_to_check = [],
      middles_to_check = [];
    for (let segment of s1_segments) {
      if (s2_segments.some(seg => seg.equal(segment))) continue;
      vertexes_to_check = [
        ...vertexes_to_check,
        ...s2_segments.map(seg => segment.getNonCommonPointIfJoined(seg)).filter(pt => pt),
      ];
      middles_to_check = [
        ...middles_to_check,
        ...s2_segments.map(seg => segment.getMiddleIfJoined(seg)).filter(pt => pt),
      ];
    }
    if (vertexes_to_check.some(pt => app.drawAPI.isPointInShape(pt, s2))) is_potential_dig = true;
    if (
      vertexes_to_check.some(
        (pt, idx) =>
          app.drawAPI.isPointInShape(pt, s2) &&
          app.drawAPI.isPointInShape(middles_to_check[idx], s2),
      )
    )
      return true;

    // s2 in s1 ? if a point of s2 is in s1
    (vertexes_to_check = []), (middles_to_check = []);
    for (let segment of s2_segments) {
      if (s1_segments.some(seg => seg.equal(segment))) continue;
      vertexes_to_check = [
        ...vertexes_to_check,
        ...s1_segments.map(seg => segment.getNonCommonPointIfJoined(seg)).filter(pt => pt),
      ];
      middles_to_check = [
        ...middles_to_check,
        ...s1_segments.map(seg => segment.getMiddleIfJoined(seg)).filter(pt => pt),
      ];
    }
    if (vertexes_to_check.some(pt => app.drawAPI.isPointInShape(pt, s1))) is_potential_dig = true;
    if (
      vertexes_to_check.some(
        (pt, idx) =>
          app.drawAPI.isPointInShape(pt, s1) &&
          app.drawAPI.isPointInShape(middles_to_check[idx], s1),
      )
    )
      return true;

    // verifier si segments croisés !
    if (
      !s1_segments.every(seg => {
        if (
          s2_segments
            .filter(segment => !seg.equal(segment) && !segment.getNonCommonPointIfJoined(seg))
            .some(segment => segment.doesIntersect(seg))
        ) {
          console.log('intersection');
          return false;
        }
        return true;
      })
    )
      return true;

    // verifier si creuse
    if (is_potential_dig) {
      console.log('peut-etre creuse...');
      // return true;
    }
    return false;
  }

  /**
   * défini les coordonnées de la forme
   * @param {{x: float, y: float}} coordinates les coordonnées
   */
  setCoordinates(coordinates) {
    const translation = Points.sub(coordinates, { x: this.x, y: this.y });
    this.x = coordinates.x;
    this.y = coordinates.y;
    this.buildSteps.forEach(bs => bs.translate(translation));
  }

  /**
   * Renvoie une copie d'une forme
   * @return {Shape} la copie
   */
  //Todo : Simplifier la copie
  copy() {
    let buildStepsCopy = this.buildSteps.map(bs => bs.copy());
    let copy = new Shape(this, buildStepsCopy, this.name, this.familyName);
    copy.color = this.color;
    copy.second_color = this.second_color;
    copy.isBiface = this.isBiface;
    copy.borderColor = this.borderColor;
    copy.isCenterShown = this.isCenterShown;
    copy.isReversed = this.isReversed;
    copy.opacity = this.opacity;
    return copy;
  }

  get center() {
    let total = {
      sumX: 0,
      sumY: 0,
      amount: 0,
    };
    this.buildSteps.forEach(bs => {
      //TODO: vérifier si cela fonctionne pour des formes contenant un arc de cercle.
      if (bs.type == 'vertex' || (bs.type == 'segment' && bs.isArc)) {
        total.sumX += bs.coordinates.x;
        total.sumY += bs.coordinates.y;
        total.amount++;
      }
    });

    return {
      x: total.sumX / total.amount,
      y: total.sumY / total.amount,
    };
  }

  /**
   * Renvoie un objet Path2D permettant de dessiner la forme.
   * @return {Path2D} le path de dessin de la forme
   */
  get path() {
    const path = new Path2D();
    this.buildSteps.forEach(buildStep => {
      if (buildStep.type === 'moveTo')
        path.moveTo(buildStep.coordinates.x, buildStep.coordinates.y);
      else if (buildStep.type === 'segment')
        path.lineTo(buildStep.vertexes[1].x, buildStep.vertexes[1].y);
    });
    path.closePath();
    return path;
  }

  /**
   * convertit point en balise circle de svg
   */
  point_to_svg(coordinates, color = '#000', size = 1) {
    let point = new Point(coordinates.x, coordinates.y);
    point.multiplyWithScalar(app.workspace.zoomLevel);
    point.translate(app.workspace.translateOffset.x, app.workspace.translateOffset.y);
    return (
      '<circle cx="' +
      point.x +
      '" cy="' +
      point.y +
      '" r="' +
      size * 2 * app.workspace.zoomLevel +
      '" fill="' +
      color +
      '" />\n'
    );
  }

  /**
   * convertit shape en balise path de svg
   */
  to_svg() {
    let path = '';
    this.buildSteps.forEach(buildStep => {
      let point = new Point(buildStep.coordinates.x, buildStep.coordinates.y);
      point.multiplyWithScalar(app.workspace.zoomLevel);
      point.translate(app.workspace.translateOffset.x, app.workspace.translateOffset.y);
      if (buildStep.type == 'moveTo') path += 'M ' + point.x + ' ' + point.y + ' ';
      else if (buildStep.type == 'segment') path += 'L ' + point.x + ' ' + point.y + ' ';
    });
    path += 'Z ';
    let attributes = {
      d: path,
      stroke: this.borderColor,
      fill: this.isBiface && this.isReversed ? this.second_color : this.color,
      'fill-opacity': this.opacity,
      'stroke-width': 1, // toujours a 1 ?
      'stroke-opacity': this.opacity,
    };

    let path_tag = '<path';
    for (let [key, value] of Object.entries(attributes)) {
      path_tag += ' ' + key + '="' + value + '"';
    }
    path_tag += '/>\n';

    let point_tags = '';
    if (app.settings.get('areShapesPointed')) {
      this.buildSteps
        .filter(bs => bs.type === 'vertex')
        .forEach(bs => (point_tags += this.point_to_svg(bs.coordinates, '#000', 1)));
    }
    this.buildSteps
      .filter(bs => bs.type === 'segment')
      .forEach(bs => {
        //Points sur les segments
        bs.points.forEach(pt => {
          point_tags += this.point_to_svg(pt, '#000', 1);
        });
      });
    if (this.isCenterShown) point_tags += this.point_to_svg(this.center, '#000', 1);
    return path_tag + point_tags;
  }

  saveToObject() {
    let save = {
      id: this.id,
      coordinates: this.getCoordinates(),
      name: this.name,
      familyName: this.familyName,
      color: this.color,
      second_color: this.second_color,
      isBiface: this.isBiface,
      borderColor: this.borderColor,
      isCenterShown: this.isCenterShown,
      isReversed: this.isReversed,
      opacity: this.opacity,
      buildSteps: this.buildSteps.map(bs => bs.saveToObject()),
    };
    return save;
  }

  initFromObject(save) {
    this.setBuildStepsFromObject(save.buildSteps);
    this.id = save.id;
    this.x = save.coordinates.x;
    this.y = save.coordinates.y;
    this.name = save.name;
    this.familyName = save.familyName;
    this.color = save.color;
    this.second_color = save.second_color;
    this.isBiface = save.isBiface;
    this.borderColor = save.borderColor;
    this.isCenterShown = save.isCenterShown;
    this.isReversed = save.isReversed;
    this.opacity = save.opacity;
  }

  setScale(size) {
    this.buildSteps.forEach(bs => bs.setScale(size));
  }

  get segments() {
    return this.buildSteps.filter(bs => bs.type === 'segment');
  }

  rotate(angle, center) {
    this.buildSteps.forEach(bs => bs.rotate(angle, center));
  }
}
