import { createQuadrilateralHelpConfig } from '@controllers/CreateQuadrilateral/createQuadrilateral.helpConfig';
import { createTriangleHelpConfig } from '@controllers/CreateTriangle/createTriangle.helpConfig';
import { describe, expect, it } from 'vitest';

describe('shape creation help configs', () => {
  it('shows triangle selector help during initialized step', () => {
    expect(
      createTriangleHelpConfig.getStepConfig({ currentStep: 'initialized' }),
    ).toEqual({
      target: 'shape-selector',
      text: '📌 Choisis le type de triangle',
    });
  });

  it('shows quadrilateral selector help during initialized step', () => {
    expect(
      createQuadrilateralHelpConfig.getStepConfig({ currentStep: 'initialized' }),
    ).toEqual({
      target: 'shape-selector',
      text: '📌 Choisis une forme de quadrilatère',
    });
  });
});