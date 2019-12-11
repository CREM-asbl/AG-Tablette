import { uniqId, mod } from '../Tools/general';
import { Point } from './Point';
import { Segment } from './Segment';
import { app } from '../App';

/**
 * Représente une forme
 */
export class Shape {
  /**
   * Constructeur
   * @param {float} x          position X
   * @param {float} y          position Y
   * @param {[Segment]} segments étapes de construction de la forme
   *                                          (Segment, Vertex, MoveTo)
   * @param {String} name       nom de la forme
   * @param {String} familyName     nom de la famille de la forme
   */
  constructor({ x, y }, segments, name, familyName) {
    this.id = uniqId();

    this.x = x;
    this.y = y;
    this.coordinates = new Point(x, y);
    this.segments = segments;
    this.name = name;
    this.familyName = familyName;

    this.color = '#aaa';
    this.borderColor = '#000';
    this.opacity = 0.7;
    this.isCenterShown = false;
    this.isReversed = false;

    this.second_color = '#aaa';
    this.isBiface = false;
    this.haveBeenReversed = false;
  }

  get allOutlinePoints() {
    let points = [];
    if (this.isSegment()) points.push(segments[0].vertexes[0]);
    this.segments.forEach(segment => points.push(segment.vertexes[1], ...segment.points));
    return points;
  }

  get vertexes() {
    if (this.isSegment()) return this.segments[0].vertexes;
    else return this.segments.map(seg => seg.vertexes[1]);
  }

  get segmentPoints() {
    return this.segments.map(seg => seg.points).flat();
  }

  /**
   * Renvoie true si la forme est un cercle, c'est-à-dire si buildSteps
   * commence par un moveTo puis est uniquement composé de segments de
   * type arc.
   * @return {Boolean} true si cercle, false sinon.
   */
  isCircle() {
    return this.segments.every(seg => {
      return seg.isArc;
    });
  }

  /**
   * say if the shape is a Segment
   */
  isSegment() {
    return this.segments.length === 1 && this.segments[0].isArc == false;
  }

