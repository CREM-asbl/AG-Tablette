import { describe, expect, it, vi } from 'vitest';
import { duplicateShape, compareIdBetweenLayers } from '../../../../src/controllers/Core/Tools/shapesTools';

vi.mock('../../../../src/controllers/Core/App', () => ({
    app: {
        environment: { name: 'Geometrie' }
    }
}));

vi.mock('../../../../src/controllers/Core/Objects/CharacteristicElements', () => ({
    CharacteristicElements: class {
        constructor(props) {
            Object.assign(this, props);
        }
    }
}));

vi.mock('../../../../src/controllers/Core/Objects/Shapes/GeometryObject', () => ({
    GeometryObject: class {
        constructor(props) {
            Object.assign(this, props);
        }
    }
}));

vi.mock('../../../../src/controllers/Core/Tools/general', () => ({
    addInfoToId: vi.fn((id, info) => id ? id + '_' + info : id)
}));

describe('shapesTools', () => {
    describe('duplicateShape', () => {
        it('should duplicate a simple shape', () => {
            const mockShape = {
                constructor: vi.fn().mockImplementation(function(props) {
                    Object.assign(this, props);
                }),
                layer: 'main',
                getSVGPath: vi.fn(() => 'M 0 0'),
                divisionPoints: [],
                segments: [{ id: 'seg1', color: 'red', vertexIds: [], divisionPointIds: [] }],
                points: [{ id: 'pt1', color: 'blue', segmentIds: [], visible: true }],
                geometryObject: {
                    geometryChildShapeIds: [],
                    geometryTransformationChildShapeIds: [],
                    geometryDuplicateChildShapeIds: [],
                    geometryMultipliedChildShapeIds: []
                }
            };

            const result = duplicateShape(mockShape, 'upper');

            expect(result.layer).toBe('upper');
            expect(result.segments[0].id).toBe('seg1_upper');
            expect(result.points[0].id).toBe('pt1_upper');
        });

        it('should handle complex geometry objects', () => {
            const mockShape = {
                constructor: vi.fn().mockImplementation(function(props) {
                    Object.assign(this, props);
                }),
                layer: 'main',
                getSVGPath: vi.fn(() => 'M 0 0'),
                divisionPoints: [],
                segments: [],
                points: [],
                geometryObject: {
                    geometryChildShapeIds: ['c1'],
                    geometryParentObjectId1: 'p1',
                    geometryParentObjectId2: 'p2',
                    geometryTransformationChildShapeIds: ['tc1'],
                    geometryTransformationParentShapeId: 'tp1',
                    geometryDuplicateChildShapeIds: ['dc1'],
                    geometryDuplicateParentShapeId: 'dp1',
                    geometryMultipliedChildShapeIds: ['mc1'],
                    geometryMultipliedParentShapeId: 'mp1',
                    geometryTransformationCharacteristicElements: {
                        elementIds: ['e1']
                    }
                }
            };

            const result = duplicateShape(mockShape, 'upper');

            expect(result.geometryObject.geometryChildShapeIds).toContain('c1_upper');
            expect(result.geometryObject.geometryTransformationCharacteristicElements.elementIds).toContain('e1_upper');
        });
    });

    describe('compareIdBetweenLayers', () => {
        it('should return true if prefix matches', () => {
            expect(compareIdBetweenLayers('123456789', '123456780')).toBe(true);
        });

        it('should return false if prefix differs', () => {
            expect(compareIdBetweenLayers('12345678', '87654321')).toBe(false);
        });
    });
});
