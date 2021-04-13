import { expect } from '@esm-bundle/chai';
import { Coordinates } from '../../src/Core/Objects/Coordinates';

it('Coordinates.substract', () => {
  expect(new Coordinates({x: 2, y: 4}).substract(new Coordinates({x: 5, y: 1}))).to.deep.equal(new Coordinates({x: -3, y: 3}));
});
