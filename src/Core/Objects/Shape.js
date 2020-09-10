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
   * @param {float} x              position X
   * @param {float} y              position Y
   * @param {[Segment]} segments   segments de la forme (ne pas utiliser si construction à partir de path)
   * @param {String} path          path représentant la forme (ne pas utiliser si construction à partir de segments)
   * @param {String} name          nom de la forme
   * @param {String} familyName    nom de la famille de la forme
   */
  constructor({
    x = 0,
    y = 0,
    segments = null,
    path = null,
    name = 'Custom',
    familyName = 'Custom',
    color = '#aaa',
    opacity = 0.7,
    id = uniqId(),
    size = 2,
    borderColor = '#000',
    isCenterShown = false,
    isReversed = false,
    isBiface = false,
  }) {
    this.x = x;
    this.y = y;

    //Todo: condition à supprimer quand tout en path
    if (segments) this.setSegments(segments);
    else if (path) this.initSegmentsFromPath(path);
    else this.segments = [];

    this.name = name;
    this.familyName = familyName;
    this.color = color;
    this.second_color = getComplementaryColor(color);
    this.opacity = opacity;
    this.id = id;
    this.size = size;
    this.borderColor = borderColor;
    this.isCenterShown = isCenterShown;
    this.isReversed = isReversed;
    this.isBiface = isBiface;
  }

  /* #################################################################### */
  /* ############################## GET/SET ############################# */
  /* #################################################################### */

  get allOutlinePoints() {
    let points = [];
    if (this.isSegment()) points.push(this.segments[0].vertexes[0]);
    if (this.isCircle()) points.push(...this.segments[0].points);
    else
      this.segments.forEach(segment =>
        points.push(segment.vertexes[1], ...segment.points)
      );
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
        this
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
        this
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

  get allPoints() {
    let vertexes = this.segments
        .map(seg => seg.vertexes)
        .flat()
        .filter((vertex, idx, vertexes) => {
          if (vertex)
            return vertexes.findIndex(vertex2 => vertex2.equal(vertex)) == idx;
          else return false;
        }),
      segmentPoints = this.segments.map(seg => seg.points).flat();
    return [...vertexes, ...segmentPoints];
  }

  setPath(path) {
    // this.path = path;
    this.initSegmentsFromPath(path);
  }

  // /**
  //  * Renvoie un objet Path2D permettant de dessiner la forme.
  //  * @param {Number} axeAngle - l'angle de l'axe de l'axe (reverse)
  //  * @return {Path2D} le path de dessin de la forme
  //  */
  // getPath(axeAngle = undefined) {
  //   if (this.path) return new Path2D(this.path);
  //   const path = new Path2D();
  //   path.moveTo(this.segments[0].vertexes[0].x, this.segments[0].vertexes[0].y);
  //   this.segments.forEach(seg => {
  //     seg.getPath(path, axeAngle);
  //   });
  //   path.closePath();
  //   return path;
  // }

  getCommonsPoints(shape) {
    const commonsPoints = [];
    this.allOutlinePoints.forEach(point1 => {
      shape.allOutlinePoints.forEach(point2 => {
        if (point1.equal(point2)) commonsPoints.push(new Point(point1));
      });
    });
    return commonsPoints;
  }

  initSegmentsFromPath(path) {
    this.segments = [];
    const allPathElements = path
      .split(/[ \n]/)
      .filter(element => element !== '');
    let firstVertex, lastVertex, startVertex;

    while (allPathElements.length) {
      const element = allPathElements.shift();

      switch (element) {
        case 'M':
        case 'm':
          lastVertex = new Point(
            allPathElements.shift(),
            allPathElements.shift()
          );
          startVertex = lastVertex;
          break;

        case 'L':
        case 'l':
          firstVertex = lastVertex;
          lastVertex = new Point(
            allPathElements.shift(),
            allPathElements.shift()
          );
          this.segments.push(
            new Segment(firstVertex, lastVertex, this, this.segments.length)
          );
          break;

        case 'H':
        case 'h':
          firstVertex = lastVertex;
          lastVertex = new Point(allPathElements.shift(), firstVertex.y);
          this.segments.push(
            new Segment(firstVertex, lastVertex, this, this.segments.length)
          );
          break;

        case 'V':
        case 'v':
          firstVertex = lastVertex;
          lastVertex = new Point(firstVertex.x, allPathElements.shift());
          this.segments.push(
            new Segment(firstVertex, lastVertex, this, this.segments.length)
          );
          break;

        case 'A':
        case 'a':
          const rx = allPathElements.shift(),
            ry = allPathElements.shift(),
            xAxisRotation = allPathElements.shift(),
            largeArcFlag = allPathElements.shift(),
            sweepFlag = allPathElements.shift();

          const nextVertex = new Point(
            allPathElements.shift(),
            allPathElements.shift()
          );

          if (this.segments.length > 0 && nextVertex.equal(firstVertex)) {
            // if circle
            this.segments[this.segments.length - 1].vertexes[1] = nextVertex;
            lastVertex = nextVertex;
          } else {
            // if arc
            firstVertex = lastVertex;
            lastVertex = nextVertex;
            let arcCenter = this.getArcCenterFromSVG(
              firstVertex,
              lastVertex,
              rx,
              largeArcFlag,
              sweepFlag
            );

            this.segments.push(
              new Segment(
                firstVertex,
                lastVertex,
                this,
                this.segments.length,
                arcCenter,
                1 - sweepFlag
              )
            );
          }

          break;

        case 'Z':
        case 'z':
          firstVertex = lastVertex;
          lastVertex = startVertex;
          this.segments.push(
            new Segment(firstVertex, lastVertex, this, this.segments.length)
          );
          // console.log('Z');
          break;

        /* default = closePath car case Z et z ne passe pas  */
        default:
          // firstVertex = lastVertex;
          // lastVertex = startVertex;
          // this.segments.push(
          //   new Segment(firstVertex, lastVertex, this, this.segments.length)
          // );
          break;
      }
    }
  }

  getArcCenterFromSVG(
    firstVertex,
    lastVertex,
    radius,
    largeArcFlag,
    sweepFlag
  ) {
    let middle = new Point(
        (firstVertex.x + lastVertex.x) / 2,
        (firstVertex.y + lastVertex.y) / 2
      ),
      isHorizontal = Math.abs(firstVertex.y - lastVertex.y) < 0.01,
      isVertical = Math.abs(firstVertex.x - lastVertex.x) < 0.01,
      distanceMiddleArcCenter = Math.sqrt(
        Math.pow(radius, 2) -
          (Math.pow(firstVertex.x - lastVertex.x, 2) +
            Math.pow(firstVertex.y - lastVertex.y, 2)) /
            4
      );

    let theta, arcCenter;
    // theta is the angle between the segment firstvertex - lastvertex and the x-axis

    if (isHorizontal) {
      theta = firstVertex.x < lastVertex.x ? 0 : Math.PI;
    } else if (isVertical) {
      theta = firstVertex.y < lastVertex.y ? Math.PI / 2 : (Math.PI * 3) / 2;
    } else {
      theta = Math.atan2(
        lastVertex.y - firstVertex.y,
        lastVertex.x - firstVertex.x
      );
    }

    if (largeArcFlag !== sweepFlag) {
      arcCenter = middle.addCoordinates({
        x: distanceMiddleArcCenter * Math.cos(theta + Math.PI / 2),
        y: distanceMiddleArcCenter * Math.sin(theta + Math.PI / 2),
      });
    } else {
      arcCenter = middle.addCoordinates({
        x: distanceMiddleArcCenter * Math.cos(theta - Math.PI / 2),
        y: distanceMiddleArcCenter * Math.sin(theta - Math.PI / 2),
      });
    }

    return arcCenter;
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
      if (
        this.allOutlinePoints.some(outline_point => outline_point.equal(object))
      )
        return true;
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
    let pointCopy = new Point(point);
    pointCopy.setToCanvasCoordinates();
    const selected = ctx.isPointInPath(
      new Path2D(this.getSVGPath()),
      pointCopy.x,
      pointCopy.y
    );
    return selected;
  }

  isSegmentInside(segment) {
    return (
      this.isPointInPath(segment.vertexes[0]) &&
      this.isPointInPath(segment.vertexes[1]) &&
      (!(
        this.isPointInBorder(segment.vertexes[0]) &&
        this.isPointInBorder(segment.vertexes[1])
      ) ||
        (this.isPointInPath(segment.middle) &&
          !this.isPointInBorder(segment.middle)))
    );
  }

  /* #################################################################### */
  /* ############################# OVERLAP ############################## */
  /* #################################################################### */

  /**
   * check si this est complètement dans shape
   * @param {*} shape l'autre forme
   */
  isInside(shape) {
    return this.allOutlinePoints.every(pt => shape.isPointInPath(pt));
  }

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
    if (this.overlapCheckIfShapeIsInsideAnother(s2, s1_segments, s2_segments))
      return true;
    // s2 in s1 ? if a point of s2 is in s1
    if (this.overlapCheckIfShapeIsInsideAnother(s1, s2_segments, s1_segments))
      return true;

    // check if intersect segments
    if (this.overlapCheckIntersectSegments(s1_segments, s2_segments))
      return true;

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
            s1_segment.subSegments.some(subSeg => subSeg.equal(s2_segment))
        )
      )
        continue;
      vertexes_to_check = [
        ...vertexes_to_check,
        ...s2_segments
          .map(seg => s1_segment.getNonCommonPointIfJoined(seg))
          .filter(pt => pt),
      ];
      middles_to_check = [
        ...middles_to_check,
        ...s2_segments
          .map(seg => s1_segment.getMiddleIfJoined(seg))
          .filter(pt => pt),
      ];
    }

    if (
      vertexes_to_check.some(
        (pt, idx) =>
          shape.isPointInPath(pt) &&
          shape.isPointInPath(middles_to_check[idx]) &&
          !shape.isPointInBorder(middles_to_check[idx])
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
              s2_segment.subSegments.some(sub2 => sub2.equal(sub1))
            )
          ) &&
          s2_segments
            .filter(
              s2_segment =>
                !s1_segment.equal(s2_segment) &&
                !s1_segment.getNonCommonPointIfJoined(s2_segment)
            )
            .some(s2_segment =>
              s1_segment.doesIntersect(s2_segment, false, true)
            )
        ) {
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
   * @param {Point} point - point to add
   * @param {number} x - other method
   * @param {number} y - other method
   * @param {number} neg - negative translation
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
  }

  /**
   *
   * @param {Number}    scaling   scale ratio
   */
  scale(scaling) {
    this.segments.forEach(seg => seg.scale(scaling));
  }

  rotate(angle, center) {
    // this.angle = (this.angle + angle) % (2 * Math.PI);
    this.segments.forEach(seg => seg.rotate(angle, center));
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
    let data = { ...this, segments: segments };
    if (!full) data.id = null;
    let copy = new Shape(data);
    segments.forEach(seg => (seg.shape = copy));
    copy.second_color = this.second_color;
    copy.isBiface = this.isBiface;
    copy.borderColor = this.borderColor;
    copy.internalSegmentColor = this.internalSegmentColor;
    copy.isCenterShown = this.isCenterShown;
    copy.isReversed = this.isReversed;
    copy.opacity = this.opacity;
    return copy;
  }

  /**
   * convertit la shape en commande de path svg
   * @param {Number} axeAngle - l'angle de l'axe de l'axe (pour reverse)
   */
  getSVGPath(scaling = 'scale', axeAngle = undefined) {
    let path = '';
    // const point = new Point(this.segments[0].vertexes[0]);
    // if (scaling == 'scale') point.setToCanvasCoordinates();
    path = this.segments
      .map(seg => seg.getSVGPath(scaling, axeAngle))
      .join('\n');
    // path += 'Z';
    return path;
  }

  /**
   * convertit la shape en balise path de svg
   */
  toSVG() {
    let path = this.getSVGPath();

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
      if (this.isSegment())
        point_tags += this.segments[0].vertexes[0].toSVG('#000', 1);
      if (!this.isCircle())
        this.segments.forEach(
          seg => (point_tags += seg.vertexes[1].toSVG('#000', 1))
        );
    }

    this.segments.forEach(seg => {
      //Points sur les segments
      seg.points.forEach(pt => {
        point_tags += pt.toSVG('#000', 1);
      });
    });
    if (this.isCenterShown) point_tags += this.center.toSVG('#000', 1);

    let comment = '<!-- ' + this.name + ' -->\n';

    return comment + path_tag + point_tags + '\n';
  }

  setSegments(segments) {
    if (!segments) return;
    this.segments = segments.map((seg, idx) => {
      let newSeg = new Segment();
      newSeg.initFromObject(seg);
      newSeg.idx = idx;
      newSeg.shape = this;
      return newSeg;
    });
  }

  saveToObject() {
    let save = {
      ...{ ...this, segments: undefined },
      coordinates: this.coordinates.saveToObject(),
      path: this.getSVGPath(),
    };
    return save;
  }

  static fromObject(save) {
    let shape = new Shape(save);
    if (save.coordinates) {
      shape.x = save.coordinates.x;
      shape.y = save.coordinates.y;
    }
    shape.second_color = save.second_color;
    shape.isBiface = save.isBiface;
    shape.borderColor = save.borderColor;
    shape.isCenterShown = save.isCenterShown;
    shape.isReversed = save.isReversed;
    return shape;
  }

  static createFromSegments(segments, name, family) {
    let newShape = new Shape({
      x: 0,
      y: 0,
      segments: [],
      name: name,
      familyName: family,
    });
    newShape.setSegments(segments);
    newShape.color = '#000';
    newShape.second_color = getComplementaryColor(newShape.color);
    newShape.opacity = 1;
    return newShape;
  }

  static retrieveFrom(shape) {
    return app.workspae.getShapeById(shape.id);
  }
}