  //FIX:  redondance avec InteractionAPI.selectSegment()
  isPointOnSegment(point) {
    if (!this.isSegment()) return false;

    const segment = this.segments[0];

    let projection = segment.projectionPointOnSegment(point);

    if (!segment.isPointOnSegment(projection)) return false;

    let dist = point.dist(projection);

    if (dist <= app.settings.get('selectionDistance')) return true;
    return false;
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

  // /**
  //  * Renvoie true si les 2 points forment un segment ou un morceau de segment
  //  * @param  {Object}  point1
  //  * @param  {Object}  point2
  //  * @return {Boolean}
  //  */
  // isSegmentPart(point1, point2) {
  //   if (
  //     point1.shape.id != this.id ||
  //     point2.shape.id != this.id ||
  //     point1.pointType == 'center' ||
  //     point2.pointType == 'center'
  //   ) {
  //     console.error('bad point value');
  //     return null;
  //   }
  //   const tmp_seg = new Segment(point1.coordinates, point2.coordinates);
  //   return this.segments.subSegments.some(subSeg => !subSeg.isArc && subSeg.equal(tmp_seg));
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
      length += bs[arcIndex].coordinates.dist(bs[arcIndex - 1].coordinates);
    });

    return length;
  }

  /**
   * Récupère les coordonnées de la forme
   * @return {{x: float, y: float}} les coordonnées ({x: float, y: float})
   */
  getCoordinates() {
    return new Point(this.x, this.y);
    // return this.coordinates; => to set at the end
  }

  /**
   * Vérifie si un point se trouve sur un bord de la forme.
   * @param  {Point}  point Le point (coordonnées absolues)
   * @return {Boolean}       true si le point se trouve sur le bord.
   */
  isPointInBorder(point) {
    return this.segments.some(seg => seg.isPointOnSegment(point));
  }

  getCommonsPoints(shape) {
    const commonsPoints = [];
    this.allOutlinePoints.forEach(point1 => {
      shape.allOutlinePoints.forEach(point2 => {
        if (point1.equal(point2)) commonsPoints.push(new Point(point1));
      });
    });
    return commonsPoints;
  }

  overlapCheckIfShapeIsInsideAnother(shape, s1_segments, s2_segments, is_potential_dig) {
    let vertexes_to_check = [],
      middles_to_check = [];
    for (let s1_segment of s1_segments) {
      if (
        s2_segments.some(
          s2_segment =>
            s2_segment.subSegments.some(subSeg => subSeg.equal(s1_segment)) ||
            s1_segment.subSegments.some(subSeg => subSeg.equal(s2_segment)),
        )
      )
        continue;
      vertexes_to_check = [
        ...vertexes_to_check,
        ...s2_segments.map(seg => s1_segment.getNonCommonPointIfJoined(seg)).filter(pt => pt),
      ];
      middles_to_check = [
        ...middles_to_check,
        ...s2_segments.map(seg => s1_segment.getMiddleIfJoined(seg)).filter(pt => pt),
      ];
    }

    if (vertexes_to_check.some(pt => app.drawAPI.isPointInShape(pt, shape)))
      is_potential_dig[0] = true;
    if (
      vertexes_to_check.some(
        (pt, idx) =>
          app.drawAPI.isPointInShape(pt, shape) &&
          app.drawAPI.isPointInShape(middles_to_check[idx], shape) &&
          !shape.isPointInBorder(middles_to_check[idx]),
      )
    ) {
      console.log('shape inside another');
      return true;
    }
    return false;
  }

  overlapCheckIntersectSegments(s1_segments, s2_segments) {
    if (
      !s1_segments.every(s1_segment => {
        if (
          !s2_segments.some(
            s2_segment =>
              s2_segment.subSegments.some(subSeg => subSeg.equal(s1_segment)) ||
              s1_segment.subSegments.some(subSeg => subSeg.equal(s2_segment)),
          ) &&
          s2_segments
            .filter(
              s2_segment =>
                !s1_segment.equal(s2_segment) && !s1_segment.getNonCommonPointIfJoined(s2_segment),
            )
            .some(s2_segment => s1_segment.doesIntersect(s2_segment, false, true))
        ) {
          console.log('intersection');
          return false;
        }
        return true;
      })
    )
      return true;
  }

  /**
   * Vérifie si cette forme se superpose avec une autre forme.
   * @param  {Shape} shape L'autre forme
   * @return {overlap}     true: si les 2 formes se superposent
   *    considéré vrai si deux segments sont confondu mais n'ont qu'un point commun ! => peut-etre probleme dans environnement libre
   */
  overlapsWith(shape) {
    let is_potential_dig = false,
      s1 = this,
      s2 = shape,
      s1_segments = s1.segments,
      s2_segments = s2.segments;

    // s1 in s2 ? if a point of s1 is in s2
    if (this.overlapCheckIfShapeIsInsideAnother(s2, s1_segments, s2_segments, [is_potential_dig]))
      return true;
    // s2 in s1 ? if a point of s2 is in s1
    if (this.overlapCheckIfShapeIsInsideAnother(s1, s2_segments, s1_segments, [is_potential_dig]))
      return true;

    // check if intersect segments
    if (this.overlapCheckIntersectSegments(s1_segments, s2_segments)) return true;

    // check if dig
    if (is_potential_dig) {
      console.log('peut-etre creuse...');
      // return true;
    }
    return false;
  }

  /**
   * définit les coordonnées de la forme
   * @param {{x: float, y: float}} coordinates les coordonnées
   */
  setCoordinates(coordinates) {
    const translation = new Point(coordinates).subCoordinates(this.coordinates);
    this.coordinates.setCoordinates({ x: coordinates.x, y: coordinates.y });
    this.x = this.coordinates.x;
    this.y = this.coordinates.y;
    this.segments.forEach(seg => seg.translate(translation));
  }

  /**
   * Renvoie une copie d'une forme
   * @return {Shape} la copie
   */
  //Todo : Simplifier la copie
  copy() {
    let segments = this.segments.map(seg => seg.copy());
    let copy = new Shape(this, segments, this.name, this.familyName);
    segments.forEach(seg => (seg.shape = copy));
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
    // change for circle
    let total = {
      sumX: 0,
      sumY: 0,
      amount: 0,
    };
    this.vertexes.forEach(vertex => {
      total.sumX += vertex.x;
      total.sumY += vertex.y;
      total.amount++;
    });

    return new Point(
      total.sumX / total.amount,
      total.sumY / total.amount,
      'center',
      undefined,
      this,
    );
  }

  /**
   * Renvoie un objet Path2D permettant de dessiner la forme.
   * @return {Path2D} le path de dessin de la forme
   */
  get path() {
    const path = new Path2D();
    path.moveTo(this.segments[0].vertexes[0].x, this.segments[0].vertexes[0].y);
    this.segments.forEach(seg => path.lineTo(seg.vertexes[1].x, seg.vertexes[1].y));
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
    let point = new Point(this.segments[0].vertexes[0]);
    point.multiplyWithScalar(app.workspace.zoomLevel);
    point.translate(app.workspace.translateOffset.x, app.workspace.translateOffset.y);
    path += 'M ' + point.x + ' ' + point.y + ' ';
    this.segments.forEach(seg => {
      let point = new Point(seg.vertexes[1].x, seg.vertexes[1].y);
      point.multiplyWithScalar(app.workspace.zoomLevel);
      point.translate(app.workspace.translateOffset.x, app.workspace.translateOffset.y);
      path += 'L ' + point.x + ' ' + point.y + ' ';
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
      if (this.isSegment())
        point_tags += this.point_to_svg(this.segments[0].vertexes[0], '#000', 1);
      this.segments.forEach(seg => (point_tags += this.point_to_svg(seg.vertexes[1], '#000', 1)));
    }
    this.segments.forEach(seg => {
      //Points sur les segments
      seg.points.forEach(pt => {
        point_tags += this.point_to_svg(pt, '#000', 1);
      });
    });
    if (this.isCenterShown) point_tags += this.point_to_svg(this.center, '#000', 1);
    return path_tag + point_tags;
  }

  setSegments(segments) {
    this.segments = [];
    segments.map((seg, idx) => {
      let newSeg = new Segment(0, 0, this, idx);
      newSeg.initFromObject(seg);
      this.segments.push(newSeg);
    });
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
      segments: this.segments.map(seg => seg.saveToObject()),
    };
    return save;
  }

  initFromObject(save) {
    this.setSegments(save.segments);
    this.id = save.id;
    this.x = save.coordinates.x;
    this.y = save.coordinates.y;
    this.coordinates = new Point(save.coordinates);
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
    this.segments.forEach(seg => seg.setScale(size));
  }

  rotate(angle, center) {
    this.segments.forEach(seg => seg.rotate(angle, center));
  }
}
