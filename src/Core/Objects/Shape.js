import { app } from '../App';
import { getComplementaryColor, uniqId } from '../Tools/general';
import { Point } from './Point';
import { Segment } from './Segment';

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
    this.segments = segments;
    this.internalSegments = [];
    this.name = name;
    this.familyName = familyName;

    this.color = '#aaa';
    this.second_color = getComplementaryColor('#aaa');
    this.borderColor = '#000';
    this.internalSegmentColor = '#fff';
    this.opacity = 0.7;
    this.isCenterShown = false;
    this.isReversed = false;
    this.isBiface = false;
  }

  /* #################################################################### */
  /* ############################## GET/SET ############################# */
  /* #################################################################### */

  get allOutlinePoints() {
    let points = [];
    if (this.isSegment()) points.push(this.segments[0].vertexes[0]);
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

  get coordinates() {
    return new Point(this.x, this.y);
  }

  /**
   * définit les coordonnées de la forme
   * @param {{x: float, y: float}} coordinates les coordonnées
   */
  set coordinates(coordinates) {
    const translation = new Point(coordinates).subCoordinates(this.coordinates);
    this.x = coordinates.x;
    this.y = coordinates.y;
    this.segments.forEach(seg => seg.translate(translation));
  }

  get center() {
    if (this.isCircle()) {
      const center = this.segments[0].arcCenter;
      return new Point(center.x, center.y, 'center', undefined, this);
    } else {
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
  }

  /**
   * moyenne des vertexes et medianes, pour l'offset de cut
   */
  get fake_center() {
    if (this.isCircle()) {
      const center = this.segments[0].arcCenter;
      return new Point(center.x, center.y, 'center', undefined, this);
    } else {
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
      this.segments.forEach(seg => {
        total.sumX += seg.middle.x;
        total.sumY += seg.middle.y;
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
  }

  get bounds() {
    //minX, maxX, minY, maxY
    let result = [[], [], [], []];
    this.segments.forEach(seg => {
      seg.bounds.forEach((bound, idx) => {
        result[idx].push(bound);
      });
    });
    return result.map((value, idx) => {
      if (idx % 2) return Math.max(...value);
      else return Math.min(...value);
    });
  }

  get allSegments() {
    return [...this.segments, ...this.internalSegments];
  }

  get allPoints() {
    let vertexes = [...this.segments, ...this.internalSegments]
        .map(seg => seg.vertexes)
        .flat()
        .filter((vertex, idx, vertexes) => {
          if (vertex) return vertexes.findIndex(vertex2 => vertex2.equal(vertex)) == idx;
          else return false;
        }),
      segmentPoints = this.segments.map(seg => seg.points).flat();
    return [...vertexes, ...segmentPoints];
  }

  /**
   * Renvoie un objet Path2D permettant de dessiner la forme.
   * @param {Number} axeAngle - l'angle de l'axe de l'axe (reverse)
   * @return {Path2D} le path de dessin de la forme
   */
  getPath(axeAngle = undefined) {
    const path = new Path2D();
    path.moveTo(this.segments[0].vertexes[0].x, this.segments[0].vertexes[0].y);
    this.segments.forEach(seg => {
      seg.getPath(path, axeAngle);
    });
    path.closePath();
    return path;
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

  /* #################################################################### */
  /* ################################ IS ################################ */
  /* #################################################################### */

  /**
   * Renvoie true si la forme est un cercle, c'est-à-dire si buildSteps
   * commence par un moveTo puis est uniquement composé de segments de
   * type arc.
   * @return {Boolean} true si cercle, false sinon.
   */
  isCircle() {
    return this.segments.length == 1 && this.segments[0].arcCenter;
  }

  /**
   * say if the shape is a Segment
   */
  isSegment() {
    return this.segments.length === 1 && !this.segments[0].arcCenter;
  }

  isPointOnSegment(point) {
    if (!this.isSegment()) return false;

    const segment = this.segments[0];

    let projection = segment.projectionOnSegment(point);

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
   * Vérifie si un point se trouve sur un bord de la forme.
   * @param  {Point}  point Le point (coordonnées absolues)
   * @return {Boolean}       true si le point se trouve sur le bord.
   */
  isPointInBorder(point) {
    return this.segments.some(seg => seg.isPointOnSegment(point));
  }

  /**
   * Vérifie si un point est à l'intérieur de la forme ou non
   * @param  {Point}  point le point
   */
  isPointInPath(point) {
    const ctx = app.invisibleCtx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const selected = ctx.isPointInPath(this.getPath(), point.x, point.y);
    return selected;
  }

  /* #################################################################### */
  /* ############################# OVERLAP ############################## */
  /* #################################################################### */

  /**
   * Vérifie si cette forme se superpose avec une autre forme.
   * @param  {Shape} shape L'autre forme
   * @return {overlap}     true: si les 2 formes se superposent
   *    considéré vrai si deux segments sont confondu mais n'ont qu'un point commun ! => peut-etre probleme dans environnement libre
   */
  overlapsWith(shape) {
    let s1 = this,
      s2 = shape,
      s1_segments = s1.segments,
      s2_segments = s2.segments;

    // s1 in s2 ? if a point of s1 is in s2
    if (this.overlapCheckIfShapeIsInsideAnother(s2, s1_segments, s2_segments)) return true;
    // s2 in s1 ? if a point of s2 is in s1
    if (this.overlapCheckIfShapeIsInsideAnother(s1, s2_segments, s1_segments)) return true;

    // check if intersect segments
    if (this.overlapCheckIntersectSegments(s1_segments, s2_segments)) return true;

    return false;
  }

  overlapCheckIfShapeIsInsideAnother(shape, s1_segments, s2_segments) {
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

    if (
      vertexes_to_check.some(
        (pt, idx) =>
          shape.isPointInPath(pt) &&
          shape.isPointInPath(middles_to_check[idx]) &&
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
          !s2_segments.some(s2_segment =>
            s1_segment.subSegments.some(sub1 =>
              s2_segment.subSegments.some(sub2 => sub2.equal(sub1)),
            ),
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

  /* #################################################################### */
  /* ############################ TRANSFORM ############################# */
  /* #################################################################### */

  reverse() {
    this.segments.reverse().forEach((seg, idx) => {
      seg.idx = idx;
      seg.reverse();
    });
    // internal segments ?
  }

  /**
   * move the shape with Point or coordinates
   * @param {{x: number, y: number}} point - point to add
   * @param {number} x - other method
   * @param {number} y - other method
   * @param {number} neg - negative translation
   * @return {{x: number, y:number}} new coordinates
   */
  translate() {
    let neg,
      multiplier,
      x,
      y,
      i = 0;
    if (typeof arguments[i] == 'object') {
      x = arguments[i].x;
      y = arguments[i].y;
      neg = arguments[++i];
    } else {
      x = arguments[i];
      y = !isNaN(arguments[i + 1]) ? arguments[++i] : arguments[i];
      neg = arguments[++i];
    }
    multiplier = neg ? -1 : 1;
    const translation = new Point(x * multiplier, y * multiplier);
    this.segments.forEach(seg => seg.translate(translation));
    this.internalSegments.forEach(seg => seg.translate(translation));
    this.x += translation.x;
    this.y += translation.y;
  }

  scale(scaling) {
    this.segments.forEach(seg => seg.scale(scaling));
    this.internalSegments.forEach(seg => seg.scale(scaling));
  }

  rotate(angle, center) {
    this.segments.forEach(seg => seg.rotate(angle, center));
    this.internalSegments.forEach(seg => seg.rotate(angle, center));
  }

  /* #################################################################### */
  /* ############################## OTHER ############################### */
  /* #################################################################### */

  /**
   * Renvoie une copie d'une forme
   * @param  {Boolean} full si copie de l'id aussi
   * @return {Shape} la copie
   */
  copy(full = false) {
    let segments = this.segments.map(seg => seg.copy());
    let copy = new Shape(this, segments, this.name, this.familyName);
    segments.forEach(seg => (seg.shape = copy));
    copy.internalSegments = this.internalSegments.map(seg => seg.copy());
    copy.color = this.color;
    copy.second_color = this.second_color;
    copy.isBiface = this.isBiface;
    copy.borderColor = this.borderColor;
    copy.internalSegmentColor = this.internalSegmentColor;
    copy.isCenterShown = this.isCenterShown;
    copy.isReversed = this.isReversed;
    copy.opacity = this.opacity;
    if (full) copy.id = this.id;
    return copy;
  }

  /**
   * convertit la shape en balise path de svg
   */
  to_svg() {
    let point = new Point(this.segments[0].vertexes[0]);
    point.setToCanvasCoordinates();
    let path = 'M ' + point.x + ' ' + point.y + '\n';
    this.segments.forEach(seg => {
      path += seg.to_svg() + '\n';
    });
    path += 'Z';
    let attributes = {
      d: path,
      stroke: this.borderColor,
      fill: this.isBiface && this.isReversed ? this.second_color : this.color,
      'fill-opacity': this.opacity,
      'stroke-width': 1, // toujours à 1 ?
      'stroke-opacity': 1, // toujours à 1 ?
    };

    let path_tag = '<path';
    for (let [key, value] of Object.entries(attributes)) {
      path_tag += ' ' + key + '="' + value + '"';
    }
    path_tag += '/>\n';

    let point_tags = '';
    if (app.settings.get('areShapesPointed') && this.name != 'silhouette') {
      if (this.isSegment()) point_tags += this.segments[0].vertexes[0].to_svg('#000', 1);
      if (!this.isCircle())
        this.segments.forEach(seg => (point_tags += seg.vertexes[1].to_svg('#000', 1)));
    }
    this.internalSegments.forEach(seg => {
      let point = new Point(seg.vertexes[0]);
      point.setToCanvasCoordinates();
      let path = '<path d="M ' + point.x + ' ' + point.y + '\n';
      path += seg.to_svg() + '"\n';
      path += 'stroke="' + this.internalSegmentColor + '" />\n';
      path_tag += path;
    });
    this.segments.forEach(seg => {
      //Points sur les segments
      seg.points.forEach(pt => {
        point_tags += pt.to_svg('#000', 1);
      });
    });
    if (this.isCenterShown) point_tags += this.center.to_svg('#000', 1);
    return path_tag + point_tags;
  }

  setSegments(segments) {
    this.segments = segments.map((seg, idx) => {
      let newSeg = new Segment();
      newSeg.initFromObject(seg);
      newSeg.idx = idx;
      newSeg.shape = this;
      return newSeg;
    });
  }

  setInternalSegments(internalSegments) {
    this.internalSegments = internalSegments.map((seg, idx) => {
      let newSeg = new Segment();
      newSeg.initFromObject(seg);
      newSeg.idx = idx;
      newSeg.shape = this;
      return newSeg;
    });
  }

  saveToObject() {
    let save = {
      id: this.id,
      name: this.name,
      familyName: this.familyName,
      coordinates: this.coordinates.saveToObject(),
      color: this.color,
      second_color: this.second_color,
      isBiface: this.isBiface,
      borderColor: this.borderColor,
      internalSegmentColor: this.internalSegmentColor,
      isCenterShown: this.isCenterShown,
      isReversed: this.isReversed,
      opacity: this.opacity,
      segments: this.segments.map(seg => seg.saveToObject()),
      internalSegments: this.internalSegments.map(seg => seg.saveToObject()),
    };
    return save;
  }

  initFromObject(save) {
    this.setSegments(save.segments);
    if (save.internalSegments) this.setInternalSegments(save.internalSegments);
    if (save.internalSegmentColor) this.internalSegmentColor = save.internalSegmentColor;
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

  static retrieveFrom(shape) {
    return app.workspae.getShapeById(shape.id);
  }
}
