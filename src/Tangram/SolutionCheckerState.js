import { app } from '../Core/App';
import { State } from '../Core/States/State';
import { html } from 'lit-element';
import { Point } from '../Core/Objects/Point';
import { Segment } from '../Core/Objects/Segment';
import { TangramManager } from './TangramManager';

/**
 * Créer un tangram
 */
export class SolutionCheckerState extends State {
  constructor() {
    super('solveChecker', 'Vérifier solution Tangram', '');

    this.buttons = null;

    window.addEventListener('new-window', () => this.finish());

    window.addEventListener('remove-solution-checker', () => this.finish());

    window.addEventListener('file-parsed', () => app.setState(this.name));
  }

  /**
   * initialiser l'état
   */
  start() {
    TangramManager.initShapes();
    this.showStateMenu();
    window.addEventListener('state-menu-button-click', this.handler);
  }

  restart() {}

  finish() {
    window.dispatchEvent(new CustomEvent('close-state-menu'));
    window.removeEventListener('state-menu-button-click', this.handler);
  }

  end() {}

  /**
   * Main event handler
   */
  _actionHandle(event) {
    if (event.type == 'state-menu-button-click') {
      this.clickOnStateMenuButton(event.detail);
    } else {
      console.error('unsupported event type : ', event.type);
    }
  }

