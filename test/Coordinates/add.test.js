import { expect } from '@esm-bundle/chai';
import { Coordinates } from '../../src/controllers/Core/Objects/Coordinates';

it('Coordinates.add', () => {
  expect(new Coordinates({ x: 2, y: 4 }).add(new Coordinates({ x: 5, y: 1 }))).to.deep.equal(new Coordinates({ x: 7, y: 5 }));
});
