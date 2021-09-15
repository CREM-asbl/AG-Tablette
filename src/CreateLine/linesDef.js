import { GeometryConstraint } from '../Core/Objects/GeometryConstraint';
import { Coordinates } from '../Core/Objects/Coordinates';
import { Segment } from '../Core/Objects/Segment';
import { Point } from '../Core/Objects/Point';
import { app } from '../Core/App';

export const Segment = {
  numberOfPointsToRequired: 2,
  constraints: [
    () => new GeometryConstraint('isFree'),
    () => new GeometryConstraint('isFree'),
  ],
  finishShape: () => {}
}

export const ParalleleSegment = {
  numberOfPointsToRequired: 2,
  constraints: [
    () => new GeometryConstraint('isFree'),
    () => new GeometryConstraint('isFree'),
  ],
  finishShape: () => {}
}