  /**
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
    let toolName = this.title;
    return html`
      <h2>${toolName}</h2>
      <p>
        Vous avez sélectionné l'outil <b>"${toolName}"</b>.<br />
        Vous pouvez réaliser le Tangram et vérifier votre solution en appuyant
        sur le bouton prévu à cet effet.<br />
      </p>
    `;
  }

  showStateMenu() {
    if (document.querySelector('state-menu')) return;
    import('./state-menu');
    const menu = document.createElement('state-menu');
    menu.buttons = [
      {
        text: 'Vérifier solution',
        value: 'check',
      },
    ];
    document.querySelector('body').appendChild(menu);
  }

  clickOnStateMenuButton(btn_value) {
    if (btn_value == 'check') {
      this.checkSolution();
    }
  }

  checkSolution() {
    const allPointsFromWorkspace = this.getAllPoints(app.workspace.shapes);
    const allPointsFromSilhouette = this.getAllPoints(app.silhouette.shapes);

    // allPointsFromWorkspace.forEach(pt =>
    //   window.dispatchEvent(
    //     new CustomEvent('draw-point', {
    //       detail: { point: pt, color: '#f00', size: 2 },
    //     })
    //   )
    // );
    // allPointsFromSilhouette.forEach(pt =>
    //   window.dispatchEvent(
    //     new CustomEvent('draw-point', {
    //       detail: { point: pt, color: '#f00', size: 2 },
    //     })
    //   )
    // );

    const setEquality = this.comparePointSets(
      allPointsFromWorkspace,
      allPointsFromSilhouette
    );

    window.dispatchEvent(
      new CustomEvent('show-notif', { detail: { message: setEquality } })
    );
  }

  comparePointSets(allPointsFromWorkspace, allPointsFromSilhouette) {
    if (this.compareStrictSets(allPointsFromWorkspace, allPointsFromSilhouette))
      return 'Equal';
    else if (
      this.compareRotationSets(allPointsFromWorkspace, allPointsFromSilhouette)
    )
      return 'Rotation';
    else if (
      this.compareReverseSets(allPointsFromWorkspace, allPointsFromSilhouette)
    )
      return 'Reverse';
    else if (
      this.compareReverseAndRotationSets(
        allPointsFromWorkspace,
        allPointsFromSilhouette
      )
    )
      return 'Reverse and rotation';
    else return 'Not equal';
  }

  compareReverseAndRotationSets(
    allPointsFromWorkspace,
    allPointsFromSilhouette
  ) {
    let allPointsFromWorkspaceCopy = allPointsFromWorkspace.map(
      pt => new Point(pt)
    );

    let symetricalAxe = new Segment(new Point(0, 0), new Point(0, 100));

    allPointsFromWorkspaceCopy.forEach(pt =>
      this.computePointPosition(pt, symetricalAxe)
    );

    return this.compareRotationSets(
      allPointsFromWorkspaceCopy,
      allPointsFromSilhouette
    );
  }

  compareReverseSets(allPointsFromWorkspace, allPointsFromSilhouette) {
    let allPointsFromWorkspaceCopy = allPointsFromWorkspace.map(
      pt => new Point(pt)
    );

    let symetricalAxe = new Segment(new Point(0, 0), new Point(0, 100));

    allPointsFromWorkspaceCopy.forEach(pt =>
      this.computePointPosition(pt, symetricalAxe)
    );

    return this.compareStrictSets(
      allPointsFromWorkspaceCopy,
      allPointsFromSilhouette
    );
  }

  computePointPosition(point, axe) {
    let center = axe.projectionOnSegment(point);

    //Calculer la nouvelle position du point à partir de l'ancienne et de la projection.
    point.setCoordinates({
      x: point.x + 2 * (center.x - point.x),
      y: point.y + 2 * (center.y - point.y),
    });
  }

  compareRotationSets(allPointsFromWorkspace, allPointsFromSilhouette) {
    let allPointsFromWorkspaceCopy = allPointsFromWorkspace.map(
      pt => new Point(pt)
    );

    for (let i = 0; i < 360; i += 5) {
      allPointsFromWorkspaceCopy.forEach(pt => pt.rotate((5 * Math.PI) / 180));
      if (
        this.compareStrictSets(
          allPointsFromWorkspaceCopy,
          allPointsFromSilhouette
        )
      )
        return true;
    }
    return false;
  }

  compareStrictSets(allPointsFromWorkspace, allPointsFromSilhouette) {
    let minWorkspace = this.minFromPoints(allPointsFromWorkspace);
    let minSilhouette = this.minFromPoints(allPointsFromSilhouette);

    // window.dispatchEvent(new CustomEvent('draw-point', { detail: {point: minWorkspace, color:'#00f', size: 3}}));
    // window.dispatchEvent(new CustomEvent('draw-point', { detail: {point: minSilhouette, color:'#00f', size: 3}}));

    let offset = minSilhouette.subCoordinates(minWorkspace);

    let allPointsFromWorkspaceCopy = allPointsFromWorkspace.map(
      pt => new Point(pt)
    );
    let allPointsFromSilhouetteCopy = allPointsFromSilhouette.map(
      pt => new Point(pt)
    );

    allPointsFromWorkspaceCopy.forEach(pt => pt.translate(offset));

    while (allPointsFromWorkspaceCopy.length > 0) {
      let i = 0;
      for (; i < allPointsFromSilhouetteCopy.length; i++) {
        if (
          allPointsFromWorkspaceCopy[0].equal(allPointsFromSilhouetteCopy[i])
        ) {
          allPointsFromWorkspaceCopy.splice(0, 1);
          allPointsFromSilhouetteCopy.splice(i, 1);
          i = -1;
          break;
        }
      }
      if (i == allPointsFromSilhouetteCopy.length) return false;
    }
    return true;
  }

  minFromPoints(pointSet) {
    let result = new Point(pointSet[0]);
    pointSet.forEach(pt => {
      result.x = Math.min(pt.x, result.x);
      result.y = Math.min(pt.y, result.y);
    });
    return result;
  }

  getAllPoints(shapes) {
    const newSegments = this.checkGroupMerge(shapes);
    const newSegmentsSets = this.linkNewSegments(newSegments);

    return newSegmentsSets.flat().map(seg => seg.vertexes[1]);
  }

  checkGroupMerge(shapes) {
    // check if a shape overlaps another one
    if (
      shapes.some(shape =>
        shapes.some(s => {
          if (s.id == shape.id) return false;
          else return s.overlapsWith(shape);
        })
      )
    )
      return null;

    let oldSegments = shapes.map(s => s.segments.map(seg => seg.copy())).flat();

    let cutSegments = oldSegments
      .map((segment, idx, segments) => {
        let vertexesInside = segments
          .filter((seg, i) => i != idx)
          .map(seg =>
            seg.vertexes.filter(
              vertex =>
                segment.isPointOnSegment(vertex) &&
                !segment.vertexes.some(vert => vert.equal(vertex))
            )
          )
          .flat()
          .filter(
            (vertex, idx, vertexes) =>
              vertexes.findIndex(v => v.equal(vertex)) == idx
          );
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

    // let internalSegments = cutSegments.filter(
    //   oldSeg => !newSegments.some(newSeg => oldSeg.isSubsegment(newSeg))
    // );

    return newSegments;
  }

  linkNewSegments(segmentsList) {
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
          seg => !seg.isUsed && seg.contains(currentSegment.vertexes[1], false)
        );
        if (newPotentialSegments.length == 0) {
          console.warn('shape cannot be closed (dead end)');
          return null;
        } else if (newPotentialSegments.length > 1) {
          newSegmentsSets.push([]);
          meetingPoints.push(currentSegment.vertexes[1]);
        }
        nextSegment = newPotentialSegments[0].copy(false);
        newPotentialSegments[0].isUsed = true;
        if (nextSegment.vertexes[1].equal(currentSegment.vertexes[1]))
          nextSegment.reverse(true);

        newSegmentsSets[newSegmentsSets.length - 1].push(nextSegment);
        currentSegment = nextSegment;

        let meetingPointIndex = meetingPoints.findIndex(mtPt =>
          currentSegment.vertexes[1].equal(mtPt)
        );
        if (meetingPointIndex != -1) {
          savedSegmentSets.push(
            newSegmentsSets.splice(meetingPointIndex).flat()
          );
          meetingPoints.splice(meetingPointIndex);
        }
        segmentUsed++;
      }
      const cleanedSegmentsSets = savedSegmentSets.map(segmentSet => {
        for (let i = 0; i < segmentSet.length; i++) {
          if (
            segmentSet[i].hasSameDirection(
              segmentSet[(i + 1) % segmentSet.length],
              1,
              0,
              false
            )
          ) {
            segmentSet[i].vertexes[1] =
              segmentSet[(i + 1) % segmentSet.length].vertexes[1];
            segmentSet.splice((i + 1) % segmentSet.length, 1);
          }
        }
        return segmentSet;
      });
      newSegments.push(...cleanedSegmentsSets);
    }
    return newSegments;
  }

  compareAllSets(sets1, sets2) {
    // if (sets1.length != sets2.length)
    //   return false

    sets1.sort((elem1, elem2) => (elem1.length < elem2.length ? 1 : -1));
    sets2.sort((elem1, elem2) => (elem1.length < elem2.length ? 1 : -1));

    // vérifie que les longueur des segments
    sets1.forEach((set, idx, sets) => (sets[idx] = set.map(seg => seg.length)));
    sets2.forEach((set, idx, sets) => (sets[idx] = set.map(seg => seg.length)));

    while (sets1.length != 0) {
      // on enlève les sets semblables juqu'a ne plus en avoir
      let currentFirstWorkingSet = sets1[0];
      let sets2Iterator = 0;
      for (; sets2Iterator < sets2.length; sets2Iterator++) {
        let currentSecondWorkingSet = sets2[sets2Iterator];
        // si tous les sets de la meme longueur ont été vérifié et qu'aucun ne match
        if (currentFirstWorkingSet.length != currentSecondWorkingSet.length)
          return false;
        // si les deux sets sont les mêmes, les enlève
        if (
          this.compareSets(currentFirstWorkingSet, currentSecondWorkingSet) ==
          true
        ) {
          sets1.splice(0, 1);
          sets2.splice(sets2Iterator, 1);
          sets2Iterator = -1;
          break;
        }
      }
      // si aucun set ne match
      if (sets2Iterator == sets2.length) return false;
    }
    return true;
  }

  compareSets(set1, set2) {
    let startLength = set1[0];
    for (let i = 0; i < set2.length; i++) {
      if (this.compareLength(set2[i], startLength)) {
        if (this.iterateOverSets(set1, set2, i, 1)) return true;
        else if (this.iterateOverSets(set1, set2, i, -1)) return true;
      }
    }
    return false;
  }

  iterateOverSets(set1, set2, set2Start, set2Direction) {
    for (
      let set1Iterator = 0, set2Iterator = set2Start;
      set1Iterator < set1.length;
      set1Iterator++
    ) {
      if (this.compareLength(set1[set1Iterator], set2[set2Iterator])) {
        set2Iterator += set2Direction;
        if (set2Iterator < 0) set2Iterator = set2.length - 1;
        else if (set2Iterator == set2.length) set2Iterator = 0;
      } else {
        return false;
      }
    }
    return true;
  }

  compareLength(length1, length2) {
    return Math.abs(length1 - length2) < 0.01;
  }
}
