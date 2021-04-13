import { expect } from '@esm-bundle/chai';
import { Coordinates } from '../../src/Core/Objects/Coordinates';

it('Coordinates.equal', () => {
  expect(new Coordinates({x: 2, y: 4}).equal(new Coordinates({x: 2, y: 4}))).to.be.true;
  expect(new Coordinates({x: 2, y: 4}).equal(new Coordinates({x: 3, y: 4}))).to.be.false;
  expect(new Coordinates({x: 2, y: 4}).equal(new Coordinates({x: 3, y: 4}), 1.1)).to.be.true;
  expect(new Coordinates({x: 2, y: 4}).equal(new Coordinates({x: 3, y: 4}), 1)).to.be.false;
});
