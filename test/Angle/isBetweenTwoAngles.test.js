import { expect } from '@esm-bundle/chai';
import { Angle } from '../../src/Core/Objects/Angle';

it('Angle.isBetweenTwoAngles', () => {
  const Pi = new Angle(Math.PI);
  const DemiPi = new Angle(Math.PI / 2);
  const ThreeDemiPi = new Angle(Math.PI * 3 / 2);
  expect(Pi.isBetweenTwoAngles(DemiPi, ThreeDemiPi, false)).to.be.true;
  expect(Pi.isBetweenTwoAngles(DemiPi, ThreeDemiPi, true)).to.be.false;
  expect(Pi.isBetweenTwoAngles(ThreeDemiPi, DemiPi, true)).to.be.true;
  expect(Pi.isBetweenTwoAngles(ThreeDemiPi, DemiPi, false)).to.be.false;
});
