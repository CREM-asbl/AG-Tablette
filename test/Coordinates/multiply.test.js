import { expect } from '@esm-bundle/chai';
import { Coordinates } from '../../src/controllers/Core/Objects/Coordinates';

it('Coordinates.multiply', () => {
  expect(new Coordinates({ x: 2, y: 4 }).multiply(1)).to.deep.equal(new Coordinates({ x: 2, y: 4 }));
  expect(new Coordinates({ x: 2, y: 4 }).multiply(3)).to.deep.equal(new Coordinates({ x: 6, y: 12 }));
  expect(new Coordinates({ x: 2, y: 4 }).multiply(-2)).to.deep.equal(new Coordinates({ x: -4, y: -8 }));
});
